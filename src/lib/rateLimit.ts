export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
}

// ---------------------------------------------------------------------------
// Upstash Redis implementation (used when env vars are present)
// ---------------------------------------------------------------------------

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// Cache Ratelimit instances per window duration so each unique window size
// gets its own correctly-configured sliding-window limiter.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const upstashLimiters = new Map<number, any>();

let upstashInitialised = false;

async function ensureUpstash(): Promise<boolean> {
  if (upstashInitialised) return upstashLimiters.size > 0;
  upstashInitialised = true;

  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    console.log("[rateLimit] Using in-memory rate limiter (no Upstash env vars)");
    return false;
  }

  try {
    const { Ratelimit } = await import("@upstash/ratelimit");
    const { Redis } = await import("@upstash/redis");

    const redis = new Redis({ url: UPSTASH_URL, token: UPSTASH_TOKEN });

    // Store the factory so we can lazily create per-window limiters
    (globalThis as Record<string, unknown>).__upstashRatelimitFactory = Ratelimit;
    (globalThis as Record<string, unknown>).__upstashRedis = redis;

    console.log("[rateLimit] Using Upstash Redis rate limiter");
    return true;
  } catch (err) {
    console.warn("[rateLimit] Failed to initialise Upstash, falling back to in-memory:", err);
    return false;
  }
}

function getUpstashLimiter(windowMs: number) {
  if (upstashLimiters.has(windowMs)) return upstashLimiters.get(windowMs)!;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Ratelimit = (globalThis as Record<string, unknown>).__upstashRatelimitFactory as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const redis = (globalThis as Record<string, unknown>).__upstashRedis as any;

  const windowSec = Math.max(1, Math.ceil(windowMs / 1000));

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(1, `${windowSec}s`),
    analytics: false,
    enableProtection: false,
  });

  upstashLimiters.set(windowMs, limiter);
  return limiter;
}

async function upstashRateLimitByKey(
  key: string,
  { limit, windowMs }: RateLimitOptions
): Promise<RateLimitResult> {
  const limiter = getUpstashLimiter(windowMs);
  const res = await limiter.limit(key);
  return {
    allowed: res.success,
    limit,
    remaining: res.remaining,
    retryAfterSeconds: res.success ? 0 : Math.max(1, Math.ceil((res.reset - Date.now()) / 1000)),
  };
}

// ---------------------------------------------------------------------------
// In-memory sliding-window implementation (fallback)
// ---------------------------------------------------------------------------

interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();

function now(): number {
  return Date.now();
}

function inMemoryRateLimit(key: string, { limit, windowMs }: RateLimitOptions): RateLimitResult {
  const t = now();
  const id = `${key}:${Math.floor(t / windowMs) * windowMs}`;
  let bucket = buckets.get(id);
  if (!bucket) {
    bucket = { timestamps: [] };
    buckets.set(id, bucket);
  }
  const cutoff = t - windowMs;
  bucket.timestamps = bucket.timestamps.filter((ts) => ts > cutoff);
  if (bucket.timestamps.length === 0) {
    buckets.delete(id);
    bucket = { timestamps: [] };
    buckets.set(id, bucket);
  }
  if (bucket.timestamps.length >= limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((t - bucket.timestamps[0]) / 1000));
    return { allowed: false, limit, remaining: 0, retryAfterSeconds };
  }
  bucket.timestamps.push(t);
  return { allowed: true, limit, remaining: limit - bucket.timestamps.length, retryAfterSeconds: 0 };
}

// ---------------------------------------------------------------------------
// Unified public helpers – transparent to callers
// ---------------------------------------------------------------------------

export async function rateLimit(
  key: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const useUpstash = await ensureUpstash();
  if (useUpstash) {
    return upstashRateLimitByKey(key, options);
  }
  return inMemoryRateLimit(key, options);
}

export async function rateLimitByIp(
  request: Request,
  identifier: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    "unknown";
  return rateLimit(`ip:${ip}:${identifier}`, options);
}

export async function rateLimitByEmail(
  email: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  return rateLimit(`email:${email.toLowerCase()}`, options);
}
