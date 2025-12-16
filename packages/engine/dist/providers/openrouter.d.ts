import { BaseLLMProvider } from './base';
import { CompletionOptions, CompletionResponse, LLMProvider, ProviderConfig, StreamChunk } from '../types';
/**
 * OpenRouter provider implementation
 * Provides unified access to many models via OpenAI-compatible API
 *
 * Popular models (use full model ID):
 * - openai/gpt-4o-mini (cheap)
 * - openai/gpt-4o (balanced)
 * - anthropic/claude-3.5-sonnet (balanced)
 * - google/gemini-2.0-flash-exp (fast)
 * - meta-llama/llama-3.1-70b-instruct (open source)
 * - mistralai/mistral-large (European)
 *
 * See https://openrouter.ai/models for full list
 */
export declare class OpenRouterProvider extends BaseLLMProvider {
    readonly provider: LLMProvider;
    private client;
    private siteUrl?;
    private siteName?;
    constructor(config: ProviderConfig, options?: {
        siteUrl?: string;
        siteName?: string;
    });
    complete(options: CompletionOptions): Promise<CompletionResponse>;
    stream(options: CompletionOptions): AsyncGenerator<StreamChunk, void, unknown>;
}
