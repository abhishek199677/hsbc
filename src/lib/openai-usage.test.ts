import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma to avoid DATABASE_URL requirement
vi.mock("./prisma", () => ({
  prisma: {
    openAIUsageLog: {
      create: vi.fn().mockResolvedValue({}),
    },
  },
}));

import { calculateCost, logOpenAIUsage, trackedChatCompletion } from "./openai-usage";

describe("calculateCost", () => {
  it("calculates cost for gpt-5-nano", () => {
    const cost = calculateCost("gpt-5-nano", 1000, 500);
    expect(cost).toBeCloseTo(0.00045, 6);
  });

  it("calculates cost for gpt-3.5-turbo", () => {
    const cost = calculateCost("gpt-3.5-turbo", 2000, 1000);
    expect(cost).toBeCloseTo(0.0025, 6);
  });

  it("returns 0 for unknown model", () => {
    expect(calculateCost("unknown-model", 1000, 500)).toBe(0);
  });

  it("returns 0 for zero tokens", () => {
    expect(calculateCost("gpt-5-nano", 0, 0)).toBe(0);
  });

  it("handles large token counts", () => {
    const cost = calculateCost("gpt-5-nano", 1_000_000, 1_000_000);
    expect(cost).toBeCloseTo(0.75, 6);
  });

  it("handles embedding model (zero completion cost)", () => {
    const cost = calculateCost("text-embedding-3-small", 1000, 0);
    expect(cost).toBeCloseTo(0.00002, 6);
  });

  it("rounds to 6 decimal places", () => {
    const cost = calculateCost("gpt-5-nano", 333, 333);
    expect(cost).toBeCloseTo(0.00025, 6);
  });
});

describe("logOpenAIUsage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs usage to database", async () => {
    const { prisma } = await import("./prisma");
    const createMock = prisma.openAIUsageLog.create as ReturnType<typeof vi.fn>;

    await logOpenAIUsage({
      model: "gpt-3.5-turbo",
      endpoint: "/api/chat",
      promptTokens: 100,
      completionTokens: 50,
      latencyMs: 1500,
    });

    expect(createMock).toHaveBeenCalledOnce();
    expect(createMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        model: "gpt-3.5-turbo",
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
      }),
    });
  });
});

describe("trackedChatCompletion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns result and logs usage on success", async () => {
    const mockResult = {
      choices: [{ message: { content: "Hello" } }],
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    };

    const result = await trackedChatCompletion(
      async () => mockResult,
      { model: "gpt-3.5-turbo", endpoint: "/api/chat" }
    );

    expect(result).toEqual(mockResult);
  });

  it("retries on rate limit error", async () => {
    let attempts = 0;
    const mockResult = {
      choices: [{ message: { content: "Hello" } }],
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    };

    const result = await trackedChatCompletion(
      async () => {
        attempts++;
        if (attempts === 1) throw new Error("rate_limit exceeded");
        return mockResult;
      },
      { model: "gpt-3.5-turbo", endpoint: "/api/chat" }
    );

    expect(result).toEqual(mockResult);
    expect(attempts).toBe(2);
  });
});
