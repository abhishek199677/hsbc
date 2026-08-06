import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";
import { rateLimitByIp } from "@/lib/rateLimit";
import {
  saveFile,
  canonicalUrl,
  getPresignedUploadUrl,
  getPresignedUrl,
} from "@/lib/storage";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const VIDEO_TYPES = ["video/webm", "video/mp4", "video/quicktime"];
const CAPTION_TYPES = ["text/vtt"];

function isVideoType(type: string) {
  return VIDEO_TYPES.some((t) => type.startsWith(t));
}
function isCaptionType(type: string) {
  return CAPTION_TYPES.includes(type);
}

export async function POST(request: Request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = rateLimitByIp(request, "upload", { limit: 60, windowMs: 60_000 });
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const contentType = request.headers.get("content-type") || "";

    // JSON metadata mode: used for large video uploads.
    // The server issues a short-lived presigned PUT URL so the browser can
    // upload directly to Cloudflare R2 (bypasses the hosting function body limit).
    if (contentType.includes("application/json")) {
      const body = await request.json();
      const { filename, type, size, kind } = body;

      if (!isVideoType(type || "")) {
        return NextResponse.json({ error: "Only video uploads are supported in this mode" }, { status: 400 });
      }

      const maxSize = 200 * 1024 * 1024;
      if (typeof size !== "number" || size > maxSize) {
        return NextResponse.json(
          { error: "File size exceeds 200MB limit" },
          { status: 400 }
        );
      }

      const key = buildKey(user.organizationId, "interviews", filename, "webm");
      const uploadUrl = await getPresignedUploadUrl(key, type);

      if (!uploadUrl) {
        // Local development: fall back to multipart upload.
        return NextResponse.json({ error: "Multipart upload required" }, { status: 400 });
      }

      const fileUrl = canonicalUrl(key);
      const publicUrl = (await getPresignedUrl(key)) || fileUrl;

      return NextResponse.json({
        success: true,
        uploadUrl,
        fileUrl,
        publicUrl,
        filename,
        size,
        type,
      });
    }

    // Multipart form-data mode: resumes, captions, and local-dev video uploads.
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const isVideo = isVideoType(file.type);
    const isCaption = isCaptionType(file.type);
    if (!isVideo && !isCaption && !ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload PDF, DOC, DOCX, a video recording, or a caption (.vtt) file" },
        { status: 400 }
      );
    }

    const maxSize = isVideo ? 200 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size exceeds ${isVideo ? "200MB" : "5MB"} limit` },
        { status: 400 }
      );
    }

    const folder = isVideo || isCaption ? "interviews" : "resumes";
    const key = buildKey(user.organizationId, folder, file.name, isVideo ? "webm" : "pdf");

    const bytes = await file.arrayBuffer();
    await saveFile(key, Buffer.from(bytes), file.type);

    const fileUrl = canonicalUrl(key);

    return NextResponse.json({
      success: true,
      file: {
        url: fileUrl,
        filename: file.name,
        size: file.size,
        type: file.type,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function buildKey(
  organizationId: string,
  folder: string,
  originalFilename: string,
  fallbackExtension: string
): string {
  const fileExtension = (originalFilename?.split(".").pop() || "").toLowerCase();
  const ext =
    fileExtension && !fileExtension.includes(" ") ? fileExtension : fallbackExtension;
  const uniqueFilename = `${uuidv4()}.${ext}`;
  return `org-${organizationId}/${folder}/${uniqueFilename}`;
}
