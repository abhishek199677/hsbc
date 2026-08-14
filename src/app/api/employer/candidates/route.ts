import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { resolvePublicUrl } from "@/lib/storage";

export async function GET(request: Request) {
  try {
    const auth = getUserFromRequest(request);
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

    const users = await prisma.user.findMany({
      where: {
        organizationId: requester.organizationId,
        role: "jobseeker",
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        createdAt: true,
        profile: {
          select: {
            currentRole: true,
            totalExperience: true,
            currentLocation: true,
            skills: true,
            education: true,
            preferredLocation: true,
            workMode: true,
          },
        },
        interview: {
          select: {
            date: true,
            time: true,
            status: true,
            evaluationScore: true,
            evaluation: true,
            videoUrl: true,
            proctoringStatus: true,
            proctoringFlags: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const candidates = await Promise.all(
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

    return NextResponse.json({ success: true, candidates });
  } catch (error) {
    console.error("Get employer candidates error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
