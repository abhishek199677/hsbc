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
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const interviewsThisMonth = await prisma.interview.count({
      where: {
        user: { organizationId: orgId },
        createdAt: { gte: thisMonthStart },
      },
    });

    const interviewsLastMonth = await prisma.interview.count({
      where: {
        user: { organizationId: orgId },
        createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
      },
    });

    const completedInterviews = await prisma.interview.findMany({
      where: {
        user: { organizationId: orgId },
        status: "completed",
        evaluationScore: { not: null },
      },
      select: {
        evaluationScore: true,
        evaluation: true,
        createdAt: true,
        date: true,
      },
    });

    const totalScheduled = await prisma.interview.count({
      where: { user: { organizationId: orgId } },
    });

    const totalCompleted = await prisma.interview.count({
      where: { user: { organizationId: orgId }, status: "completed" },
    });

    const avgScore =
      completedInterviews.length > 0
        ? completedInterviews.reduce((sum, i) => sum + (i.evaluationScore ?? 0), 0) /
          completedInterviews.length
        : 0;

    const completionRate = totalScheduled > 0 ? (totalCompleted / totalScheduled) * 100 : 0;

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayCounts: Record<string, number> = {};
    dayNames.forEach((d) => (dayCounts[d] = 0));
    completedInterviews.forEach((i) => {
      const d = new Date(i.date);
      if (!isNaN(d.getTime())) {
        dayCounts[dayNames[d.getDay()]]++;
      }
    });
    const mostActiveDays = Object.entries(dayCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([day, count]) => ({ day, count }));

    const buckets = [
      { label: "0-2", min: 0, max: 2 },
      { label: "3-4", min: 3, max: 4 },
      { label: "5-6", min: 5, max: 6 },
      { label: "7-8", min: 7, max: 8 },
      { label: "9-10", min: 9, max: 10 },
    ];
    const scoreDistribution = buckets.map((b) => ({
      label: b.label,
      count: completedInterviews.filter(
        (i) => (i.evaluationScore ?? 0) >= b.min && (i.evaluationScore ?? 0) <= b.max
      ).length,
    }));

    const strengthCounts: Record<string, number> = {};
    const weaknessCounts: Record<string, number> = {};
    completedInterviews.forEach((i) => {
      if (!i.evaluation) return;
      try {
        const ev = JSON.parse(i.evaluation);
        if (Array.isArray(ev.strengths)) {
          ev.strengths.forEach((s: string) => {
            strengthCounts[s] = (strengthCounts[s] || 0) + 1;
          });
        }
        if (Array.isArray(ev.weaknesses)) {
          ev.weaknesses.forEach((w: string) => {
            weaknessCounts[w] = (weaknessCounts[w] || 0) + 1;
          });
        }
      } catch {
        // skip malformed evaluation JSON
      }
    });
    const topStrengths = Object.entries(strengthCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));
    const topWeaknesses = Object.entries(weaknessCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));

    const allEvals = await prisma.interview.findMany({
      where: {
        user: { organizationId: orgId },
        status: "completed",
        evaluation: { not: null },
      },
      select: { evaluation: true },
    });
    const recommendationCounts = { hire: 0, consider: 0, reject: 0 };
    allEvals.forEach((i) => {
      if (!i.evaluation) return;
      try {
        const ev = JSON.parse(i.evaluation);
        const rec = (ev.recommendation || "").toLowerCase();
        if (rec === "hire") recommendationCounts.hire++;
        else if (rec === "consider") recommendationCounts.consider++;
        else if (rec === "reject") recommendationCounts.reject++;
      } catch {
        // skip
      }
    });

    const hireRate =
      totalCompleted > 0 ? (recommendationCounts.hire / totalCompleted) * 100 : 0;

    return NextResponse.json({
      success: true,
      analytics: {
        interviewsThisMonth,
        interviewsLastMonth,
        avgScore: Math.round(avgScore * 10) / 10,
        completionRate: Math.round(completionRate * 10) / 10,
        hireRate: Math.round(hireRate * 10) / 10,
        mostActiveDays,
        scoreDistribution,
        topStrengths,
        topWeaknesses,
        recommendationBreakdown: recommendationCounts,
        totalCompleted,
      },
    });
  } catch (error) {
    console.error("Get analytics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
