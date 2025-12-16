import {
  BaseLLMProvider,
  OpenAIProvider,
  AnthropicProvider,
  GoogleProvider,
  BedrockProvider,
  PerplexityProvider,
  OpenRouterProvider,
} from './providers';
import { RateLimiter, defaultRateLimiter } from './utils';
import {
  CompletionOptions,
  CompletionResponse,
  CompletionRequestSchema,
  LLMProvider,
  ProviderConfig,
  StreamChunk,
} from './types';

/**
 * Configuration for the LLM client
 */
export interface LLMClientConfig {
  provider: LLMProvider;
  openai?: ProviderConfig;
  anthropic?: ProviderConfig;
  google?: ProviderConfig;
  bedrock?: ProviderConfig & {
    region?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
  };
  perplexity?: ProviderConfig;
  openrouter?: ProviderConfig & {
    siteUrl?: string;
    siteName?: string;
  };
  rateLimiter?: RateLimiter;
}

/**
 * Main LLM client with provider abstraction and rate limiting
 * 
 * Usage:
 * ```typescript
 * const client = createLLMClient();
 * const response = await client.complete({
 *   messages: [{ role: 'user', content: 'Hello!' }],
 * });
 * ```
 */
export class LLMClient {
  private provider: BaseLLMProvider;
  private rateLimiter: RateLimiter;
  private providerName: LLMProvider;

  constructor(config: LLMClientConfig) {
    this.providerName = config.provider;
    this.rateLimiter = config.rateLimiter || defaultRateLimiter;
    this.provider = this.createProvider(config);
  }

  private createProvider(config: LLMClientConfig): BaseLLMProvider {
    switch (config.provider) {
      case 'openai':
        if (!config.openai) {
          throw new Error('OpenAI configuration required');
        }
        return new OpenAIProvider(config.openai);

      case 'anthropic':
        if (!config.anthropic) {
          throw new Error('Anthropic configuration required');
        }
        return new AnthropicProvider(config.anthropic);

      case 'google':
        if (!config.google) {
          throw new Error('Google configuration required');
        }
        return new GoogleProvider(config.google);

      case 'bedrock':
        if (!config.bedrock) {
          throw new Error('Bedrock configuration required');
        }
        return new BedrockProvider(config.bedrock, {
          region: config.bedrock.region,
          accessKeyId: config.bedrock.accessKeyId,
          secretAccessKey: config.bedrock.secretAccessKey,
        });

      case 'perplexity':
        if (!config.perplexity) {
          throw new Error('Perplexity configuration required');
        }
        return new PerplexityProvider(config.perplexity);

      case 'openrouter':
        if (!config.openrouter) {
          throw new Error('OpenRouter configuration required');
        }
        return new OpenRouterProvider(config.openrouter, {
          siteUrl: config.openrouter.siteUrl,
          siteName: config.openrouter.siteName,
        });

      default:
        throw new Error(`Unknown provider: ${config.provider}`);
    }
  }

  /**
   * Generate a completion with rate limiting and validation
   */
  async complete(options: CompletionOptions): Promise<CompletionResponse> {
    // Validate input
    const validated = CompletionRequestSchema.parse(options);

    // Check rate limit
    const userId = options.userId || 'anonymous';
    const estimatedTokens = this.estimateInputTokens(options.messages);
    const rateLimitCheck = this.rateLimiter.check(userId, estimatedTokens);

    if (!rateLimitCheck.allowed) {
      throw new Error(
        `Rate limit exceeded: ${rateLimitCheck.reason}. Reset in ${Math.ceil(rateLimitCheck.resetIn / 1000)}s`
      );
    }

    // Make the request
    const response = await this.provider.complete(validated);

    // Record usage
    this.rateLimiter.record(userId, response.usage.totalTokens);

    return response;
  }

  /**
   * Generate a streaming completion with rate limiting
   */
  async *stream(
    options: CompletionOptions
  ): AsyncGenerator<StreamChunk, void, unknown> {
    // Validate input
    const validated = CompletionRequestSchema.parse(options);

    // Check rate limit
    const userId = options.userId || 'anonymous';
    const estimatedTokens = this.estimateInputTokens(options.messages);
    const rateLimitCheck = this.rateLimiter.check(userId, estimatedTokens);

    if (!rateLimitCheck.allowed) {
      throw new Error(
        `Rate limit exceeded: ${rateLimitCheck.reason}. Reset in ${Math.ceil(rateLimitCheck.resetIn / 1000)}s`
      );
    }

    // Record request (we'll estimate output tokens)
    this.rateLimiter.record(userId, estimatedTokens);

    // Stream the response
    yield* this.provider.stream(validated);
  }

  /**
   * Get the current provider name
   */
  getProvider(): LLMProvider {
    return this.providerName;
  }

  /**
   * Get the current model
   */
  getModel(): string {
    return this.provider.getModel();
  }

  private estimateInputTokens(messages: { content: string }[]): number {
    return messages.reduce(
      (sum, m) => sum + this.provider.estimateTokens(m.content),
      0
    );
  }
}

/**
 * Create an LLM client from environment variables
 * 
 * Default models are set to cost-effective options for development.
 * Change via environment variables for production.
 */
export function createLLMClient(overrides?: Partial<LLMClientConfig>): LLMClient {
  const provider = (overrides?.provider ||
    process.env.LLM_PROVIDER ||
    'openai') as LLMProvider;

  const config: LLMClientConfig = {
    provider,
    // OpenAI - default to gpt-4o-mini for cost efficiency
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    },
    // Anthropic - default to claude-3-5-haiku for cost efficiency
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY || '',
      model: process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022',
    },
    // Google - default to gemini-2.0-flash for cost efficiency
    google: {
      apiKey: process.env.GOOGLE_API_KEY || '',
      model: process.env.GOOGLE_MODEL || 'gemini-2.0-flash',
    },
    // AWS Bedrock
    bedrock: {
      apiKey: '', // Not used for Bedrock
      model: process.env.BEDROCK_MODEL || 'anthropic.claude-3-5-sonnet-v2',
      region: process.env.AWS_REGION,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    // Perplexity - default to small model for cost efficiency
    perplexity: {
      apiKey: process.env.PERPLEXITY_API_KEY || '',
      model: process.env.PERPLEXITY_MODEL || 'llama-3.1-sonar-small-128k-online',
    },
    // OpenRouter - default to gpt-4o-mini via OpenRouter
    openrouter: {
      apiKey: process.env.OPENROUTER_API_KEY || '',
      model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
      siteUrl: process.env.OPENROUTER_SITE_URL,
      siteName: process.env.OPENROUTER_SITE_NAME,
    },
    ...overrides,
  };

  return new LLMClient(config);
}
