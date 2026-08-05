import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join, normalize, resolve } from "path";

const UPLOADS_ROOT = resolve(process.cwd(), "public", "uploads");

const CONTENT_TYPES: Record<string, string> = {
  ".webm": "video/webm",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".vtt": "text/vtt",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const relPath = normalize(path.join("/"));
    if (relPath.startsWith("..") || path.some((seg) => seg.includes("..") || seg === "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const filePath = join(UPLOADS_ROOT, relPath);
    const normalizedFilePath = normalize(filePath);
    if (!normalizedFilePath.startsWith(UPLOADS_ROOT)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const buffer = await readFile(normalizedFilePath);
    const ext = normalizedFilePath.slice(normalizedFilePath.lastIndexOf(".")).toLowerCase();
    const contentType = CONTENT_TYPES[ext] || "application/octet-stream";

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
