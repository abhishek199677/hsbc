import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const authUser = await getUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      select: { role: true, organizationId: true },
    });

    if (!user || (user.role !== "admin" && user.role !== "employer")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(request.url);
    const period = url.searchParams.get("period") || "7d";
    const email = url.searchParams.get("email");
    const success = url.searchParams.get("success");

    // Calculate date range
    const now = new Date();
    let startDate: Date | undefined;
    switch (period) {
      case "24h":
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = undefined;
    }

    const whereClause: Record<string, unknown> = {
      organizationId: user.organizationId,
    };

    if (startDate) {
      whereClause.createdAt = { gte: startDate };
    }

    if (email) {
      whereClause.email = { contains: email, mode: "insensitive" };
    }

    if (success !== null && success !== undefined) {
      whereClause.success = success === "true";
    }

    // Get total stats
    const totalLogins = await prisma.loginLog.count({
      where: whereClause,
    });

    const successfulLogins = await prisma.loginLog.count({
      where: { ...whereClause, success: true },
    });

    const failedLogins = await prisma.loginLog.count({
      where: { ...whereClause, success: false },
    });

    // Get daily login counts
    const dailyLogins = await prisma.$queryRawUnsafe(
      `SELECT 
        DATE("createdAt") as date,
        COUNT(*) as total,
        SUM(CASE WHEN success = true THEN 1 ELSE 0 END) as successful,
        SUM(CASE WHEN success = false THEN 1 ELSE 0 END) as failed
      FROM login_logs
      WHERE ($1::timestamp IS NULL OR "createdAt" >= $1)
        AND "organizationId" = $2
        AND ($3::text IS NULL OR email ILIKE '%' || $3 || '%')
      GROUP BY DATE("createdAt")
      ORDER BY date DESC
      LIMIT 30`,
      startDate || null,
      user.organizationId,
      email || null
    );

    // Get recent login logs
    const recentLogins = await prisma.loginLog.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        email: true,
        success: true,
        failureReason: true,
        ipAddress: true,
        userAgent: true,
        device: true,
        browser: true,
        os: true,
        location: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            role: true,
          },
        },
      },
    });

    // Get unique users who logged in
    const uniqueUsers = await prisma.loginLog.groupBy({
      by: ["email"],
      where: { ...whereClause, success: true },
      _count: true,
      orderBy: { _count: { email: "desc" } },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      metrics: {
        summary: {
          totalLogins,
          successfulLogins,
          failedLogins,
          successRate: totalLogins > 0 ? Math.round((successfulLogins / totalLogins) * 100) : 0,
        },
        dailyLogins: (dailyLogins as Array<Record<string, unknown>>).map((d) => ({
          date: d.date,
          total: Number(d.total),
          successful: Number(d.successful),
          failed: Number(d.failed),
        })),
        recentLogins: recentLogins.map((r) => ({
          id: r.id,
          email: r.email,
          userName: r.user?.name || "Unknown",
          userRole: r.user?.role || "Unknown",
          success: r.success,
          failureReason: r.failureReason,
          ipAddress: r.ipAddress,
          userAgent: r.userAgent,
          device: r.device,
          browser: r.browser,
          os: r.os,
          location: r.location,
          createdAt: r.createdAt,
        })),
        topUsers: uniqueUsers.map((u) => ({
          email: u.email,
          loginCount: u._count,
        })),
      },
    });
  } catch (error) {
    console.error("Get login logs error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
