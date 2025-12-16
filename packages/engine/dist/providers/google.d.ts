import { BaseLLMProvider } from './base';
import { CompletionOptions, CompletionResponse, LLMProvider, ProviderConfig, StreamChunk } from '../types';
/**
 * Google Gemini provider implementation
 * Supports: gemini-3-pro, gemini-2.0-flash, gemini-1.5-pro
 */
export declare class GoogleProvider extends BaseLLMProvider {
    readonly provider: LLMProvider;
    private client;
    private model;
    constructor(config: ProviderConfig);
    complete(options: CompletionOptions): Promise<CompletionResponse>;
    stream(options: CompletionOptions): AsyncGenerator<StreamChunk, void, unknown>;
}
