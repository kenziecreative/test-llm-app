import { LLMClient, createLLMClient } from '../src/llm-client';
import { RateLimiter } from '../src/utils/rate-limiter';

// Mock the providers
jest.mock('../src/providers/openai', () => ({
  OpenAIProvider: jest.fn().mockImplementation(() => ({
    provider: 'openai',
    complete: jest.fn().mockResolvedValue({
      content: 'Hello from OpenAI!',
      model: 'gpt-5.2',
      provider: 'openai',
      usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
      finishReason: 'stop',
    }),
    stream: jest.fn().mockImplementation(async function* () {
      yield { content: 'Hello', done: false };
      yield { content: ' World', done: false };
      yield { content: '', done: true };
    }),
    estimateTokens: jest.fn().mockImplementation((text: string) => Math.ceil(text.length / 4)),
    getModel: jest.fn().mockReturnValue('gpt-5.2'),
  })),
}));

describe('LLMClient', () => {
  let client: LLMClient;
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter({
      maxRequests: 10,
      windowMs: 60000,
      maxTokensPerRequest: 4096,
    });

    client = new LLMClient({
      provider: 'openai',
      openai: {
        apiKey: 'test-key',
        model: 'gpt-5.2',
      },
      rateLimiter,
    });
  });

  describe('complete', () => {
    it('should return a completion response', async () => {
      const response = await client.complete({
        messages: [{ role: 'user', content: 'Hello!' }],
      });

      expect(response.content).toBe('Hello from OpenAI!');
      expect(response.provider).toBe('openai');
      expect(response.model).toBe('gpt-5.2');
    });

    it('should validate input messages', async () => {
      await expect(
        client.complete({
          messages: [],
        })
      ).rejects.toThrow();
    });

    it('should enforce rate limits', async () => {
      // Exhaust rate limit
      for (let i = 0; i < 10; i++) {
        rateLimiter.record('test-user');
      }

      await expect(
        client.complete({
          messages: [{ role: 'user', content: 'Hello!' }],
          userId: 'test-user',
        })
      ).rejects.toThrow('Rate limit exceeded');
    });

    it('should record usage after completion', async () => {
      await client.complete({
        messages: [{ role: 'user', content: 'Hello!' }],
        userId: 'test-user',
      });

      const usage = rateLimiter.getUsage('test-user');
      expect(usage).not.toBeNull();
      expect(usage?.requests).toBe(1);
    });
  });

  describe('stream', () => {
    it('should yield stream chunks', async () => {
      const chunks: string[] = [];

      for await (const chunk of client.stream({
        messages: [{ role: 'user', content: 'Hello!' }],
      })) {
        chunks.push(chunk.content);
      }

      expect(chunks).toContain('Hello');
      expect(chunks).toContain(' World');
    });
  });

  describe('getProvider', () => {
    it('should return the provider name', () => {
      expect(client.getProvider()).toBe('openai');
    });
  });

  describe('getModel', () => {
    it('should return the model name', () => {
      expect(client.getModel()).toBe('gpt-5.2');
    });
  });
});

describe('createLLMClient', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should create client from environment variables', () => {
    process.env.LLM_PROVIDER = 'openai';
    process.env.OPENAI_API_KEY = 'test-key';
    process.env.OPENAI_MODEL = 'gpt-5.2';

    const client = createLLMClient();
    expect(client.getProvider()).toBe('openai');
  });

  it('should allow overrides', () => {
    const client = createLLMClient({
      provider: 'openai',
      openai: {
        apiKey: 'override-key',
        model: 'gpt-4o',
      },
    });

    expect(client.getProvider()).toBe('openai');
  });
});
