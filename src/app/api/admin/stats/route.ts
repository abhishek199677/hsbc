import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

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

    const orgId = requester.organizationId;
    const totalUsers = await prisma.user.count({
      where: { organizationId: orgId },
    });
    const totalProfiles = await prisma.profile.count({
      where: { user: { organizationId: orgId } },
    });
    const completedProfiles = await prisma.profile.count({
      where: { isComplete: true, user: { organizationId: orgId } },
    });
    const totalInterviews = await prisma.interview.count({
      where: { user: { organizationId: orgId } },
    });
    const completedInterviews = await prisma.interview.count({
      where: { status: "completed", user: { organizationId: orgId } },
    });
    const scheduledInterviews = await prisma.interview.count({
      where: { status: "scheduled", user: { organizationId: orgId } },
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalProfiles,
        completedProfiles,
        totalInterviews,
        completedInterviews,
        scheduledInterviews,
      },
    });
  } catch (error) {
    console.error("Get stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
