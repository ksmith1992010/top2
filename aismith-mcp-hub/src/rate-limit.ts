import { AppError } from "./errors.js";

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Best-effort in-memory rate limiter for Cloudflare Workers free tier.
 * Limits are per isolate (not globally shared). Suitable as a basic abuse brake.
 */
export class InMemoryRateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  constructor(
    private readonly maxRequests: number,
    private readonly windowMs: number,
  ) {}

  check(key: string, now = Date.now()): { allowed: boolean; retryAfterSec: number } {
    this.prune(now);

    const existing = this.buckets.get(key);
    if (!existing || existing.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + this.windowMs });
      return { allowed: true, retryAfterSec: 0 };
    }

    if (existing.count >= this.maxRequests) {
      const retryAfterSec = Math.max(
        1,
        Math.ceil((existing.resetAt - now) / 1000),
      );
      return { allowed: false, retryAfterSec };
    }

    existing.count += 1;
    return { allowed: true, retryAfterSec: 0 };
  }

  private prune(now: number): void {
    if (this.buckets.size < 500) {
      return;
    }
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) {
        this.buckets.delete(key);
      }
    }
  }
}

/** Shared across requests in the same Worker isolate. */
const limiters = new Map<string, InMemoryRateLimiter>();

export function getRateLimiter(
  maxRequests: number,
  windowMs: number,
): InMemoryRateLimiter {
  const key = `${maxRequests}:${windowMs}`;
  let limiter = limiters.get(key);
  if (!limiter) {
    limiter = new InMemoryRateLimiter(maxRequests, windowMs);
    limiters.set(key, limiter);
  }
  return limiter;
}

export function clientKeyFromRequest(request: Request): string {
  const cfConnecting = request.headers.get("cf-connecting-ip");
  if (cfConnecting) {
    return `ip:${cfConnecting}`;
  }
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return `ip:${forwarded.split(",")[0]?.trim() || "unknown"}`;
  }
  return "ip:unknown";
}

export function enforceRateLimit(
  request: Request,
  maxRequests: number,
  windowMs: number,
): void {
  const limiter = getRateLimiter(maxRequests, windowMs);
  const key = clientKeyFromRequest(request);
  const result = limiter.check(key);
  if (!result.allowed) {
    throw new AppError(
      "RATE_LIMITED",
      "Too many requests. Try again later.",
      429,
      { retryAfterSec: result.retryAfterSec },
    );
  }
}

/** Test helper to clear isolate-local limiter state. */
export function resetRateLimitersForTests(): void {
  limiters.clear();
}
