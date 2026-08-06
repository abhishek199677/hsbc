import { describe, it, expect } from "vitest";
import { rateLimit, rateLimitByIp } from "@/lib/rateLimit";

function makeRequest(ip: string): Request {
  return new Request("http://localhost", { headers: { "x-forwarded-for": ip } });
}

describe("rateLimit", () => {
  it("allows requests under the limit", () => {
    const result = rateLimit("test", { limit: 2, windowMs: 60_000 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(1);
  });

  it("blocks once the limit is reached", () => {
    const opts = { limit: 2, windowMs: 60_000 };
    rateLimit("block", opts);
    rateLimit("block", opts);
    const third = rateLimit("block", opts);
    expect(third.allowed).toBe(false);
    expect(third.retryAfterSeconds).toBeGreaterThanOrEqual(1);
  });

  it("keys are isolated", () => {
    const opts = { limit: 1, windowMs: 60_000 };
    expect(rateLimit("a", opts).allowed).toBe(true);
    expect(rateLimit("b", opts).allowed).toBe(true);
    expect(rateLimit("a", opts).allowed).toBe(false);
  });
});

describe("rateLimitByIp", () => {
  it("derives the key from the forwarded IP", () => {
    const opts = { limit: 1, windowMs: 60_000 };
    expect(rateLimitByIp(makeRequest("203.0.113.9"), "login", opts).allowed).toBe(true);
    expect(rateLimitByIp(makeRequest("203.0.113.9"), "login", opts).allowed).toBe(false);
    expect(rateLimitByIp(makeRequest("198.51.100.7"), "login", opts).allowed).toBe(true);
  });
});
