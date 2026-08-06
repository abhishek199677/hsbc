import { describe, it, expect } from "vitest";
import { getPlanLimits, isPaidPlan, isPlanActive } from "@/lib/plan";

describe("getPlanLimits", () => {
  it("starter has 3 interviews and no analytics", () => {
    expect(getPlanLimits("starter")).toEqual({
      interviewsPerMonth: 3,
      videoRetentionDays: 30,
      supportsAnalytics: false,
    });
  });

  it("pro has 100 interviews", () => {
    expect(getPlanLimits("pro").interviewsPerMonth).toBe(100);
    expect(getPlanLimits("pro").supportsAnalytics).toBe(true);
  });

  it("enterprise is unlimited", () => {
    expect(getPlanLimits("enterprise").interviewsPerMonth).toBe(Infinity);
  });

  it("unknown plans fall back to starter", () => {
    expect(getPlanLimits("nonexistent").interviewsPerMonth).toBe(3);
  });
});

describe("isPaidPlan", () => {
  it("marks pro/enterprise as paid", () => {
    expect(isPaidPlan("pro")).toBe(true);
    expect(isPaidPlan("enterprise")).toBe(true);
    expect(isPaidPlan("starter")).toBe(false);
  });
});

describe("isPlanActive", () => {
  it("starter is always active", () => {
    expect(isPlanActive("starter", null)).toBe(true);
    expect(isPlanActive("starter", "canceled")).toBe(true);
  });

  it("paid plans require an active status", () => {
    expect(isPlanActive("pro", "active")).toBe(true);
    expect(isPlanActive("pro", "trialing")).toBe(true);
    expect(isPlanActive("pro", "past_due")).toBe(true);
    expect(isPlanActive("pro", null)).toBe(false);
    expect(isPlanActive("enterprise", "canceled")).toBe(false);
    expect(isPlanActive("enterprise", "unpaid")).toBe(false);
  });
});
