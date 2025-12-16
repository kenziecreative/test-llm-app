import { BaseLLMProvider } from './base';
import { CompletionOptions, CompletionResponse, LLMProvider, ProviderConfig, StreamChunk } from '../types';
/**
 * Anthropic provider implementation
 * Supports: claude-opus-4.5, claude-sonnet-4, claude-3-5-sonnet, claude-3-5-haiku
 */
export declare class AnthropicProvider extends BaseLLMProvider {
    readonly provider: LLMProvider;
    private client;
    constructor(config: ProviderConfig);
    complete(options: CompletionOptions): Promise<CompletionResponse>;
    stream(options: CompletionOptions): AsyncGenerator<StreamChunk, void, unknown>;
}
