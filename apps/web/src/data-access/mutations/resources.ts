import type { components } from "@educhain/api-contract";

import { apiClient } from "@/data-access/http/client";
import { getCsrfToken } from "@/data-access/http/csrf";
import { ensureApiSuccess, unwrapApiResult } from "@/data-access/http/result";

type CreateResourceDraftRequest = components["schemas"]["CreateResourceDraftRequest"];
type UpdateResourceDraftRequest = components["schemas"]["UpdateResourceDraftRequest"];
type CreateUploadRequest = components["schemas"]["CreateUploadRequest"];
type UploadPurpose = components["schemas"]["UploadPurpose"];
type RestoreResourceVersionRequest = components["schemas"]["RestoreResourceVersionRequest"];

export async function createResourceDraft(body: CreateResourceDraftRequest) {
  const csrfToken = await getCsrfToken();
  return unwrapApiResult(
    await apiClient.POST("/resources", {
      body,
      params: { header: { "Idempotency-Key": crypto.randomUUID() } },
      headers: { "X-XSRF-TOKEN": csrfToken },
    }),
  );
}

export async function updateResourceDraft(
  resourceId: string,
  body: UpdateResourceDraftRequest,
  version: number,
) {
  const csrfToken = await getCsrfToken();
  return unwrapApiResult(
    await apiClient.PATCH("/resources/{resourceId}/draft", {
      body,
      params: {
        path: { resourceId },
        header: { "If-Match": `"${version}"` },
      },
      headers: { "X-XSRF-TOKEN": csrfToken },
    }),
  );
}

export async function publishResource(resourceId: string, version: number) {
  const csrfToken = await getCsrfToken();
  return unwrapApiResult(
    await apiClient.POST("/resources/{resourceId}/publications", {
      params: {
        path: { resourceId },
        header: {
          "If-Match": `"${version}"`,
          "Idempotency-Key": crypto.randomUUID(),
        },
      },
      headers: { "X-XSRF-TOKEN": csrfToken },
    }),
  );
}

export async function restoreResourceVersion(
  resourceId: string,
  body: RestoreResourceVersionRequest,
  draftVersion: number,
) {
  const csrfToken = await getCsrfToken();
  return unwrapApiResult(
    await apiClient.POST("/resources/{resourceId}/draft-restorations", {
      body,
      params: {
        path: { resourceId },
        header: { "If-Match": `"${draftVersion}"` },
      },
      headers: { "X-XSRF-TOKEN": csrfToken },
    }),
  );
}

export async function withdrawOwnResource(resourceId: string, reason: string) {
  const csrfToken = await getCsrfToken();
  return unwrapApiResult(
    await apiClient.POST("/resources/{resourceId}/withdrawals", {
      body: { reason },
      params: { path: { resourceId } },
      headers: { "X-XSRF-TOKEN": csrfToken },
    }),
  );
}

export async function restoreOwnResource(resourceId: string, reason: string) {
  const csrfToken = await getCsrfToken();
  return unwrapApiResult(
    await apiClient.POST("/resources/{resourceId}/restorations", {
      body: { reason },
      params: { path: { resourceId } },
      headers: { "X-XSRF-TOKEN": csrfToken },
    }),
  );
}

export async function createUpload(body: CreateUploadRequest) {
  const csrfToken = await getCsrfToken();
  return unwrapApiResult(
    await apiClient.POST("/uploads", {
      body,
      params: { header: { "Idempotency-Key": crypto.randomUUID() } },
      headers: { "X-XSRF-TOKEN": csrfToken },
    }),
  );
}

export async function putUploadContent(uploadUrl: string, file: File): Promise<void> {
  const csrfToken = await getCsrfToken();
  const response = await fetch(uploadUrl, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/octet-stream",
      "X-XSRF-TOKEN": csrfToken,
    },
    body: file,
  });
  if (response.ok) return;
  const error = await response.json().catch(() => undefined);
  ensureApiSuccess({ error, response });
}

export async function completeUpload(uploadId: string) {
  const csrfToken = await getCsrfToken();
  return unwrapApiResult(
    await apiClient.POST("/uploads/{uploadId}/completion", {
      params: { path: { uploadId } },
      headers: { "X-XSRF-TOKEN": csrfToken },
    }),
  );
}

export async function uploadFile(file: File, purpose: UploadPurpose) {
  const session = await createUpload({
    purpose,
    fileName: file.name,
    size: file.size,
    mediaType: file.type || mediaTypeFromName(file.name),
  });
  await putUploadContent(session.uploadUrl, file);
  return completeUpload(session.uploadId);
}

export async function uploadResourceAttachment(file: File) {
  return uploadFile(file, "RESOURCE_ATTACHMENT");
}

export async function uploadResourceCover(file: File) {
  return uploadFile(file, "RESOURCE_COVER");
}

export async function uploadAvatar(file: File) {
  return uploadFile(file, "AVATAR");
}

function mediaTypeFromName(fileName: string): string {
  const extension = fileName.toLowerCase().split(".").pop();
  return (
    {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      mp4: "video/mp4",
      pdf: "application/pdf",
      txt: "text/plain",
      md: "text/markdown",
      markdown: "text/markdown",
    }[extension ?? ""] ?? "application/octet-stream"
  );
}
