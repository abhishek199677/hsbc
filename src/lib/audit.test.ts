import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/prisma", () => {
  const mockPrisma = {
    auditLog: {
      create: vi.fn().mockResolvedValue({}),
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      groupBy: vi.fn().mockResolvedValue([]),
    },
  };
  return { prisma: mockPrisma };
});

import { logAuditEvent, logAuthEvent, logInterviewEvent, logDataEvent, logSettingsEvent, logAdminEvent } from "./audit";
import { prisma } from "@/lib/prisma";

const mockPrisma = prisma as unknown as {
  auditLog: {
    create: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
    groupBy: ReturnType<typeof vi.fn>;
  };
};

describe("logAuditEvent", () => {
  it("creates an audit log entry", async () => {
    await logAuditEvent({
      organizationId: "org-1",
      userId: "user-1",
      action: "user.login",
      category: "auth",
    });

    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: "org-1",
        userId: "user-1",
        action: "user.login",
        category: "auth",
        severity: "info",
      }),
    });
  });

  it("sets severity to info by default", async () => {
    await logAuditEvent({
      organizationId: "org-1",
      action: "user.signup",
      category: "auth",
    });

    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ severity: "info" }),
      })
    );
  });

  it("uses custom severity when provided", async () => {
    await logAuditEvent({
      organizationId: "org-1",
      action: "data.delete",
      category: "data",
      severity: "critical",
    });

    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ severity: "critical" }),
      })
    );
  });

  it("serializes metadata to JSON string", async () => {
    await logAuditEvent({
      organizationId: "org-1",
      action: "user.login",
      category: "auth",
      metadata: { browser: "Chrome" },
    });

    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ metadata: '{"browser":"Chrome"}' }),
      })
    );
  });

  it("serializes changes to JSON string", async () => {
    await logAuditEvent({
      organizationId: "org-1",
      action: "settings.branding_updated",
      category: "settings",
      changes: { before: { color: "red" }, after: { color: "blue" } },
    });

    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          changes: '{"before":{"color":"red"},"after":{"color":"blue"}}',
        }),
      })
    );
  });

  it("does not throw on DB failure", async () => {
    mockPrisma.auditLog.create.mockRejectedValueOnce(new Error("DB down"));
    await expect(
      logAuditEvent({ organizationId: "org-1", action: "user.login", category: "auth" })
    ).resolves.toBeUndefined();
  });
});

describe("logAuthEvent", () => {
  it("logs login with info severity", async () => {
    await logAuthEvent("org-1", "user.login", { userId: "u1", email: "a@b.com" });
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ severity: "info" }),
      })
    );
  });

  it("logs failed login with warning severity", async () => {
    await logAuthEvent("org-1", "user.login.failed", { email: "a@b.com" });
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ severity: "warning" }),
      })
    );
  });
});

describe("logInterviewEvent", () => {
  it("creates interview audit entry", async () => {
    await logInterviewEvent("org-1", "interview.completed", {
      userId: "u1",
      interviewId: "i1",
    });
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          resourceType: "interview",
          resourceId: "i1",
        }),
      })
    );
  });
});

describe("logDataEvent", () => {
  it("sets critical severity for data.delete", async () => {
    await logDataEvent("org-1", "data.delete", { userId: "u1" });
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ severity: "critical" }),
      })
    );
  });

  it("sets info severity for data.export", async () => {
    await logDataEvent("org-1", "data.export", { userId: "u1" });
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ severity: "info" }),
      })
    );
  });
});

describe("logSettingsEvent", () => {
  it("logs settings change with changes object", async () => {
    await logSettingsEvent("org-1", "settings.branding_updated", {
      userId: "u1",
      changes: { before: { x: 1 }, after: { x: 2 } },
    });
    expect(mockPrisma.auditLog.create).toHaveBeenCalled();
  });
});

describe("logAdminEvent", () => {
  it("logs admin action with targetUserId", async () => {
    mockPrisma.auditLog.create.mockClear();
    await logAdminEvent("org-1", "admin.user_invited", {
      userId: "admin-1",
      targetUserId: "target-1",
    });
    expect(mockPrisma.auditLog.create).toHaveBeenCalledTimes(1);
    const call = mockPrisma.auditLog.create.mock.calls[0][0];
    const meta = JSON.parse(call.data.metadata);
    expect(meta.targetUserId).toBe("target-1");
  });
});
