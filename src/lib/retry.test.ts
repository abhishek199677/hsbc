import { describe, it, expect, vi } from "vitest";
import { withRetry } from "./retry";

describe("withRetry", () => {
  it("returns result on first success", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    const result = await withRetry(fn, { maxRetries: 3 });
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on transient failure and eventually succeeds", async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error("rate_limit exceeded"))
      .mockRejectedValueOnce(new Error("timeout"))
      .mockResolvedValue("ok");

    const result = await withRetry(fn, {
      maxRetries: 3,
      baseDelayMs: 10,
      retryOn: () => true,
    });
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("throws after maxRetries exhausted", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("persistent error"));

    await expect(
      withRetry(fn, { maxRetries: 2, baseDelayMs: 10, retryOn: () => true })
    ).rejects.toThrow("persistent error");
    expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  it("does not retry when retryOn returns false", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("auth failed"));

    await expect(
      withRetry(fn, { maxRetries: 3, baseDelayMs: 10, retryOn: () => false })
    ).rejects.toThrow("auth failed");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("uses exponential backoff", async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValue("ok");

    const start = Date.now();
    await withRetry(fn, { maxRetries: 1, baseDelayMs: 100, retryOn: () => true });
    const elapsed = Date.now() - start;

    // Should have waited at least baseDelayMs
    expect(elapsed).toBeGreaterThanOrEqual(90);
  });
});
