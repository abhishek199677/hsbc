import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { resolvePublicUrl } from "@/lib/storage";

export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [userData, profile, interview] = await Promise.all([
      prisma.user.findUnique({
        where: { id: user.userId },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          createdAt: true,
          emailVerifiedAt: true,
        },
      }),
      prisma.profile.findUnique({
        where: { userId: user.userId },
      }),
      prisma.interview.findUnique({
        where: { userId: user.userId },
      }),
    ]);

    const data = {
      generatedAt: new Date().toISOString(),
      user: userData,
      profile: profile
        ? {
            ...profile,
            resumeUrl: profile.resumeUrl ? resolvePublicUrl(profile.resumeUrl) : null,
          }
        : null,
      interview: interview
        ? {
            ...interview,
            videoUrl: interview.videoUrl
              ? resolvePublicUrl(interview.videoUrl)
              : null,
            captionUrl: interview.captionUrl
              ? resolvePublicUrl(interview.captionUrl)
              : null,
          }
        : null,
    };

    return new NextResponse(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="techcitta-account-data-${user.userId}.json"`,
      },
    });
  } catch (error) {
    console.error("Account export error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
