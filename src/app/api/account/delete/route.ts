import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveUser } from "@/lib/authorization";
import { revokeUserSessions } from "@/lib/auth";
import { keyFromCanonicalUrl, deleteFile } from "@/lib/storage";

export async function POST(request: Request) {
  try {
    const user = await getActiveUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    if (body?.confirmation !== "DELETE") {
      return NextResponse.json(
        { error: 'Please type "DELETE" to confirm account deletion.' },
        { status: 400 }
      );
    }

    const [profile, interview] = await Promise.all([
      prisma.profile.findUnique({ where: { userId: user.id } }),
      prisma.interview.findUnique({ where: { userId: user.id } }),
    ]);

    // Delete stored files (resume, video, captions) from R2/local storage.
    const fileKeys = [
      profile?.resumeUrl,
      interview?.videoUrl,
      interview?.captionUrl,
    ]
      .map((url) => (url ? keyFromCanonicalUrl(url) : null))
      .filter((key): key is string => Boolean(key));

    await Promise.allSettled(fileKeys.map((key) => deleteFile(key)));

    // Revoke all sessions before deleting the user
    await revokeUserSessions(user.id);

    // Delete user and all related rows (cascade covers profile, interview, tokens, sessions).
    await prisma.user.delete({ where: { id: user.id } });

    return NextResponse.json({
      success: true,
      message: "Your account and all associated data have been permanently deleted.",
    });
  } catch (error) {
    console.error("Account delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
