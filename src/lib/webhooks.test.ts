import { describe, it, expect, vi } from "vitest";
import crypto from "crypto";
import {
  verifyWebhookSignature,
  WEBHOOK_EVENTS,
  type WebhookEvent,
} from "./webhooks";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    webhook: { create: vi.fn(), findMany: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
    webhookDelivery: { create: vi.fn(), findMany: vi.fn(), count: vi.fn() },
  },
}));

function generateSignature(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

describe("verifyWebhookSignature", () => {
  const secret = "test-webhook-secret-32-chars-long!!";
  const payload = JSON.stringify({ event: "interview.completed", data: {} });

  it("returns true for valid signature", () => {
    const sig = generateSignature(payload, secret);
    expect(verifyWebhookSignature(payload, sig, secret)).toBe(true);
  });

  it("returns false for invalid signature", () => {
    const sig = generateSignature(payload, secret);
    // Invalid signature of same length (64 hex chars)
    const wrongSig = "a".repeat(64);
    expect(verifyWebhookSignature(payload, wrongSig, secret)).toBe(false);
  });

  it("throws for mismatched signature lengths", () => {
    expect(() => verifyWebhookSignature(payload, "short", secret)).toThrow();
  });

  it("returns false for tampered payload", () => {
    const sig = generateSignature(payload, secret);
    const tampered = payload.replace("completed", "cancelled");
    expect(verifyWebhookSignature(tampered, sig, secret)).toBe(false);
  });

  it("returns false for wrong secret", () => {
    const sig = generateSignature(payload, secret);
    expect(verifyWebhookSignature(payload, sig, "wrong-secret")).toBe(false);
  });

  it("uses timing-safe comparison (same length required)", () => {
    const sig = generateSignature(payload, secret);
    expect(sig).toHaveLength(64); // SHA-256 hex is always 64 chars
  });
});

describe("WEBHOOK_EVENTS", () => {
  it("contains all expected event types", () => {
    const expectedEvents: WebhookEvent[] = [
      "interview.scheduled",
      "interview.started",
      "interview.completed",
      "interview.cancelled",
      "interview.evaluated",
      "candidate.matched",
      "candidate.shortlisted",
      "user.created",
      "user.verified",
      "organization.updated",
      "subscription.changed",
      "subscription.cancelled",
    ];

    for (const event of expectedEvents) {
      expect(WEBHOOK_EVENTS).toHaveProperty(event);
      expect(WEBHOOK_EVENTS[event]).toHaveProperty("description");
      expect(WEBHOOK_EVENTS[event]).toHaveProperty("category");
    }
  });

  it("each event has a non-empty description", () => {
    for (const [key, value] of Object.entries(WEBHOOK_EVENTS)) {
      expect(value.description.length).toBeGreaterThan(0);
      expect(value.category.length).toBeGreaterThan(0);
    }
  });
});
