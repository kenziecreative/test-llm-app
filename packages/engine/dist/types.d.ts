import { z } from 'zod';
/**
 * Supported LLM providers
 */
export type LLMProvider = 'openai' | 'anthropic' | 'google' | 'bedrock' | 'perplexity' | 'openrouter';
/**
 * Message role in a conversation
 */
export type MessageRole = 'system' | 'user' | 'assistant';
/**
 * A single message in a conversation
 */
export interface Message {
    role: MessageRole;
    content: string;
}
/**
 * Options for LLM completion requests
 */
export interface CompletionOptions {
    messages: Message[];
    model?: string;
    maxTokens?: number;
    temperature?: number;
    stream?: boolean;
    userId?: string;
}
/**
 * Response from an LLM completion
 */
export interface CompletionResponse {
    content: string;
    model: string;
    provider: LLMProvider;
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    finishReason: string;
}
/**
 * Streaming chunk from an LLM
 */
export interface StreamChunk {
    content: string;
    done: boolean;
}
/**
 * Provider configuration
 */
export interface ProviderConfig {
    apiKey: string;
    model: string;
    maxTokens?: number;
    baseUrl?: string;
}
/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
    maxTokensPerRequest: number;
}
/**
 * Zod schemas for validation
 */
export declare const MessageSchema: z.ZodObject<{
    role: z.ZodEnum<["system", "user", "assistant"]>;
    content: z.ZodString;
}, "strip", z.ZodTypeAny, {
    role: "system" | "user" | "assistant";
    content: string;
}, {
    role: "system" | "user" | "assistant";
    content: string;
}>;
export declare const CompletionRequestSchema: z.ZodObject<{
    messages: z.ZodArray<z.ZodObject<{
        role: z.ZodEnum<["system", "user", "assistant"]>;
        content: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        role: "system" | "user" | "assistant";
        content: string;
    }, {
        role: "system" | "user" | "assistant";
        content: string;
    }>, "many">;
    model: z.ZodOptional<z.ZodString>;
    maxTokens: z.ZodOptional<z.ZodNumber>;
    temperature: z.ZodOptional<z.ZodNumber>;
    stream: z.ZodOptional<z.ZodBoolean>;
    userId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    messages: {
        role: "system" | "user" | "assistant";
        content: string;
    }[];
    model?: string | undefined;
    maxTokens?: number | undefined;
    temperature?: number | undefined;
    stream?: boolean | undefined;
    userId?: string | undefined;
}, {
    messages: {
        role: "system" | "user" | "assistant";
        content: string;
    }[];
    model?: string | undefined;
    maxTokens?: number | undefined;
    temperature?: number | undefined;
    stream?: boolean | undefined;
    userId?: string | undefined;
}>;
export type CompletionRequest = z.infer<typeof CompletionRequestSchema>;
