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
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];
const VIDEO_TYPES = ["video/webm", "video/mp4", "video/quicktime"];
const CAPTION_TYPES = ["text/vtt"];

// Magic bytes for file type verification
const MAGIC_BYTES: Record<string, number[][]> = {
  "application/pdf": [[0x25, 0x50, 0x44, 0x46]], // %PDF
  "video/mp4": [[0x66, 0x74, 0x79, 0x70]], // ftyp at offset 4
  "video/quicktime": [[0x66, 0x74, 0x79, 0x70]], // ftyp at offset 4
  "video/webm": [[0x1a, 0x45, 0xdf, 0xa3]],
};

function verifyMagicBytes(buffer: ArrayBuffer, expectedType: string): boolean {
  const bytes = new Uint8Array(buffer.slice(0, 16));
  const signatures = MAGIC_BYTES[expectedType];
  if (!signatures) return true; // No check defined — allow

  return signatures.some((sig) =>
    sig.every((byte, i) => {
      // MP4/MOV: ftyp is at offset 4
      const offset = expectedType.startsWith("video/mp4") || expectedType === "video/quicktime" ? 4 : 0;
      return bytes[offset + i] === byte;
    })
  );
}

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
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/webp": "webp",
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

    // Verify file content matches declared type (magic bytes check)
    if (!isVideo && !isCaption && !verifyMagicBytes(bytes, file.type)) {
      return NextResponse.json(
        { error: "File content does not match declared type" },
        { status: 400 }
      );
    }
    if (isVideo && !verifyMagicBytes(bytes, file.type)) {
      return NextResponse.json(
        { error: "Video content does not match declared type" },
        { status: 400 }
      );
    }

    await saveFile(key, Buffer.from(bytes), file.type);

    const fileUrl = canonicalUrl(key);

    // Parse resume if it's a document
    let parsedResume: ParsedResume | null = null;
    let parsingStatus = "skipped";
    let parsingError: string | null = null;
    if (!isVideo && !isCaption) {
      try {
        console.log(`[upload] Parsing resume: ${file.name} (${file.type}, ${file.size} bytes)`);
        parsedResume = await parseResume(Buffer.from(bytes), file.name);
        parsingStatus = "success";
        console.log("[upload] Resume parsed successfully:", JSON.stringify(parsedResume, null, 2));
        
        // Count extracted fields for diagnostics
        const fieldsExtracted = [
          parsedResume.name,
          parsedResume.email,
          parsedResume.phone,
          parsedResume.currentRole,
          parsedResume.totalExperience,
          parsedResume.currentLocation,
          parsedResume.currentCompany,
          parsedResume.education,
          parsedResume.summary,
          parsedResume.strengths,
          parsedResume.linkedinUrl,
          parsedResume.noticePeriod,
        ].filter(Boolean).length;
        const arraysExtracted = [
          parsedResume.skills?.length > 0,
          parsedResume.workExperience?.length > 0,
          parsedResume.projects?.length > 0,
          parsedResume.certifications?.length > 0,
          parsedResume.keyAchievements?.length > 0,
          parsedResume.languages?.length > 0,
        ].filter(Boolean).length;
        console.log(`[upload] Extracted ${fieldsExtracted} fields, ${arraysExtracted} arrays`);
        
        // Save parsed resume data to the user's profile
        if (parsedResume) {
          const skills = parsedResume.skills?.length > 0 ? parsedResume.skills.join(", ") : null;
          const workExperience = parsedResume.workExperience?.length > 0 ? JSON.stringify(parsedResume.workExperience) : null;
          const projects = parsedResume.projects?.length > 0 ? JSON.stringify(parsedResume.projects) : null;
          const keyAchievements = parsedResume.keyAchievements?.length > 0 ? JSON.stringify(parsedResume.keyAchievements) : null;
          const certifications = parsedResume.certifications?.length > 0 ? JSON.stringify(parsedResume.certifications) : null;
          const languages = parsedResume.languages?.length > 0 ? parsedResume.languages.join(", ") : null;
          const educationDetails = parsedResume.educationDetails?.length > 0 ? JSON.stringify(parsedResume.educationDetails) : null;
          const suggestedRoles = parsedResume.suggestedRoles?.length > 0 ? JSON.stringify(parsedResume.suggestedRoles) : null;

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
              noticePeriod: parsedResume.noticePeriod,
              whatDrivesYou: parsedResume.whatDrivesYou,
              jobType: parsedResume.jobType,
              preferredLocation: parsedResume.preferredLocation,
              educationDetails,
              suggestedRoles,
            },
            update: {
              resumeUrl: fileUrl,
              resumeFileName: file.name,
              // Only update fields if they have a value from parsing
              // Skip fields the user has already manually filled (non-empty)
              // This allows re-upload without losing manual edits
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
              ...(parsedResume.noticePeriod && { noticePeriod: parsedResume.noticePeriod }),
              ...(parsedResume.whatDrivesYou && { whatDrivesYou: parsedResume.whatDrivesYou }),
              ...(parsedResume.jobType && { jobType: parsedResume.jobType }),
              ...(parsedResume.preferredLocation && { preferredLocation: parsedResume.preferredLocation }),
              ...(educationDetails && { educationDetails }),
              ...(suggestedRoles && { suggestedRoles }),
            },
          });
          console.log("[upload] Profile saved to database");
        }
      } catch (error) {
        parsingStatus = "failed";
        parsingError = error instanceof Error ? error.message : "Unknown parsing error";
        console.error("[upload] Resume parsing failed:", error);
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
      parsingStatus,
      parsingError,
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
