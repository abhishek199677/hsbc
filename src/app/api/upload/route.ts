import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    const videoTypes = ["video/webm", "video/mp4", "video/quicktime"];
    const isVideo = videoTypes.some((t) => file.type.startsWith(t));
    if (!isVideo && !allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload PDF, DOC, DOCX, or a video recording" },
        { status: 400 }
      );
    }

    // Validate file size (5MB for resumes, 200MB for videos)
    const maxSize = isVideo ? 200 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size exceeds ${isVideo ? "200MB" : "5MB"} limit` },
        { status: 400 }
      );
    }

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), "public", "uploads", isVideo ? "interviews" : "resumes");
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const fileExtension = file.name.split(".").pop() || (isVideo ? "webm" : "pdf");
    const uniqueFilename = `${uuidv4()}.${fileExtension}`;
    const filePath = join(uploadDir, uniqueFilename);

    // Convert file to buffer and write
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Return file URL
    const fileUrl = `/uploads/${isVideo ? "interviews" : "resumes"}/${uniqueFilename}`;

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
