import OpenAI from 'openai';
import { BaseLLMProvider } from './base';
import {
  CompletionOptions,
  CompletionResponse,
  LLMProvider,
  ProviderConfig,
  StreamChunk,
} from '../types';

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
export class OpenRouterProvider extends BaseLLMProvider {
  readonly provider: LLMProvider = 'openrouter' as LLMProvider;
  private client: OpenAI;
  private siteUrl?: string;
  private siteName?: string;

  constructor(
    config: ProviderConfig,
    options?: { siteUrl?: string; siteName?: string }
  ) {
    super(config);
    this.siteUrl = options?.siteUrl;
    this.siteName = options?.siteName;
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl || 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': this.siteUrl || '',
        'X-Title': this.siteName || '',
      },
    });
  }

  async complete(options: CompletionOptions): Promise<CompletionResponse> {
    const response = await this.client.chat.completions.create({
      model: options.model || this.config.model,
      messages: options.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      max_tokens: options.maxTokens || this.config.maxTokens || 4096,
      temperature: options.temperature ?? 0.7,
    });

    const choice = response.choices[0];

    return {
      content: choice.message.content || '',
      model: response.model,
      provider: this.provider,
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
      finishReason: choice.finish_reason || 'unknown',
    };
  }

  async *stream(
    options: CompletionOptions
  ): AsyncGenerator<StreamChunk, void, unknown> {
    const stream = await this.client.chat.completions.create({
      model: options.model || this.config.model,
      messages: options.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      max_tokens: options.maxTokens || this.config.maxTokens || 4096,
      temperature: options.temperature ?? 0.7,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      const done = chunk.choices[0]?.finish_reason !== null;

      yield { content, done };
    }
  }
}
