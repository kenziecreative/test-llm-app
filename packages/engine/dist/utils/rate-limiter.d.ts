import { RateLimitConfig } from '../types';
/**
 * In-memory rate limiter for LLM requests
 * For production, consider using Redis or a distributed cache
 */
export declare class RateLimiter {
    private config;
    private entries;
    constructor(config: RateLimitConfig);
    /**
     * Check if a request is allowed for the given user
     * @param userId - User identifier for rate limiting
     * @param estimatedTokens - Estimated tokens for this request
     * @returns Object with allowed status and remaining limits
     */
    check(userId: string, estimatedTokens?: number): {
        allowed: boolean;
        remaining: number;
        resetIn: number;
        reason?: string;
    };
    /**
     * Record a request for rate limiting
     * @param userId - User identifier
     * @param tokens - Actual tokens used
     */
    record(userId: string, tokens?: number): void;
    /**
     * Clear expired entries (call periodically to prevent memory leaks)
     */
    cleanup(): void;
    /**
     * Get current usage for a user
     */
    getUsage(userId: string): {
        requests: number;
        tokens: number;
    } | null;
}
/**
 * Default rate limiter instance
 */
export declare const defaultRateLimiter: RateLimiter;
