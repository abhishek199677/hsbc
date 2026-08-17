import { NextResponse } from "next/server";
import { normalize } from "path";
import { getFile } from "@/lib/storage";
import { getActiveUser } from "@/lib/authorization";

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
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const relPath = normalize(path.join("/"));
    if (relPath.startsWith("..") || path.some((seg) => seg.includes("..") || seg === "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const authUser = await getActiveUser(request);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Enforce organization isolation: the org-<id> folder must match the token's organization
    const orgMatch = path[0]?.match(/^org-(.+)$/);
    if (!orgMatch || orgMatch[1] !== authUser.organizationId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await getFile(relPath);
    if (!data) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    const ext = relPath.slice(relPath.lastIndexOf(".")).toLowerCase();
    const contentType = CONTENT_TYPES[ext] || "application/octet-stream";

    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
