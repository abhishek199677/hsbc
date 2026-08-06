import { describe, it, expect, vi, afterEach } from "vitest";
import {
  generateVerificationToken,
  hashToken,
  tokenExpiryDate,
  isTokenExpired,
} from "@/lib/tokens";

describe("tokens", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("generates a 64-char hex token", () => {
    const token = generateVerificationToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect(generateVerificationToken()).not.toBe(generateVerificationToken());
  });

  it("hashes deterministically and irreversibly", () => {
    const token = "abc123";
    expect(hashToken(token)).toBe(hashToken(token));
    expect(hashToken(token)).not.toBe(token);
    expect(hashToken(token)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("expires after one hour", () => {
    vi.useFakeTimers();
    const before = new Date();
    const expiry = tokenExpiryDate();
    expect(expiry.getTime() - before.getTime()).toBe(60 * 60 * 1000);
  });

  it("isTokenExpired reflects current time", () => {
    vi.useFakeTimers();
    const past = new Date(Date.now() - 1000);
    const future = new Date(Date.now() + 1000);
    expect(isTokenExpired(past)).toBe(true);
    expect(isTokenExpired(future)).toBe(false);
  });
});
