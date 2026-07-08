package com.educhain.file.service;

import com.educhain.file.config.FileStorageProperties;
import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.security.DigestInputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import org.springframework.stereotype.Component;

@Component
public class LocalObjectStorage {

    private static final int BUFFER_SIZE = 16 * 1024;
    private static final int SIGNATURE_SIZE = 8 * 1024;

    private final Path root;

    public LocalObjectStorage(FileStorageProperties properties) {
        this.root = Path.of(properties.root()).toAbsolutePath().normalize();
    }

    public long write(String storageKey, InputStream source, long maxBytes) {
        Path target = resolve(storageKey);
        Path temporary = target.resolveSibling(target.getFileName() + ".part");
        try {
            Files.createDirectories(target.getParent());
            long received = copyLimited(source, temporary, maxBytes);
            Files.move(
                    temporary,
                    target,
                    StandardCopyOption.ATOMIC_MOVE,
                    StandardCopyOption.REPLACE_EXISTING
            );
            return received;
        } catch (UploadLimitExceededException exception) {
            deleteTemporary(temporary);
            throw exception;
        } catch (IOException exception) {
            deleteTemporary(temporary);
            throw new ObjectStorageException("Unable to store uploaded content", exception);
        }
    }

    public StoredObjectInspection inspect(String storageKey, String declaredMediaType) {
        Path target = resolve(storageKey);
        try (InputStream raw = new BufferedInputStream(Files.newInputStream(target))) {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] signature = new byte[SIGNATURE_SIZE];
            int signatureLength = 0;
            long size = 0;
            try (DigestInputStream input = new DigestInputStream(raw, digest)) {
                byte[] buffer = new byte[BUFFER_SIZE];
                int read;
                while ((read = input.read(buffer)) >= 0) {
                    if (signatureLength < signature.length) {
                        int copyLength = Math.min(read, signature.length - signatureLength);
                        System.arraycopy(buffer, 0, signature, signatureLength, copyLength);
                        signatureLength += copyLength;
                    }
                    size += read;
                }
            }
            return new StoredObjectInspection(
                    size,
                    detectMediaType(signature, signatureLength, declaredMediaType),
                    HexFormat.of().formatHex(digest.digest())
            );
        } catch (IOException | NoSuchAlgorithmException exception) {
            throw new ObjectStorageException("Unable to inspect uploaded content", exception);
        }
    }

    public InputStream open(String storageKey) {
        try {
            return new BufferedInputStream(Files.newInputStream(resolve(storageKey)));
        } catch (IOException exception) {
            throw new ObjectStorageException("Unable to read stored content", exception);
        }
    }

    private long copyLimited(InputStream source, Path temporary, long maxBytes) throws IOException {
        try (InputStream input = new BufferedInputStream(source);
                BufferedOutputStream output = new BufferedOutputStream(Files.newOutputStream(temporary))) {
            byte[] buffer = new byte[BUFFER_SIZE];
            long total = 0;
            int read;
            while ((read = input.read(buffer)) >= 0) {
                total += read;
                if (total > maxBytes) {
                    throw new UploadLimitExceededException();
                }
                output.write(buffer, 0, read);
            }
            return total;
        }
    }

    private String detectMediaType(byte[] bytes, int length, String declaredMediaType) {
        if (startsWith(bytes, length, "%PDF-".getBytes(StandardCharsets.US_ASCII))) {
            return "application/pdf";
        }
        if (startsWith(bytes, length, new byte[] {(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a})) {
            return "image/png";
        }
        if (length >= 3 && bytes[0] == (byte) 0xff && bytes[1] == (byte) 0xd8 && bytes[2] == (byte) 0xff) {
            return "image/jpeg";
        }
        if (length >= 12
                && startsWith(bytes, length, "RIFF".getBytes(StandardCharsets.US_ASCII))
                && ByteBuffer.wrap(bytes, 8, 4).getInt() == 0x57454250) {
            return "image/webp";
        }
        if (length >= 12
                && bytes[4] == 'f'
                && bytes[5] == 't'
                && bytes[6] == 'y'
                && bytes[7] == 'p') {
            return "video/mp4";
        }
        if (declaredMediaType.equals("text/plain") || declaredMediaType.equals("text/markdown")) {
            for (int index = 0; index < length; index++) {
                if (bytes[index] == 0) {
                    return "application/octet-stream";
                }
            }
            return declaredMediaType;
        }
        return "application/octet-stream";
    }

    private boolean startsWith(byte[] value, int valueLength, byte[] signature) {
        if (valueLength < signature.length) {
            return false;
        }
        for (int index = 0; index < signature.length; index++) {
            if (value[index] != signature[index]) {
                return false;
            }
        }
        return true;
    }

    private Path resolve(String storageKey) {
        Path target = root.resolve(storageKey).normalize();
        if (!target.startsWith(root)) {
            throw new IllegalArgumentException("Storage key leaves configured root");
        }
        return target;
    }

    private void deleteTemporary(Path temporary) {
        try {
            Files.deleteIfExists(temporary);
        } catch (IOException ignored) {
            // A retention cleanup job handles orphaned temporary files.
        }
    }

    public static final class UploadLimitExceededException extends RuntimeException {
    }

    public static final class ObjectStorageException extends RuntimeException {
        public ObjectStorageException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
