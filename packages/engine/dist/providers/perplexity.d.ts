import { BaseLLMProvider } from './base';
import { CompletionOptions, CompletionResponse, LLMProvider, ProviderConfig, StreamChunk } from '../types';
/**
 * Perplexity provider implementation
 * Uses OpenAI-compatible API
 *
 * Models:
 * - llama-3.1-sonar-small-128k-online (fast, cheap, web search)
 * - llama-3.1-sonar-large-128k-online (balanced, web search)
 * - llama-3.1-sonar-huge-128k-online (most capable, web search)
 */
export declare class PerplexityProvider extends BaseLLMProvider {
    readonly provider: LLMProvider;
    private client;
    constructor(config: ProviderConfig);
    complete(options: CompletionOptions): Promise<CompletionResponse>;
    stream(options: CompletionOptions): AsyncGenerator<StreamChunk, void, unknown>;
}
