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

const upstashLimiters = new Map<string, unknown>();

let upstashInitialised = false;

async function ensureUpstash(): Promise<boolean> {
  if (upstashInitialised) return upstashLimiters.size > 0;
  upstashInitialised = true;

  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    return false;
  }

  try {
    const { Ratelimit } = await import("@upstash/ratelimit");
    const { Redis } = await import("@upstash/redis");

    const redis = new Redis({ url: UPSTASH_URL, token: UPSTASH_TOKEN });

    (globalThis as Record<string, unknown>).__upstashRatelimitFactory = Ratelimit;
    (globalThis as Record<string, unknown>).__upstashRedis = redis;

    console.log("[rateLimit] Using Upstash Redis rate limiter");
    return true;
  } catch (err) {
    console.warn("[rateLimit] Failed to initialise Upstash, falling back to in-memory:", err);
    return false;
  }
}

function getUpstashLimiter(limit: number, windowMs: number) {
  const cacheKey = `${limit}:${windowMs}`;
  if (upstashLimiters.has(cacheKey)) return upstashLimiters.get(cacheKey)!;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Ratelimit = (globalThis as Record<string, unknown>).__upstashRatelimitFactory as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const redis = (globalThis as Record<string, unknown>).__upstashRedis as any;

  const windowSec = Math.max(1, Math.ceil(windowMs / 1000));

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, `${windowSec}s`),
    analytics: false,
    enableProtection: false,
  });

  upstashLimiters.set(cacheKey, limiter);
  return limiter;
}

async function upstashRateLimitByKey(
  key: string,
  { limit, windowMs }: RateLimitOptions
): Promise<RateLimitResult> {
  const limiter = getUpstashLimiter(limit, windowMs);
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

// Periodic eviction of expired buckets to prevent unbounded memory growth
const EVICTION_INTERVAL_MS = 60_000; // every 60 seconds
let lastEviction = Date.now();

function evictExpiredBuckets() {
  const now = Date.now();
  if (now - lastEviction < EVICTION_INTERVAL_MS) return;
  lastEviction = now;

  // Extract max window from all keys to determine staleness
  // A bucket is stale if its newest timestamp is older than 2x the max window
  for (const [id, bucket] of buckets) {
    if (bucket.timestamps.length === 0) {
      buckets.delete(id);
      continue;
    }
    const newestTs = bucket.timestamps[bucket.timestamps.length - 1];
    // If the newest entry is more than 10 minutes old, evict
    if (now - newestTs > 10 * 60 * 1000) {
      buckets.delete(id);
    }
  }
}

function inMemoryRateLimit(key: string, { limit, windowMs }: RateLimitOptions): RateLimitResult {
  // Run eviction on every call (cheap check via timestamp)
  evictExpiredBuckets();

  const t = Date.now();
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
    const retryAfterSeconds = Math.max(1, Math.ceil((bucket.timestamps[0] + windowMs - t) / 1000));
    return { allowed: false, limit, remaining: 0, retryAfterSeconds };
  }
  bucket.timestamps.push(t);
  return { allowed: true, limit, remaining: limit - bucket.timestamps.length, retryAfterSeconds: 0 };
}

// ---------------------------------------------------------------------------
// Unified public helpers
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
