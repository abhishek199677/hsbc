/**
 * Audit Logging for Enterprise Compliance
 * Tracks all critical actions for SOC2, ISO27001, and GDPR compliance
 */

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

export type AuditAction =
  // Auth events
  | "user.login"
  | "user.login.failed"
  | "user.logout"
  | "user.signup"
  | "user.password_reset"
  | "user.2fa_enabled"
  | "user.2fa_disabled"
  | "user.sso_login"
  // User events
  | "user.update"
  | "user.delete"
  | "user.role_changed"
  // Interview events
  | "interview.scheduled"
  | "interview.started"
  | "interview.completed"
  | "interview.cancelled"
  | "interview.evaluated"
  // Data events
  | "data.export"
  | "data.delete"
  | "data.download"
  // Settings events
  | "settings.organization_updated"
  | "settings.sso_configured"
  | "settings.branding_updated"
  | "settings.api_key_created"
  | "settings.api_key_deleted"
  // Billing events
  | "billing.subscription_changed"
  | "billing.payment_failed"
  | "billing.invoice_downloaded"
  // Admin events
  | "admin.user_invited"
  | "admin.user_removed"
  | "admin.team_role_changed"
  | "admin.webhook_created"
  | "admin.webhook_deleted";

export type AuditCategory = "auth" | "user" | "interview" | "data" | "settings" | "billing" | "admin" | "security";
export type AuditSeverity = "info" | "warning" | "critical";

export interface AuditLogEntry {
  organizationId: string;
  userId?: string;
  actorEmail?: string;
  actorRole?: string;
  action: AuditAction;
  category: AuditCategory;
  resourceType?: string;
  resourceId?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  changes?: { before: unknown; after: unknown };
  ipAddress?: string;
  userAgent?: string;
  severity?: AuditSeverity;
}

/**
 * Log an audit event
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        organizationId: entry.organizationId,
        userId: entry.userId,
        actorEmail: entry.actorEmail,
        actorRole: entry.actorRole,
        action: entry.action,
        category: entry.category,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        description: entry.description,
        metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
        changes: entry.changes ? JSON.stringify(entry.changes) : null,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        severity: entry.severity || "info",
      },
    });
  } catch (error) {
    // Don't throw - audit logging should never break the main flow
    console.error("Failed to write audit log:", error);
  }
}

/**
 * Log authentication event
 */
