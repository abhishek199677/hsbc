/**
 * Retry utility with exponential backoff for transient failures.
 */

interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  retryOn?: (error: unknown) => boolean;
}

const DEFAULT_RETRY_ON = (error: unknown): boolean => {
  if (error instanceof Error) {
    // Retry on rate limits, timeouts, and transient server errors
    const message = error.message.toLowerCase();
    if (message.includes("rate_limit")) return true;
    if (message.includes("timeout")) return true;
    if (message.includes("econnreset")) return true;
    if (message.includes("econnrefused")) return true;
    if (message.includes("overloaded")) return true;
    if (message.includes("503") || message.includes("502") || message.includes("429")) return true;
  }
  return false;
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelayMs = 1000,
    maxDelayMs = 30000,
    retryOn = DEFAULT_RETRY_ON,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries || !retryOn(error)) {
        throw error;
      }

      // Exponential backoff with jitter
      const delay = Math.min(
        baseDelayMs * Math.pow(2, attempt) + Math.random() * 1000,
        maxDelayMs
      );

      console.warn(
        `[retry] Attempt ${attempt + 1}/${maxRetries} failed, retrying in ${Math.round(delay)}ms...`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
