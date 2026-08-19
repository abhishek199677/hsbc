"use client";

export type UploadKind = "video" | "caption" | "resume";

export interface UploadResult {
  url: string;
  publicUrl: string;
}

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = MAX_RETRIES
): Promise<Response> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.status === 429 && attempt < retries) {
        const retryAfter = res.headers.get("Retry-After");
        const delay = retryAfter
          ? parseInt(retryAfter, 10) * 1000
          : BASE_DELAY_MS * Math.pow(2, attempt);
        await sleep(delay);
        continue;
      }
      return res;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < retries) {
        await sleep(BASE_DELAY_MS * Math.pow(2, attempt));
      }
    }
  }
  throw lastError || new Error("Fetch failed after retries");
}

async function uploadViaFormData(
  file: File,
  token: string | null
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetchWithRetry("/api/upload", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || "Upload failed");
  }
  return { url: data.file.url, publicUrl: data.file.url };
}

export async function uploadFile(
  file: File,
  kind: UploadKind,
  token: string | null
): Promise<UploadResult> {
  if (kind === "video") {
    // Try direct-to-R2 presigned PUT first (avoids the hosting function body limit).
    try {
      const metaRes = await fetchWithRetry("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          filename: file.name,
          type: file.type,
          size: file.size,
          kind,
        }),
      });
      const meta = await metaRes.json();
      if (metaRes.ok && meta.success && meta.uploadUrl) {
        const putRes = await fetchWithRetry(meta.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!putRes.ok) {
          throw new Error(`Direct upload failed (${putRes.status})`);
        }
        return { url: meta.fileUrl, publicUrl: meta.publicUrl || meta.fileUrl };
      }
    } catch (error) {
      console.error("Direct video upload failed, falling back:", error);
    }
  }
  return uploadViaFormData(file, token);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function buildPlaybackUrl(url: string, _token?: string | null): string {
  if (!url) return url;
  if (url.startsWith("http")) return url;
  return url;
}
