import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const totalUsers = await prisma.user.count();
    const totalProfiles = await prisma.profile.count();
    const completedProfiles = await prisma.profile.count({
      where: { isComplete: true },
    });
    const totalInterviews = await prisma.interview.count();
    const completedInterviews = await prisma.interview.count({
      where: { status: "completed" },
    });
    const scheduledInterviews = await prisma.interview.count({
      where: { status: "scheduled" },
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
