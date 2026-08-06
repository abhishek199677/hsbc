// In-memory sliding-window rate limiter.
// Suitable for single-instance deployments. For multi-instance (serverless)
// scale, swap the store for Redis/Upstash while keeping the same interface.

interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();

function now(): number {
  return Date.now();
}

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

export function rateLimit(key: string, { limit, windowMs }: RateLimitOptions): RateLimitResult {
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

export function rateLimitByIp(
  request: Request,
  identifier: string,
  options: RateLimitOptions
): RateLimitResult {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    "unknown";
  return rateLimit(`ip:${ip}:${identifier}`, options);
}

export function rateLimitByEmail(
  email: string,
  options: RateLimitOptions
): RateLimitResult {
  return rateLimit(`email:${email.toLowerCase()}`, options);
}
