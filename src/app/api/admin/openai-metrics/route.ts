import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const authUser = await getUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user to check role
    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      select: { role: true, organizationId: true },
    });

    if (!user || (user.role !== "admin" && user.role !== "employer")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const period = url.searchParams.get("period") || "7d"; // 7d, 30d, 90d, all
    const model = url.searchParams.get("model"); // filter by model

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

    const whereClause: Record<string, unknown> = { organizationId: user.organizationId };
    if (startDate) {
      whereClause.createdAt = { gte: startDate };
    }
    if (model) {
      whereClause.model = model;
    }

    // Get total usage stats
    const totalStats = await prisma.openAIUsageLog.aggregate({
      where: whereClause,
      _sum: {
        promptTokens: true,
        completionTokens: true,
        totalTokens: true,
        cost: true,
      },
      _count: true,
      _avg: {
        latencyMs: true,
      },
    });

    // Get usage by model
    const usageByModel = await prisma.openAIUsageLog.groupBy({
      by: ["model"],
      where: whereClause,
      _sum: {
        promptTokens: true,
        completionTokens: true,
        totalTokens: true,
        cost: true,
      },
      _count: true,
      _avg: {
        latencyMs: true,
      },
      orderBy: { _sum: { cost: "desc" } },
    });

    // Get usage by endpoint
    const usageByEndpoint = await prisma.openAIUsageLog.groupBy({
      by: ["endpoint"],
      where: whereClause,
      _sum: {
        promptTokens: true,
        completionTokens: true,
        totalTokens: true,
        cost: true,
      },
      _count: true,
      _avg: {
        latencyMs: true,
      },
      orderBy: { _sum: { cost: "desc" } },
    });

    // Get daily usage for chart
    const dailyUsage = await prisma.$queryRawUnsafe(
      `SELECT 
        DATE("createdAt") as date,
        COUNT(*) as request_count,
        SUM("promptTokens") as prompt_tokens,
        SUM("completionTokens") as completion_tokens,
        SUM("totalTokens") as total_tokens,
        SUM(cost) as cost,
        AVG("latencyMs") as avg_latency
      FROM openai_usage_logs
      WHERE ($1::timestamp IS NULL OR "createdAt" >= $1)
        AND ($2::text IS NULL OR model = $2)
        AND "organizationId" = $3
      GROUP BY DATE("createdAt")
      ORDER BY date DESC
      LIMIT 30`,
      startDate || null,
      model || null,
      user.organizationId
    );

    // Get recent requests
    const recentRequests = await prisma.openAIUsageLog.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        model: true,
        endpoint: true,
        promptTokens: true,
        completionTokens: true,
        totalTokens: true,
        cost: true,
        latencyMs: true,
        success: true,
        errorMessage: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Get error rate
    const errorStats = await prisma.openAIUsageLog.groupBy({
      by: ["success"],
      where: whereClause,
      _count: true,
    });

    const totalRequests = totalStats._count;
    const failedRequests = errorStats.find((e) => e.success === false)?._count || 0;
    const errorRate = totalRequests > 0 ? (failedRequests / totalRequests) * 100 : 0;

    return NextResponse.json({
      success: true,
      metrics: {
        summary: {
          totalRequests,
          totalPromptTokens: totalStats._sum.promptTokens || 0,
          totalCompletionTokens: totalStats._sum.completionTokens || 0,
          totalTokens: totalStats._sum.totalTokens || 0,
          totalCost: totalStats._sum.cost || 0,
          avgLatency: Math.round(totalStats._avg.latencyMs || 0),
          errorRate: Math.round(errorRate * 100) / 100,
        },
        byModel: usageByModel.map((m) => ({
          model: m.model,
          requests: m._count,
          promptTokens: m._sum.promptTokens || 0,
          completionTokens: m._sum.completionTokens || 0,
          totalTokens: m._sum.totalTokens || 0,
          cost: m._sum.cost || 0,
          avgLatency: Math.round(m._avg.latencyMs || 0),
        })),
        byEndpoint: usageByEndpoint.map((e) => ({
          endpoint: e.endpoint,
          requests: e._count,
          promptTokens: e._sum.promptTokens || 0,
          completionTokens: e._sum.completionTokens || 0,
          totalTokens: e._sum.totalTokens || 0,
          cost: e._sum.cost || 0,
          avgLatency: Math.round(e._avg.latencyMs || 0),
        })),
        dailyUsage: (dailyUsage as Array<Record<string, unknown>>).map((d) => ({
          date: d.date,
          requests: Number(d.request_count),
          promptTokens: Number(d.prompt_tokens),
          completionTokens: Number(d.completion_tokens),
          totalTokens: Number(d.total_tokens),
          cost: Number(d.cost),
          avgLatency: Math.round(Number(d.avg_latency)),
        })),
        recentRequests: recentRequests.map((r) => ({
          id: r.id,
          model: r.model,
          endpoint: r.endpoint,
          promptTokens: r.promptTokens,
          completionTokens: r.completionTokens,
          totalTokens: r.totalTokens,
          cost: r.cost,
          latencyMs: r.latencyMs,
          success: r.success,
          errorMessage: r.errorMessage,
          userName: r.user?.name || "System",
          userEmail: r.user?.email,
          createdAt: r.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("OpenAI metrics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
