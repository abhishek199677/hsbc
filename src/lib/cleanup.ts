/**
 * Data retention and cleanup utilities.
 * Run via cron job or manually: npx tsx src/lib/cleanup.ts
 */

import { prisma } from "./prisma";

const RETENTION = {
  // Session cleanup
  sessionMaxAgeDays: 30,
  revokedSessionMaxAgeDays: 1,

  // Login logs
  loginLogMaxAgeDays: 90,

  // Audit logs
  auditLogMaxAgeDays: 365,

  // Verification tokens
  verificationTokenMaxAgeDays: 1,

  // Expired interviews (scheduled but never completed)
  staleInterviewDays: 60,

  // OpenAI usage logs
  usageLogMaxAgeDays: 180,
};

export async function cleanupExpiredSessions(): Promise<number> {
  const cutoff = new Date(Date.now() - RETENTION.sessionMaxAgeDays * 24 * 60 * 60 * 1000);
  const revokedCutoff = new Date(Date.now() - RETENTION.revokedSessionMaxAgeDays * 24 * 60 * 60 * 1000);

  // Delete expired sessions
  const expired = await prisma.session.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });

  // Delete old revoked sessions
  const revoked = await prisma.session.deleteMany({
    where: {
      revokedAt: { not: null, lt: revokedCutoff },
    },
  });

  // Delete very old sessions even if not expired
  const old = await prisma.session.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });

  return expired.count + revoked.count + old.count;
}

export async function cleanupExpiredTokens(): Promise<number> {
  const result = await prisma.verificationToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return result.count;
}

export async function cleanupOldLoginLogs(): Promise<number> {
  const cutoff = new Date(Date.now() - RETENTION.loginLogMaxAgeDays * 24 * 60 * 60 * 1000);
  const result = await prisma.loginLog.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });
  return result.count;
}

export async function cleanupOldAuditLogs(): Promise<number> {
  const cutoff = new Date(Date.now() - RETENTION.auditLogMaxAgeDays * 24 * 60 * 60 * 1000);
  const result = await prisma.auditLog.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });
  return result.count;
}

export async function cleanupOldUsageLogs(): Promise<number> {
  const cutoff = new Date(Date.now() - RETENTION.usageLogMaxAgeDays * 24 * 60 * 60 * 1000);
  const result = await prisma.openAIUsageLog.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });
  return result.count;
}

export async function cleanupStaleInterviews(): Promise<number> {
  const cutoff = new Date(Date.now() - RETENTION.staleInterviewDays * 24 * 60 * 60 * 1000);
  const result = await prisma.interview.updateMany({
    where: {
      status: "scheduled",
      createdAt: { lt: cutoff },
    },
    data: { status: "cancelled" },
  });
  return result.count;
}

export async function runCleanup(): Promise<{
  sessions: number;
  tokens: number;
  loginLogs: number;
  auditLogs: number;
  usageLogs: number;
  staleInterviews: number;
}> {
  console.log("[cleanup] Starting data retention cleanup...");

  const [sessions, tokens, loginLogs, auditLogs, usageLogs, staleInterviews] =
    await Promise.all([
      cleanupExpiredSessions(),
      cleanupExpiredTokens(),
      cleanupOldLoginLogs(),
      cleanupOldAuditLogs(),
      cleanupOldUsageLogs(),
      cleanupStaleInterviews(),
    ]);

  console.log(`[cleanup] Results:
  - Sessions removed: ${sessions}
  - Tokens removed: ${tokens}
  - Login logs removed: ${loginLogs}
  - Audit logs removed: ${auditLogs}
  - Usage logs removed: ${usageLogs}
  - Stale interviews cancelled: ${staleInterviews}`);

  return { sessions, tokens, loginLogs, auditLogs, usageLogs, staleInterviews };
}

// Run directly via: npx tsx src/lib/cleanup.ts
if (require.main === module) {
  runCleanup()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[cleanup] Failed:", err);
      process.exit(1);
    });
}
