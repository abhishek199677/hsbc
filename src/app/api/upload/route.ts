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
import { parseResume, ParsedResume } from "@/lib/resume-parser";
import { prisma } from "@/lib/prisma";

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

function extensionForType(type: string): string | null {
  const extensions: Record<string, string> = {
    "application/pdf": "pdf",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "video/webm": "webm",
    "video/mp4": "mp4",
    "video/quicktime": "mov",
    "text/vtt": "vtt",
  };
  return extensions[type] || null;
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = await rateLimitByIp(request, "upload", { limit: 60, windowMs: 60_000 });
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const contentType = request.headers.get("content-type") || "";

    // JSON metadata mode: used for large video uploads.
    // The server issues a short-lived presigned PUT URL so the browser can
    // upload directly to Cloudflare R2 (bypasses the hosting function body limit).
    if (contentType.includes("application/json")) {
      const body = await request.json();
      const { filename, type, size } = body;

      if (!isVideoType(type || "")) {
        return NextResponse.json({ error: "Only video uploads are supported in this mode" }, { status: 400 });
      }

      const maxSize = 200 * 1024 * 1024;
      if (typeof size !== "number" || size <= 0 || size > maxSize) {
        return NextResponse.json(
          { error: "File size exceeds 200MB limit" },
          { status: 400 }
        );
      }

      const key = buildKey(user.organizationId, "interviews", extensionForType(type) || "webm");
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
    const extension = extensionForType(file.type);
    if (!extension) return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    const key = buildKey(user.organizationId, folder, extension);

    const bytes = await file.arrayBuffer();
    await saveFile(key, Buffer.from(bytes), file.type);

    const fileUrl = canonicalUrl(key);

    // Parse resume if it's a document
    let parsedResume: ParsedResume | null = null;
    if (!isVideo && !isCaption) {
      try {
        parsedResume = await parseResume(Buffer.from(bytes), file.name);
        console.log("Resume parsed successfully:", JSON.stringify(parsedResume, null, 2));
        
        // Save parsed resume data to the user's profile
        if (parsedResume) {
          const skills = parsedResume.skills?.length > 0 ? parsedResume.skills.join(", ") : null;
          const workExperience = parsedResume.workExperience?.length > 0 ? JSON.stringify(parsedResume.workExperience) : null;
          const projects = parsedResume.projects?.length > 0 ? JSON.stringify(parsedResume.projects) : null;
          const keyAchievements = parsedResume.keyAchievements?.length > 0 ? JSON.stringify(parsedResume.keyAchievements) : null;
          const certifications = parsedResume.certifications?.length > 0 ? JSON.stringify(parsedResume.certifications) : null;
          const languages = parsedResume.languages?.length > 0 ? JSON.stringify(parsedResume.languages) : null;

          // Upsert profile with parsed data
          await prisma.profile.upsert({
            where: { userId: user.userId },
            create: {
              userId: user.userId,
              resumeUrl: fileUrl,
              resumeFileName: file.name,
              currentRole: parsedResume.currentRole,
              totalExperience: parsedResume.totalExperience,
              currentLocation: parsedResume.currentLocation,
              skills,
              currentCompany: parsedResume.currentCompany,
              education: parsedResume.education,
              aboutYou: parsedResume.summary,
              strengths: parsedResume.strengths,
              linkedinUrl: parsedResume.linkedinUrl,
              workExperience,
              projects,
              keyAchievements,
              certifications,
              languages,
            },
            update: {
              resumeUrl: fileUrl,
              resumeFileName: file.name,
              // Only update fields if they have a value from parsing
              ...(parsedResume.currentRole && { currentRole: parsedResume.currentRole }),
              ...(parsedResume.totalExperience && { totalExperience: parsedResume.totalExperience }),
              ...(parsedResume.currentLocation && { currentLocation: parsedResume.currentLocation }),
              ...(skills && { skills }),
              ...(parsedResume.currentCompany && { currentCompany: parsedResume.currentCompany }),
              ...(parsedResume.education && { education: parsedResume.education }),
              ...(parsedResume.summary && { aboutYou: parsedResume.summary }),
              ...(parsedResume.strengths && { strengths: parsedResume.strengths }),
              ...(parsedResume.linkedinUrl && { linkedinUrl: parsedResume.linkedinUrl }),
              ...(workExperience && { workExperience }),
              ...(projects && { projects }),
              ...(keyAchievements && { keyAchievements }),
              ...(certifications && { certifications }),
              ...(languages && { languages }),
            },
          });
        }
      } catch (error) {
        console.error("Resume parsing failed:", error);
        // Continue without parsed data - not a blocker
      }
    }

    return NextResponse.json({
      success: true,
      file: {
        url: fileUrl,
        filename: file.name,
        size: file.size,
        type: file.type,
      },
      parsedResume,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function buildKey(
  organizationId: string,
  folder: string,
  extension: string
): string {
  const uniqueFilename = `${uuidv4()}.${extension}`;
  return `org-${organizationId}/${folder}/${uniqueFilename}`;
}
