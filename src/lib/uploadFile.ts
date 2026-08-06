"use client";

export type UploadKind = "video" | "caption" | "resume";

export interface UploadResult {
  url: string;
  publicUrl: string;
}

async function uploadViaFormData(
  file: File,
  token: string | null
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/upload", {
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
      const metaRes = await fetch("/api/upload", {
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
        const putRes = await fetch(meta.uploadUrl, {
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

export function buildPlaybackUrl(url: string, token?: string | null): string {
  if (!url) return url;
  if (url.startsWith("http")) return url;
  return `${url}${token ? `?token=${encodeURIComponent(token)}` : ""}`;
}
