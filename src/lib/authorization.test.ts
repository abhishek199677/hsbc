import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => {
  const mockPrisma = {
    user: { findUnique: vi.fn() },
  };
  return { prisma: mockPrisma };
});

vi.mock("@/lib/auth", () => ({
  getUserFromRequest: vi.fn(() => Promise.resolve({ userId: "user-1", organizationId: "org-1" })),
}));

import { getActiveUser, requireOrganizationRole } from "./authorization";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

const mockPrisma = prisma as unknown as { user: { findUnique: ReturnType<typeof vi.fn> } };
const mockGetUserFromRequest = vi.mocked(getUserFromRequest);

function makeRequest(): Request {
  return new Request("http://localhost/api/test", {
    method: "GET",
    headers: { cookie: "techcitta_session=test" },
  });
}

describe("getActiveUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns user with organization role when valid", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      name: "Test User",
      email: "test@example.com",
      emailVerifiedAt: new Date(),
      organizationId: "org-1",
      twoFactorEnabled: true,
      organization: { status: "active" },
      teamMemberships: [{ role: "admin" }],
    });

    const user = await getActiveUser(makeRequest());
    expect(user).not.toBeNull();
    expect(user?.id).toBe("user-1");
    expect(user?.organizationRole).toBe("admin");
  });

  it("returns null when user not found", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    const user = await getActiveUser(makeRequest());
    expect(user).toBeNull();
  });

  it("returns null when email not verified", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      emailVerifiedAt: null,
      organizationId: "org-1",
      organization: { status: "active" },
      teamMemberships: [],
    });

    const user = await getActiveUser(makeRequest());
    expect(user).toBeNull();
  });

  it("returns null when organization is inactive", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      emailVerifiedAt: new Date(),
      organizationId: "org-1",
      organization: { status: "suspended" },
      teamMemberships: [],
    });

    const user = await getActiveUser(makeRequest());
    expect(user).toBeNull();
  });

  it("returns null when organizationId mismatches", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      emailVerifiedAt: new Date(),
      organizationId: "org-2",
      organization: { status: "active" },
      teamMemberships: [],
    });

    const user = await getActiveUser(makeRequest());
    expect(user).toBeNull();
  });

  it("returns null when auth fails", async () => {
    mockGetUserFromRequest.mockResolvedValueOnce(null);

    const user = await getActiveUser(makeRequest());
    expect(user).toBeNull();
  });
});

describe("requireOrganizationRole", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns user when role is allowed", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      emailVerifiedAt: new Date(),
      organizationId: "org-1",
      twoFactorEnabled: true,
      organization: { status: "active" },
      teamMemberships: [{ role: "admin" }],
    });

    const user = await requireOrganizationRole(makeRequest(), ["admin", "owner"]);
    expect(user).not.toBeNull();
    expect(user?.organizationRole).toBe("admin");
  });

  it("returns null when role is not allowed", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      emailVerifiedAt: new Date(),
      organizationId: "org-1",
      organization: { status: "active" },
      teamMemberships: [{ role: "member" }],
    });

    const user = await requireOrganizationRole(makeRequest(), ["admin", "owner"]);
    expect(user).toBeNull();
  });

  it("returns null when user has no team membership", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      emailVerifiedAt: new Date(),
      organizationId: "org-1",
      organization: { status: "active" },
      teamMemberships: [],
    });

    const user = await requireOrganizationRole(makeRequest(), ["admin"]);
    expect(user).toBeNull();
  });
});
