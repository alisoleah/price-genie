/**
 * Rate limiting middleware for tRPC procedures
 * Prevents API abuse and ensures fair usage
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const entries = Array.from(this.store.entries());
      for (const [key, entry] of entries) {
        if (entry.resetAt < now) {
          this.store.delete(key);
        }
      }
    }, 60000);
  }

  /**
   * Check if request is allowed under rate limit
   * @param key - Unique identifier (e.g., user ID, IP address)
   * @param limit - Maximum requests allowed
   * @param windowMs - Time window in milliseconds
   * @returns true if allowed, false if rate limited
   */
  check(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || entry.resetAt < now) {
      // First request or expired window
      this.store.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      return true;
    }

    if (entry.count >= limit) {
      // Rate limit exceeded
      return false;
    }

    // Increment count
    entry.count++;
    return true;
  }

  /**
   * Get remaining requests for a key
   */
  getRemaining(key: string, limit: number): number {
    const entry = this.store.get(key);
    if (!entry || entry.resetAt < Date.now()) {
      return limit;
    }
    return Math.max(0, limit - entry.count);
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    this.store.delete(key);
  }

  cleanup(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

/**
 * Rate limit configurations for different endpoint types
 */
export const RATE_LIMITS = {
  // Search endpoints - moderate limits
  search: {
    limit: 60, // 60 requests
    window: 60 * 1000, // per minute
  },
  
  // Basket operations - higher limits for frequent updates
  basket: {
    limit: 120,
    window: 60 * 1000,
  },
  
  // Admin operations - stricter limits
  admin: {
    limit: 30,
    window: 60 * 1000,
  },
  
  // AI assistant - moderate limits due to LLM costs
  assistant: {
    limit: 20,
    window: 60 * 1000,
  },
  
  // General API - default limits
  default: {
    limit: 100,
    window: 60 * 1000,
  },
};

/**
 * Create rate limit key from user context
 */
export function getRateLimitKey(userId: number | undefined, ip: string = 'unknown'): string {
  return userId ? `user:${userId}` : `ip:${ip}`;
}
