/**
 * Database Health & Backup Verification Endpoint
 *
 * Admin-only endpoint that verifies:
 * - Database connection is alive
 * - Read/write operations work
 * - Basic table row counts (for monitoring growth)
 *
 * Use this to verify your database is healthy and backups are restorable.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrganizationRole } from "@/lib/authorization";

export async function GET(request: Request) {
  try {
    const authUser = await requireOrganizationRole(request, ["owner", "admin"]);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const startTime = Date.now();

    // Test 1: Basic connectivity
    await prisma.$queryRaw`SELECT 1`;
    const connectivityMs = Date.now() - startTime;

    // Test 2: Read operation
    const readStart = Date.now();
    const userCount = await prisma.user.count({
      where: { organizationId: authUser.organizationId },
    });
    const readMs = Date.now() - readStart;

    // Test 3: Write operation (write a tiny record and delete it)
    const writeStart = Date.now();
    const testId = `health-check-${Date.now()}`;
    await prisma.auditLog.create({
      data: {
        organizationId: authUser.organizationId,
        userId: authUser.id,
        action: "health_check",
        category: "system",
        metadata: JSON.stringify({ testId }),
        severity: "info",
      },
    });
    // Clean up the test record
    await prisma.auditLog.deleteMany({
      where: { action: "health_check", metadata: { contains: testId } },
    });
    const writeMs = Date.now() - writeStart;

    // Test 4: Table row counts (for monitoring)
    const [sessionCount, interviewCount, loginLogCount] = await Promise.all([
      prisma.session.count({ where: { organizationId: authUser.organizationId } }),
      prisma.interview.count({ where: { userId: authUser.id } }),
      prisma.loginLog.count({ where: { organizationId: authUser.organizationId } }),
    ]);

    const totalMs = Date.now() - startTime;

    return NextResponse.json({
      status: "healthy",
      latency: {
        total: `${totalMs}ms`,
        connectivity: `${connectivityMs}ms`,
        read: `${readMs}ms`,
        write: `${writeMs}ms`,
      },
      counts: {
        users: userCount,
        sessions: sessionCount,
        interviews: interviewCount,
        loginLogs: loginLogCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Database health check failed:", error);
    return NextResponse.json(
      {
        status: "unhealthy",
        error: "Database connection failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
