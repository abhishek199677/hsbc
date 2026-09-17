import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { resolvePublicUrl } from "@/lib/storage";

export async function GET(request: Request) {
  try {
    const auth = await getUserFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requester = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { role: true, organizationId: true },
    });

    if (!requester || (requester.role !== "admin" && requester.role !== "employer")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Pagination params
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: { organizationId: requester.organizationId },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          createdAt: true,
          profile: {
            select: {
              isComplete: true,
              resumeUrl: true,
              resumeFileName: true,
              aboutYou: true,
              whatDrivesYou: true,
              strengths: true,
              currentRole: true,
              totalExperience: true,
              currentLocation: true,
              noticePeriod: true,
              skills: true,
              currentCompany: true,
              education: true,
              jobType: true,
              salaryRange: true,
              preferredLocation: true,
              workMode: true,
              timezone: true,
              step: true,
            },
          },
          interview: {
            select: {
              date: true,
              time: true,
              timezone: true,
              status: true,
              mode: true,
              type: true,
              duration: true,
              videoUrl: true,
              captionUrl: true,
              transcript: true,
              evaluationScore: true,
              evaluation: true,
              proctoringStatus: true,
              proctoringFlags: true,
              proctoringReport: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({
        where: { organizationId: requester.organizationId },
      }),
    ]);

    // Resolve stored video path to a short-lived presigned URL for playback.
    const resolved = await Promise.all(
      users.map(async (user) => ({
        ...user,
        interview: user.interview
          ? {
              ...user.interview,
              videoUrl: await resolvePublicUrl(user.interview.videoUrl),
            }
          : null,
      }))
    );

    return NextResponse.json({
      success: true,
      users: resolved,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
