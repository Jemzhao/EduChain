package com.educhain.file.service;

import java.io.InputStream;

public record FileContent(
        InputStream inputStream,
        String mediaType,
        String fileName,
        long size,
        String sha256
) {
}
