import { CompletionOptions, CompletionResponse, LLMProvider, ProviderConfig, StreamChunk } from '../types';
/**
 * Base interface for all LLM providers
 * Implement this interface to add support for new providers
 */
export declare abstract class BaseLLMProvider {
    protected config: ProviderConfig;
    abstract readonly provider: LLMProvider;
    constructor(config: ProviderConfig);
    /**
     * Generate a completion from the LLM
     */
    abstract complete(options: CompletionOptions): Promise<CompletionResponse>;
    /**
     * Generate a streaming completion from the LLM
     * Returns an async generator that yields chunks
     */
    abstract stream(options: CompletionOptions): AsyncGenerator<StreamChunk, void, unknown>;
    /**
     * Estimate token count for a string (rough approximation)
     * Override in provider implementations for more accurate counts
     */
    estimateTokens(text: string): number;
    /**
     * Get the model being used
     */
    getModel(): string;
}
