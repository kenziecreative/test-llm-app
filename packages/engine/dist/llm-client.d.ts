import { RateLimiter } from './utils';
import { CompletionOptions, CompletionResponse, LLMProvider, ProviderConfig, StreamChunk } from './types';
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
export declare class LLMClient {
    private provider;
    private rateLimiter;
    private providerName;
    constructor(config: LLMClientConfig);
    private createProvider;
    /**
     * Generate a completion with rate limiting and validation
     */
    complete(options: CompletionOptions): Promise<CompletionResponse>;
    /**
     * Generate a streaming completion with rate limiting
     */
    stream(options: CompletionOptions): AsyncGenerator<StreamChunk, void, unknown>;
    /**
     * Get the current provider name
     */
    getProvider(): LLMProvider;
    /**
     * Get the current model
     */
    getModel(): string;
    private estimateInputTokens;
}
/**
 * Create an LLM client from environment variables
 *
 * Default models are set to cost-effective options for development.
 * Change via environment variables for production.
 */
export declare function createLLMClient(overrides?: Partial<LLMClientConfig>): LLMClient;
