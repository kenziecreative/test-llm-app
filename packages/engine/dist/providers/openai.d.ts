import { BaseLLMProvider } from './base';
import { CompletionOptions, CompletionResponse, LLMProvider, ProviderConfig, StreamChunk } from '../types';
/**
 * OpenAI provider implementation
 * Supports: gpt-5.2, gpt-4o, gpt-4-turbo, o1-preview, o1-mini
 */
export declare class OpenAIProvider extends BaseLLMProvider {
    readonly provider: LLMProvider;
    private client;
    constructor(config: ProviderConfig);
    complete(options: CompletionOptions): Promise<CompletionResponse>;
    stream(options: CompletionOptions): AsyncGenerator<StreamChunk, void, unknown>;
}
