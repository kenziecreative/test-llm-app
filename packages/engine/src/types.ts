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
  userId?: string; // For rate limiting and logging
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
  baseUrl?: string; // For custom endpoints
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
export const MessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string().min(1).max(100000),
});

export const CompletionRequestSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(100),
  model: z.string().optional(),
  maxTokens: z.number().int().min(1).max(128000).optional(),
  temperature: z.number().min(0).max(2).optional(),
  stream: z.boolean().optional(),
  userId: z.string().optional(),
});

export type CompletionRequest = z.infer<typeof CompletionRequestSchema>;
