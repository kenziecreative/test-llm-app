import { RateLimitConfig } from '../types';

interface RateLimitEntry {
  count: number;
  tokens: number;
  windowStart: number;
}

/**
 * In-memory rate limiter for LLM requests
 * For production, consider using Redis or a distributed cache
 */
export class RateLimiter {
  private config: RateLimitConfig;
  private entries: Map<string, RateLimitEntry> = new Map();

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * Check if a request is allowed for the given user
   * @param userId - User identifier for rate limiting
   * @param estimatedTokens - Estimated tokens for this request
   * @returns Object with allowed status and remaining limits
   */
  check(
    userId: string,
    estimatedTokens: number = 0
  ): {
    allowed: boolean;
    remaining: number;
    resetIn: number;
    reason?: string;
  } {
    const now = Date.now();
    const entry = this.entries.get(userId);

    // No entry or window expired - allow and create new entry
    if (!entry || now - entry.windowStart >= this.config.windowMs) {
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetIn: this.config.windowMs,
      };
    }

    // Check request count limit
    if (entry.count >= this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetIn: this.config.windowMs - (now - entry.windowStart),
        reason: 'Request limit exceeded',
      };
    }

    // Check token limit for this request
    if (estimatedTokens > this.config.maxTokensPerRequest) {
      return {
        allowed: false,
        remaining: this.config.maxRequests - entry.count,
        resetIn: this.config.windowMs - (now - entry.windowStart),
        reason: `Token limit exceeded: ${estimatedTokens} > ${this.config.maxTokensPerRequest}`,
      };
    }

    return {
      allowed: true,
      remaining: this.config.maxRequests - entry.count - 1,
      resetIn: this.config.windowMs - (now - entry.windowStart),
    };
  }

  /**
   * Record a request for rate limiting
   * @param userId - User identifier
   * @param tokens - Actual tokens used
   */
  record(userId: string, tokens: number = 0): void {
    const now = Date.now();
    const entry = this.entries.get(userId);

    if (!entry || now - entry.windowStart >= this.config.windowMs) {
      // New window
      this.entries.set(userId, {
        count: 1,
        tokens,
        windowStart: now,
      });
    } else {
      // Update existing window
      entry.count++;
      entry.tokens += tokens;
    }
  }

  /**
   * Clear expired entries (call periodically to prevent memory leaks)
   */
  cleanup(): void {
    const now = Date.now();
    for (const [userId, entry] of this.entries) {
      if (now - entry.windowStart >= this.config.windowMs) {
        this.entries.delete(userId);
      }
    }
  }

  /**
   * Get current usage for a user
   */
  getUsage(userId: string): { requests: number; tokens: number } | null {
    const entry = this.entries.get(userId);
    if (!entry || Date.now() - entry.windowStart >= this.config.windowMs) {
      return null;
    }
    return { requests: entry.count, tokens: entry.tokens };
  }
}

/**
 * Default rate limiter instance
 */
export const defaultRateLimiter = new RateLimiter({
  maxRequests: parseInt(process.env.LLM_RATE_LIMIT_REQUESTS || '100', 10),
  windowMs: parseInt(process.env.LLM_RATE_LIMIT_WINDOW_MS || '60000', 10),
  maxTokensPerRequest: parseInt(process.env.LLM_MAX_TOKENS_PER_REQUEST || '4096', 10),
});
