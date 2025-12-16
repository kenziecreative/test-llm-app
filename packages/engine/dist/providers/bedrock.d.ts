import { BaseLLMProvider } from './base';
import { CompletionOptions, CompletionResponse, LLMProvider, ProviderConfig, StreamChunk } from '../types';
/**
 * AWS Bedrock provider implementation
 * Supports: anthropic.claude-3-5-sonnet-v2, amazon.titan-text-premier-v1:0
 */
export declare class BedrockProvider extends BaseLLMProvider {
    readonly provider: LLMProvider;
    private client;
    constructor(config: ProviderConfig, awsConfig?: {
        region?: string;
        accessKeyId?: string;
        secretAccessKey?: string;
    });
    complete(options: CompletionOptions): Promise<CompletionResponse>;
    stream(options: CompletionOptions): AsyncGenerator<StreamChunk, void, unknown>;
}
