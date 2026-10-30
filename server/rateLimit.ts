/**
 * In-memory token bucket rate limiter for client requests.
 */

interface Bucket {
  tokens: number;
  lastRefill: number;
}

export class RateLimiter {
  private buckets = new Map<string, Bucket>();
  private maxTokens: number;
  private refillRatePerSec: number;

  constructor(maxTokens = 120, refillRatePerSec = 4) {
    this.maxTokens = maxTokens;
    this.refillRatePerSec = refillRatePerSec;

    // Periodic cleanup of stale IPs every 5 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [ip, bucket] of this.buckets.entries()) {
        if (now - bucket.lastRefill > 300000) {
          this.buckets.delete(ip);
        }
      }
    }, 300000);
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

export const defaultRateLimiter = new RateLimiter();
