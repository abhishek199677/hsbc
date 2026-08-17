/**
 * Audit Logs API
 * Query, export, and get statistics for audit logs
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { queryAuditLogs, exportAuditLogs, getAuditStats } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    const auth = await getUserFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin role
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        userId: auth.userId,
        organizationId: auth.organizationId,
        role: { in: ["owner", "admin"] },
      },
    });

    if (!teamMember) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    // Handle stats request
    if (action === "stats") {
      const startDate = searchParams.get("startDate")
        ? new Date(searchParams.get("startDate")!)
        : undefined;
      const endDate = searchParams.get("endDate")
        ? new Date(searchParams.get("endDate")!)
        : undefined;

      const stats = await getAuditStats(auth.organizationId, startDate, endDate);
      return NextResponse.json({ stats });
    }

    // Handle export request
    if (action === "export") {
      const startDate = new Date(searchParams.get("startDate") || Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = new Date(searchParams.get("endDate") || Date.now());
      const format = (searchParams.get("format") as "csv" | "json") || "json";

      const exportData = await exportAuditLogs(
        auth.organizationId,
        startDate,
        endDate,
        format
      );

      const contentType = format === "csv" ? "text/csv" : "application/json";
      const filename = `audit-logs-${startDate.toISOString().split("T")[0]}-to-${endDate.toISOString().split("T")[0]}.${format}`;

      return new NextResponse(exportData, {
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    // Default: query logs
    const startDate = searchParams.get("startDate")
      ? new Date(searchParams.get("startDate")!)
      : undefined;
    const endDate = searchParams.get("endDate")
      ? new Date(searchParams.get("endDate")!)
      : undefined;
    const userId = searchParams.get("userId") || undefined;
    const category = searchParams.get("category") as any || undefined;
    const severity = searchParams.get("severity") as any || undefined;
    const resourceType = searchParams.get("resourceType") || undefined;
    const resourceId = searchParams.get("resourceId") || undefined;
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    const result = await queryAuditLogs({
      organizationId: auth.organizationId,
      startDate,
      endDate,
      userId,
      category,
      severity,
      resourceType,
      resourceId,
      limit,
      offset,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to query audit logs:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
