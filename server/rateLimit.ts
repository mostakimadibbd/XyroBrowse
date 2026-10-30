/**
 * Token bucket rate limiter with unreferenced timer for non-blocking process lifecycle.
 */

interface Bucket {
  tokens: number;
  lastRefill: number;
}

export class RateLimiter {
  private buckets = new Map<string, Bucket>();
  private maxTokens: number;
  private refillRatePerSec: number;

  constructor(maxTokens = 600, refillRatePerSec = 50) {
    this.maxTokens = maxTokens;
    this.refillRatePerSec = refillRatePerSec;

    // Periodic cleanup every 5 minutes, with unref() so Node doesn't stay alive on exit
    const timer = setInterval(() => {
      const now = Date.now();
      for (const [ip, bucket] of this.buckets.entries()) {
        if (now - bucket.lastRefill > 300000) {
          this.buckets.delete(ip);
        }
      }
    }, 300000);

    if (typeof timer.unref === 'function') {
      timer.unref();
    }
  }

  public check(ip: string): boolean {
    const now = Date.now();
    let bucket = this.buckets.get(ip);

    if (!bucket) {
      bucket = { tokens: this.maxTokens - 1, lastRefill: now };
      this.buckets.set(ip, bucket);
      return true;
    }

    const elapsedSec = (now - bucket.lastRefill) / 1000;
    bucket.tokens = Math.min(this.maxTokens, bucket.tokens + elapsedSec * this.refillRatePerSec);
    bucket.lastRefill = now;

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return true;
    }

    return false;
  }
}

// Dedicated rate limiters
export const searchRateLimiter = new RateLimiter(300, 25);
export const readerRateLimiter = new RateLimiter(300, 25);
export const documentNavRateLimiter = new RateLimiter(600, 50);
