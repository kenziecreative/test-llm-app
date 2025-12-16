"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultRateLimiter = exports.RateLimiter = void 0;
/**
 * In-memory rate limiter for LLM requests
 * For production, consider using Redis or a distributed cache
 */
class RateLimiter {
    config;
    entries = new Map();
    constructor(config) {
        this.config = config;
    }
    /**
     * Check if a request is allowed for the given user
     * @param userId - User identifier for rate limiting
     * @param estimatedTokens - Estimated tokens for this request
     * @returns Object with allowed status and remaining limits
     */
    check(userId, estimatedTokens = 0) {
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
    record(userId, tokens = 0) {
        const now = Date.now();
        const entry = this.entries.get(userId);
        if (!entry || now - entry.windowStart >= this.config.windowMs) {
            // New window
            this.entries.set(userId, {
                count: 1,
                tokens,
                windowStart: now,
            });
        }
        else {
            // Update existing window
            entry.count++;
            entry.tokens += tokens;
        }
    }
    /**
     * Clear expired entries (call periodically to prevent memory leaks)
     */
    cleanup() {
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
    getUsage(userId) {
        const entry = this.entries.get(userId);
        if (!entry || Date.now() - entry.windowStart >= this.config.windowMs) {
            return null;
        }
        return { requests: entry.count, tokens: entry.tokens };
    }
}
exports.RateLimiter = RateLimiter;
/**
 * Default rate limiter instance
 */
exports.defaultRateLimiter = new RateLimiter({
    maxRequests: parseInt(process.env.LLM_RATE_LIMIT_REQUESTS || '100', 10),
    windowMs: parseInt(process.env.LLM_RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxTokensPerRequest: parseInt(process.env.LLM_MAX_TOKENS_PER_REQUEST || '4096', 10),
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmF0ZS1saW1pdGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3V0aWxzL3JhdGUtbGltaXRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFRQTs7O0dBR0c7QUFDSCxNQUFhLFdBQVc7SUFDZCxNQUFNLENBQWtCO0lBQ3hCLE9BQU8sR0FBZ0MsSUFBSSxHQUFHLEVBQUUsQ0FBQztJQUV6RCxZQUFZLE1BQXVCO1FBQ2pDLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO0lBQ3ZCLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILEtBQUssQ0FDSCxNQUFjLEVBQ2Qsa0JBQTBCLENBQUM7UUFPM0IsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQ3ZCLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRXZDLDBEQUEwRDtRQUMxRCxJQUFJLENBQUMsS0FBSyxJQUFJLEdBQUcsR0FBRyxLQUFLLENBQUMsV0FBVyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDOUQsT0FBTztnQkFDTCxPQUFPLEVBQUUsSUFBSTtnQkFDYixTQUFTLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLEdBQUcsQ0FBQztnQkFDdEMsT0FBTyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUTthQUM5QixDQUFDO1FBQ0osQ0FBQztRQUVELDRCQUE0QjtRQUM1QixJQUFJLEtBQUssQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUMzQyxPQUFPO2dCQUNMLE9BQU8sRUFBRSxLQUFLO2dCQUNkLFNBQVMsRUFBRSxDQUFDO2dCQUNaLE9BQU8sRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsR0FBRyxDQUFDLEdBQUcsR0FBRyxLQUFLLENBQUMsV0FBVyxDQUFDO2dCQUN6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QUFDLHVCQUF1QixJQUFJLEtBQUssRUFBRSxFQUFFLENBQUM7SUFDdkUsUUFBUSxFQUFFLFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLHdCQUF3QixJQUFJLE9BQU8sRUFBRSxFQUFFLENBQUM7SUFDdkUsbUJBQW1CLEVBQUUsUUFBUSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsMEJBQTBCLElBQUksTUFBTSxFQUFFLEVBQUUsQ0FBQztDQUNwRixDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBSYXRlTGltaXRDb25maWcgfSBmcm9tICcuLi90eXBlcyc7XG5cbmludGVyZmFjZSBSYXRlTGltaXRFbnRyeSB7XG4gIGNvdW50OiBudW1iZXI7XG4gIHRva2VuczogbnVtYmVyO1xuICB3aW5kb3dTdGFydDogbnVtYmVyO1xufVxuXG4vKipcbiAqIEluLW1lbW9yeSByYXRlIGxpbWl0ZXIgZm9yIExMTSByZXF1ZXN0c1xuICogRm9yIHByb2R1Y3Rpb24sIGNvbnNpZGVyIHVzaW5nIFJlZGlzIG9yIGEgZGlzdHJpYnV0ZWQgY2FjaGVcbiAqL1xuZXhwb3J0IGNsYXNzIFJhdGVMaW1pdGVyIHtcbiAgcHJpdmF0ZSBjb25maWc6IFJhdGVMaW1pdENvbmZpZztcbiAgcHJpdmF0ZSBlbnRyaWVzOiBNYXA8c3RyaW5nLCBSYXRlTGltaXRFbnRyeT4gPSBuZXcgTWFwKCk7XG5cbiAgY29uc3RydWN0b3IoY29uZmlnOiBSYXRlTGltaXRDb25maWcpIHtcbiAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiBhIHJlcXVlc3QgaXMgYWxsb3dlZCBmb3IgdGhlIGdpdmVuIHVzZXJcbiAgICogQHBhcmFtIHVzZXJJZCAtIFVzZXIgaWRlbnRpZmllciBmb3IgcmF0ZSBsaW1pdGluZ1xuICAgKiBAcGFyYW0gZXN0aW1hdGVkVG9rZW5zIC0gRXN0aW1hdGVkIHRva2VucyBmb3IgdGhpcyByZXF1ZXN0XG4gICAqIEByZXR1cm5zIE9iamVjdCB3aXRoIGFsbG93ZWQgc3RhdHVzIGFuZCByZW1haW5pbmcgbGltaXRzXG4gICAqL1xuICBjaGVjayhcbiAgICB1c2VySWQ6IHN0cmluZyxcbiAgICBlc3RpbWF0ZWRUb2tlbnM6IG51bWJlciA9IDBcbiAgKToge1xuICAgIGFsbG93ZWQ6IGJvb2xlYW47XG4gICAgcmVtYWluaW5nOiBudW1iZXI7XG4gICAgcmVzZXRJbjogbnVtYmVyO1xuICAgIHJlYXNvbj86IHN0cmluZztcbiAgfSB7XG4gICAgY29uc3Qgbm93ID0gRGF0ZS5ub3coKTtcbiAgICBjb25zdCBlbnRyeSA9IHRoaXMuZW50cmllcy5nZXQodXNlcklkKTtcblxuICAgIC8vIE5vIGVudHJ5IG9yIHdpbmRvdyBleHBpcmVkIC0gYWxsb3cgYW5kIGNyZWF0ZSBuZXcgZW50cnlcbiAgICBpZiAoIWVudHJ5IHx8IG5vdyAtIGVudHJ5LndpbmRvd1N0YXJ0ID49IHRoaXMuY29uZmlnLndpbmRvd01zKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBhbGxvd2VkOiB0cnVlLFxuICAgICAgICByZW1haW5pbmc6IHRoaXMuY29uZmlnLm1heFJlcXVlc3RzIC0gMSxcbiAgICAgICAgcmVzZXRJbjogdGhpcy5jb25maWcud2luZG93TXMsXG4gICAgICB9O1xuICAgIH1cblxuICAgIC8vIENoZWNrIHJlcXVlc3QgY291bnQgbGltaXRcbiAgICBpZiAoZW50cnkuY291bnQgPj0gdGhpcy5jb25maWcubWF4UmVxdWVzdHMpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGFsbG93ZWQ6IGZhbHNlLFxuICAgICAgICByZW1haW5pbmc6IDAsXG4gICAgICAgIHJlc2V0SW46IHRoaXMuY29uZmlnLndpbmRvd01zIC0gKG5vdyAtIGVudHJ5LndpbmRvd1N0YXJ0KSxcbiAgICAgICAgcmVhc29uOiAnUmVxdWVzdCBsaW1pdCBleGNlZWRlZCcsXG4gICAgICB9O1xuICAgIH1cblxuICAgIC8vIENoZWNrIHRva2VuIGxpbWl0IGZvciB0aGlzIHJlcXVlc3RcbiAgICBpZiAoZXN0aW1hdGVkVG9rZW5zID4gdGhpcy5jb25maWcubWF4VG9rZW5zUGVyUmVxdWVzdCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgYWxsb3dlZDogZmFsc2UsXG4gICAgICAgIHJlbWFpbmluZzogdGhpcy5jb25maWcubWF4UmVxdWVzdHMgLSBlbnRyeS5jb3VudCxcbiAgICAgICAgcmVzZXRJbjogdGhpcy5jb25maWcud2luZG93TXMgLSAobm93IC0gZW50cnkud2luZG93U3RhcnQpLFxuICAgICAgICByZWFzb246IGBUb2tlbiBsaW1pdCBleGNlZWRlZDogJHtlc3RpbWF0ZWRUb2tlbnN9ID4gJHt0aGlzLmNvbmZpZy5tYXhUb2tlbnNQZXJSZXF1ZXN0fWAsXG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBhbGxvd2VkOiB0cnVlLFxuICAgICAgcmVtYWluaW5nOiB0aGlzLmNvbmZpZy5tYXhSZXF1ZXN0cyAtIGVudHJ5LmNvdW50IC0gMSxcbiAgICAgIHJlc2V0SW46IHRoaXMuY29uZmlnLndpbmRvd01zIC0gKG5vdyAtIGVudHJ5LndpbmRvd1N0YXJ0KSxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIFJlY29yZCBhIHJlcXVlc3QgZm9yIHJhdGUgbGltaXRpbmdcbiAgICogQHBhcmFtIHVzZXJJZCAtIFVzZXIgaWRlbnRpZmllclxuICAgKiBAcGFyYW0gdG9rZW5zIC0gQWN0dWFsIHRva2VucyB1c2VkXG4gICAqL1xuICByZWNvcmQodXNlcklkOiBzdHJpbmcsIHRva2VuczogbnVtYmVyID0gMCk6IHZvaWQge1xuICAgIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XG4gICAgY29uc3QgZW50cnkgPSB0aGlzLmVudHJpZXMuZ2V0KHVzZXJJZCk7XG5cbiAgICBpZiAoIWVudHJ5IHx8IG5vdyAtIGVudHJ5LndpbmRvd1N0YXJ0ID49IHRoaXMuY29uZmlnLndpbmRvd01zKSB7XG4gICAgICAvLyBOZXcgd2luZG93XG4gICAgICB0aGlzLmVudHJpZXMuc2V0KHVzZXJJZCwge1xuICAgICAgICBjb3VudDogMSxcbiAgICAgICAgdG9rZW5zLFxuICAgICAgICB3aW5kb3dTdGFydDogbm93LFxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFVwZGF0ZSBleGlzdGluZyB3aW5kb3dcbiAgICAgIGVudHJ5LmNvdW50Kys7XG4gICAgICBlbnRyeS50b2tlbnMgKz0gdG9rZW5zO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDbGVhciBleHBpcmVkIGVudHJpZXMgKGNhbGwgcGVyaW9kaWNhbGx5IHRvIHByZXZlbnQgbWVtb3J5IGxlYWtzKVxuICAgKi9cbiAgY2xlYW51cCgpOiB2b2lkIHtcbiAgICBjb25zdCBub3cgPSBEYXRlLm5vdygpO1xuICAgIGZvciAoY29uc3QgW3VzZXJJZCwgZW50cnldIG9mIHRoaXMuZW50cmllcykge1xuICAgICAgaWYgKG5vdyAtIGVudHJ5LndpbmRvd1N0YXJ0ID49IHRoaXMuY29uZmlnLndpbmRvd01zKSB7XG4gICAgICAgIHRoaXMuZW50cmllcy5kZWxldGUodXNlcklkKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0IGN1cnJlbnQgdXNhZ2UgZm9yIGEgdXNlclxuICAgKi9cbiAgZ2V0VXNhZ2UodXNlcklkOiBzdHJpbmcpOiB7IHJlcXVlc3RzOiBudW1iZXI7IHRva2VuczogbnVtYmVyIH0gfCBudWxsIHtcbiAgICBjb25zdCBlbnRyeSA9IHRoaXMuZW50cmllcy5nZXQodXNlcklkKTtcbiAgICBpZiAoIWVudHJ5IHx8IERhdGUubm93KCkgLSBlbnRyeS53aW5kb3dTdGFydCA+PSB0aGlzLmNvbmZpZy53aW5kb3dNcykge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHJldHVybiB7IHJlcXVlc3RzOiBlbnRyeS5jb3VudCwgdG9rZW5zOiBlbnRyeS50b2tlbnMgfTtcbiAgfVxufVxuXG4vKipcbiAqIERlZmF1bHQgcmF0ZSBsaW1pdGVyIGluc3RhbmNlXG4gKi9cbmV4cG9ydCBjb25zdCBkZWZhdWx0UmF0ZUxpbWl0ZXIgPSBuZXcgUmF0ZUxpbWl0ZXIoe1xuICBtYXhSZXF1ZXN0czogcGFyc2VJbnQocHJvY2Vzcy5lbnYuTExNX1JBVEVfTElNSVRfUkVRVUVTVFMgfHwgJzEwMCcsIDEwKSxcbiAgd2luZG93TXM6IHBhcnNlSW50KHByb2Nlc3MuZW52LkxMTV9SQVRFX0xJTUlUX1dJTkRPV19NUyB8fCAnNjAwMDAnLCAxMCksXG4gIG1heFRva2Vuc1BlclJlcXVlc3Q6IHBhcnNlSW50KHByb2Nlc3MuZW52LkxMTV9NQVhfVE9LRU5TX1BFUl9SRVFVRVNUIHx8ICc0MDk2JywgMTApLFxufSk7XG4iXX0=