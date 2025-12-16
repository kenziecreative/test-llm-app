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
 * OpenAI provider implementation
 * Supports: gpt-5.2, gpt-4o, gpt-4-turbo, o1-preview, o1-mini
 */
export class OpenAIProvider extends BaseLLMProvider {
  readonly provider: LLMProvider = 'openai';
  private client: OpenAI;

  constructor(config: ProviderConfig) {
    super(config);
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
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
