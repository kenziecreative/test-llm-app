import { RateLimiter } from '../src/utils/rate-limiter';

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter({
      maxRequests: 5,
      windowMs: 1000,
      maxTokensPerRequest: 1000,
    });
  });

  describe('check', () => {
    it('should allow first request', () => {
      const result = rateLimiter.check('user1');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('should track request count', () => {
      rateLimiter.record('user1');
      rateLimiter.record('user1');
      rateLimiter.record('user1');

      const result = rateLimiter.check('user1');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);
    });

    it('should deny when limit exceeded', () => {
      for (let i = 0; i < 5; i++) {
        rateLimiter.record('user1');
      }

      const result = rateLimiter.check('user1');
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.reason).toBe('Request limit exceeded');
    });

    it('should deny when token limit exceeded', () => {
      const result = rateLimiter.check('user1', 2000);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Token limit exceeded');
    });

    it('should track different users separately', () => {
      for (let i = 0; i < 5; i++) {
        rateLimiter.record('user1');
      }

      const user1Result = rateLimiter.check('user1');
      const user2Result = rateLimiter.check('user2');

      expect(user1Result.allowed).toBe(false);
      expect(user2Result.allowed).toBe(true);
    });
  });

  describe('record', () => {
    it('should record requests', () => {
      rateLimiter.record('user1', 100);
      const usage = rateLimiter.getUsage('user1');

      expect(usage).not.toBeNull();
      expect(usage?.requests).toBe(1);
      expect(usage?.tokens).toBe(100);
    });

    it('should accumulate tokens', () => {
      rateLimiter.record('user1', 100);
      rateLimiter.record('user1', 200);
      rateLimiter.record('user1', 300);

      const usage = rateLimiter.getUsage('user1');
      expect(usage?.tokens).toBe(600);
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries', async () => {
      rateLimiter.record('user1');

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 1100));

      rateLimiter.cleanup();
      const usage = rateLimiter.getUsage('user1');

      expect(usage).toBeNull();
    });
  });

  describe('window reset', () => {
    it('should reset after window expires', async () => {
      for (let i = 0; i < 5; i++) {
        rateLimiter.record('user1');
      }

      expect(rateLimiter.check('user1').allowed).toBe(false);

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 1100));

      expect(rateLimiter.check('user1').allowed).toBe(true);
    });
  });
});
