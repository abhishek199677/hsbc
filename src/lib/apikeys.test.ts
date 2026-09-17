import { describe, it, expect, vi } from "vitest";
import crypto from "crypto";
import { API_PERMISSIONS, generateApiDocs } from "./apikeys";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    apiKey: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe("API_PERMISSIONS", () => {
  it("has all permission categories", () => {
    expect(API_PERMISSIONS).toHaveProperty("interviews");
    expect(API_PERMISSIONS).toHaveProperty("candidates");
    expect(API_PERMISSIONS).toHaveProperty("users");
    expect(API_PERMISSIONS).toHaveProperty("analytics");
    expect(API_PERMISSIONS).toHaveProperty("webhooks");
    expect(API_PERMISSIONS).toHaveProperty("apikeys");
  });

  it("permissions follow resource:action format", () => {
    for (const category of Object.values(API_PERMISSIONS)) {
      for (const perm of Object.values(category)) {
        expect(perm).toMatch(/^[a-z]+:[a-z]+$/);
      }
    }
  });
});

describe("generateApiDocs", () => {
  it("returns matching endpoints for given permissions", () => {
    const docs = generateApiDocs(["interviews:read"]);
    expect(docs).toContain("GET /api/v1/interviews");
    expect(docs).toContain("GET /api/v1/interviews/:id");
    expect(docs).not.toContain("POST /api/v1/interviews");
  });

  it("returns multiple endpoints for multiple permissions", () => {
    const docs = generateApiDocs(["interviews:read", "interviews:write"]);
    expect(docs).toContain("GET /api/v1/interviews");
    expect(docs).toContain("POST /api/v1/interviews");
  });

  it("returns empty string for no matching permissions", () => {
    const docs = generateApiDocs(["nonexistent:read"]);
    expect(docs).toBe("");
  });

  it("includes permission info in output", () => {
    const docs = generateApiDocs(["analytics:read"]);
    expect(docs).toContain("Permission: analytics:read");
  });
});