export async function logAuthEvent(
  organizationId: string,
  action: "user.login" | "user.login.failed" | "user.logout" | "user.sso_login",
  data: {
    userId?: string;
    email?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  const severity = action.includes("failed") ? "warning" : "info";
  
  await logAuditEvent({
    organizationId,
    userId: data.userId,
    actorEmail: data.email,
    action,
    category: "auth",
    description: `User ${action.replace("user.", "")}`,
    metadata: data.metadata,
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
    severity,
  });
}

/**
 * Log interview event
 */
export async function logInterviewEvent(
  organizationId: string,
  action: "interview.scheduled" | "interview.started" | "interview.completed" | "interview.cancelled" | "interview.evaluated",
  data: {
    userId: string;
    interviewId: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  await logAuditEvent({
    organizationId,
    userId: data.userId,
    action,
    category: "interview",
    resourceType: "interview",
    resourceId: data.interviewId,
    description: `Interview ${action.replace("interview.", "")}`,
    metadata: data.metadata,
  });
}

/**
 * Log data export/delete event (GDPR)
 */
export async function logDataEvent(
  organizationId: string,
  action: "data.export" | "data.delete" | "data.download",
  data: {
    userId: string;
    resourceType?: string;
    resourceId?: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
  }
): Promise<void> {
  await logAuditEvent({
    organizationId,
    userId: data.userId,
    action,
    category: "data",
    resourceType: data.resourceType,
    resourceId: data.resourceId,
    description: `Data ${action.replace("data.", "")} requested`,
    metadata: data.metadata,
    ipAddress: data.ipAddress,
    severity: action === "data.delete" ? "critical" : "info",
  });
}

/**
 * Log settings change
 */
export async function logSettingsEvent(
  organizationId: string,
  action: "settings.organization_updated" | "settings.sso_configured" | "settings.branding_updated" | "settings.api_key_created" | "settings.api_key_deleted",
  data: {
    userId: string;
    changes?: { before: unknown; after: unknown };
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  await logAuditEvent({
    organizationId,
    userId: data.userId,
    action,
    category: "settings",
    description: `Settings updated: ${action.replace("settings.", "")}`,
    changes: data.changes,
    metadata: data.metadata,
  });
}

/**
 * Log admin action
 */
export async function logAdminEvent(
  organizationId: string,
  action: "admin.user_invited" | "admin.user_removed" | "admin.team_role_changed" | "admin.webhook_created" | "admin.webhook_deleted",
  data: {
    userId: string;
    targetUserId?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  await logAuditEvent({
    organizationId,
    userId: data.userId,
    action,
    category: "admin",
    description: `Admin action: ${action.replace("admin.", "")}`,
    metadata: {
      ...data.metadata,
      targetUserId: data.targetUserId,
    },
  });
}

/**
 * Query audit logs with filters
 */
export async function queryAuditLogs(params: {
  organizationId: string;
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  action?: AuditAction;
  category?: AuditCategory;
  severity?: AuditSeverity;
  resourceType?: string;
  resourceId?: string;
  limit?: number;
  offset?: number;
}) {
  const {
    organizationId,
    startDate,
    endDate,
    userId,
    action,
    category,
    severity,
    resourceType,
    resourceId,
    limit = 100,
    offset = 0,
  } = params;

  const where: Prisma.AuditLogWhereInput = { organizationId };

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  if (userId) where.userId = userId;
  if (action) where.action = action;
  if (category) where.category = category;
  if (severity) where.severity = severity;
  if (resourceType) where.resourceType = resourceType;
  if (resourceId) where.resourceId = resourceId;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total, limit, offset };
}

/**
 * Export audit logs for compliance (CSV/JSON format)
 */
export async function exportAuditLogs(
  organizationId: string,
  startDate: Date,
  endDate: Date,
  format: "csv" | "json" = "json"
): Promise<string> {
  const logs = await prisma.auditLog.findMany({
    where: {
      organizationId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { createdAt: "asc" },
    include: {
      user: {
        select: { id: true, email: true, name: true },
      },
    },
  });

  if (format === "csv") {
    const headers = [
      "Timestamp",
      "Action",
      "Category",
      "Severity",
      "User Email",
      "User Name",
      "Resource Type",
      "Resource ID",
      "Description",
      "IP Address",
      "User Agent",
      "Metadata",
    ];

    const rows = logs.map((log) => [
      log.createdAt.toISOString(),
      log.action,
      log.category,
      log.severity,
      log.actorEmail || log.user?.email || "",
      log.user?.name || "",
      log.resourceType || "",
      log.resourceId || "",
      log.description || "",
      log.ipAddress || "",
      log.userAgent || "",
      log.metadata || "",
    ]);

    return [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n");
  }

  // JSON format
  return JSON.stringify(
    logs.map((log) => ({
      timestamp: log.createdAt.toISOString(),
      action: log.action,
      category: log.category,
      severity: log.severity,
      actor: {
        id: log.userId,
        email: log.actorEmail || log.user?.email,
        name: log.user?.name,
        role: log.actorRole,
      },
      resource: {
        type: log.resourceType,
        id: log.resourceId,
      },
      description: log.description,
      metadata: log.metadata ? JSON.parse(log.metadata) : null,
      changes: log.changes ? JSON.parse(log.changes) : null,
      request: {
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
      },
    })),
    null,
    2
  );
}

/**
 * Get audit log statistics
 */
export async function getAuditStats(
  organizationId: string,
  startDate?: Date,
  endDate?: Date
) {
  const where: Prisma.AuditLogWhereInput = { organizationId };

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const [total, byCategory, bySeverity, recentActivity] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.groupBy({
      by: ["category"],
      where,
      _count: true,
    }),
    prisma.auditLog.groupBy({
      by: ["severity"],
      where,
      _count: true,
    }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        action: true,
        description: true,
        createdAt: true,
        user: {
          select: { email: true },
        },
      },
    }),
  ]);

  return {
    total,
    byCategory: byCategory.reduce((acc, item) => {
      acc[item.category] = item._count;
      return acc;
    }, {} as Record<string, number>),
    bySeverity: bySeverity.reduce((acc, item) => {
      acc[item.severity] = item._count;
      return acc;
    }, {} as Record<string, number>),
    recentActivity,
  };
}
