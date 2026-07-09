import type { components } from "@educhain/api-contract";

import { mockProjectPeriod } from "@/mocks/clock";
import { readMockSession, writeMockSession } from "@/mocks/state/session-storage";

type CreateUploadRequest = components["schemas"]["CreateUploadRequest"];
type UploadSessionResponse = components["schemas"]["UploadSessionResponse"];
type FileResponse = components["schemas"]["FileResponse"];

type MockUpload = {
  request: CreateUploadRequest;
  session: UploadSessionResponse;
  bytesBase64?: string;
  file: FileResponse;
};

const storageKey = "educhain.mock.files.v1";
const uploads = new Map<string, MockUpload>();
const volatileBytes = new Map<string, ArrayBuffer>();
let hydrated = false;

function hydrate(): void {
  if (hydrated) return;
  hydrated = true;
  const stored = readMockSession<Array<[string, MockUpload]>>(storageKey);
  for (const [uploadId, upload] of stored ?? []) uploads.set(uploadId, upload);
}

function persist(): void {
  writeMockSession(
    storageKey,
    [...uploads].map(([uploadId, { request, session, file, bytesBase64 }]) => [
      uploadId,
      { request, session, file, bytesBase64 },
    ]),
  );
}

export const fileState = {
  create(request: CreateUploadRequest): UploadSessionResponse {
    hydrate();
    const uploadId = crypto.randomUUID();
    const fileId = crypto.randomUUID();
    const session: UploadSessionResponse = {
      uploadId,
      fileId,
      uploadUrl: `/api/v1/uploads/${uploadId}/content`,
      method: "PUT",
      expiresAt: mockProjectPeriod.end,
      maxSize: 26_214_400,
    };
    uploads.set(uploadId, {
      request,
      session,
      file: {
        id: fileId,
        purpose: request.purpose,
        fileName: request.fileName,
        size: request.size,
        declaredMediaType: request.mediaType,
        detectedMediaType: null,
        sha256: null,
        status: "CREATED",
        rejectionCode: null,
      },
    });
    persist();
    return structuredClone(session);
  },
  receive(uploadId: string, bytes: ArrayBuffer): boolean {
    hydrate();
    const upload = uploads.get(uploadId);
    if (!upload) return false;
    volatileBytes.set(uploadId, bytes);
    upload.bytesBase64 = bytes.byteLength <= 2_000_000 ? bytesToBase64(bytes) : undefined;
    upload.file.status = "SCANNING";
    return true;
  },
  async complete(uploadId: string): Promise<FileResponse | undefined> {
    hydrate();
    const upload = uploads.get(uploadId);
    if (!upload) return undefined;
    const bytes =
      volatileBytes.get(uploadId) ??
      (upload.bytesBase64 ? base64ToBytes(upload.bytesBase64) : undefined);
    if (!bytes) return undefined;
    if (bytes.byteLength !== upload.request.size) {
      upload.file.status = "REJECTED";
      upload.file.rejectionCode = "UPLOAD_SIZE_MISMATCH";
      persist();
      return structuredClone(upload.file);
    }
    const digestInput = new Uint8Array(bytes.byteLength);
    digestInput.set(new Uint8Array(bytes));
    const digest = await crypto.subtle.digest("SHA-256", digestInput);
    upload.file.sha256 = [...new Uint8Array(digest)]
      .map((value) => value.toString(16).padStart(2, "0"))
      .join("");
    upload.file.detectedMediaType = upload.request.mediaType;
    upload.file.status = "AVAILABLE";
    persist();
    return structuredClone(upload.file);
  },
  getByFileId(fileId: string): FileResponse | undefined {
    hydrate();
    const upload = [...uploads.values()].find(({ file }) => file.id === fileId);
    return upload ? structuredClone(upload.file) : undefined;
  },
  contentByFileId(fileId: string): { bytes: Uint8Array; mediaType: string } | undefined {
    hydrate();
    const upload = [...uploads.values()].find(({ file }) => file.id === fileId);
    if (!upload || upload.file.status !== "AVAILABLE") return undefined;
    const bytes =
      volatileBytes.get(upload.session.uploadId) ??
      (upload.bytesBase64 ? base64ToBytes(upload.bytesBase64) : undefined);
    if (!bytes) return undefined;
    return {
      bytes: new Uint8Array(bytes),
      mediaType: upload.file.detectedMediaType ?? "application/octet-stream",
    };
  },
};

function bytesToBase64(bytes: ArrayBuffer): string {
  const values = new Uint8Array(bytes);
  let binary = "";
  for (let index = 0; index < values.length; index += 1) {
    binary += String.fromCharCode(values[index]!);
  }
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}
