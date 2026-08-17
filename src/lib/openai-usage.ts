import { prisma } from "./prisma";

// OpenAI pricing (per 1M tokens) as of 2024
// Source: https://openai.com/pricing
const OPENAI_PRICING: Record<string, { prompt: number; completion: number }> = {
  "gpt-5-nano": { prompt: 0.15, completion: 0.6 },
  "gpt-3.5-turbo": { prompt: 0.5, completion: 1.5 },
  "text-embedding-3-small": { prompt: 0.02, completion: 0 },
};

interface UsageLogParams {
  organizationId?: string | null;
  userId?: string | null;
  model: string;
  endpoint: string;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
  success?: boolean;
  errorMessage?: string | null;
  interviewId?: string | null;
}

/**
 * Calculate the cost of an OpenAI API call based on token usage.
 */
export function calculateCost(model: string, promptTokens: number, completionTokens: number): number {
  const pricing = OPENAI_PRICING[model];
  if (!pricing) return 0;

  const promptCost = (promptTokens / 1_000_000) * pricing.prompt;
  const completionCost = (completionTokens / 1_000_000) * pricing.completion;

  return Math.round((promptCost + completionCost) * 1_000_000) / 1_000_000; // Round to 6 decimal places
}

/**
 * Log an OpenAI API call to the database.
 */
export async function logOpenAIUsage(params: UsageLogParams): Promise<void> {
  try {
    const cost = calculateCost(params.model, params.promptTokens, params.completionTokens);

    await prisma.openAIUsageLog.create({
      data: {
        organizationId: params.organizationId || null,
        userId: params.userId || null,
        model: params.model,
        endpoint: params.endpoint,
        promptTokens: params.promptTokens,
        completionTokens: params.completionTokens,
        totalTokens: params.promptTokens + params.completionTokens,
        cost,
        latencyMs: params.latencyMs,
        success: params.success ?? true,
        errorMessage: params.errorMessage || null,
        interviewId: params.interviewId || null,
      },
    });
  } catch (error) {
    // Don't let logging errors break the main flow
    console.error("Failed to log OpenAI usage:", error);
  }
}

/**
 * Wrapper for OpenAI chat completions that automatically logs usage.
 */
export async function trackedChatCompletion<T>(
  openaiCall: () => Promise<T>,
  params: {
    model: string;
    endpoint: string;
    organizationId?: string | null;
    userId?: string | null;
    interviewId?: string | null;
  }
): Promise<T> {
  const startTime = Date.now();
  let success = true;
  let errorMessage: string | null = null;
  let result: T | null = null;

  try {
    result = await openaiCall();
    return result;
  } catch (error) {
    success = false;
    errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw error;
  } finally {
    const latencyMs = Date.now() - startTime;

    // Extract usage from the result if it's an OpenAI response
    if (result) {
      const response = result as Record<string, unknown>;
      const usage = response?.usage as { prompt_tokens?: number; completion_tokens?: number } | undefined;

      if (usage) {
        await logOpenAIUsage({
          organizationId: params.organizationId,
          userId: params.userId,
          model: params.model,
          endpoint: params.endpoint,
          promptTokens: usage.prompt_tokens || 0,
          completionTokens: usage.completion_tokens || 0,
          latencyMs,
          success,
          errorMessage,
          interviewId: params.interviewId,
        });
      }
    }
  }
}

/**
 * Wrapper for OpenAI embeddings that automatically logs usage.
 */
export async function trackedEmbedding<T>(
  openaiCall: () => Promise<T>,
  params: {
    model: string;
    endpoint: string;
    organizationId?: string | null;
    userId?: string | null;
  }
): Promise<T> {
  const startTime = Date.now();
  let success = true;
  let errorMessage: string | null = null;
  let result: T | null = null;

  try {
    result = await openaiCall();
    return result;
  } catch (error) {
    success = false;
    errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw error;
  } finally {
    const latencyMs = Date.now() - startTime;

    // Extract usage from the result if it's an OpenAI response
    if (result) {
      const response = result as Record<string, unknown>;
      const usage = response?.usage as { prompt_tokens?: number } | undefined;

      if (usage) {
        await logOpenAIUsage({
          organizationId: params.organizationId,
          userId: params.userId,
          model: params.model,
          endpoint: params.endpoint,
          promptTokens: usage.prompt_tokens || 0,
          completionTokens: 0,
          latencyMs,
          success,
          errorMessage,
        });
      }
    }
  }
}
