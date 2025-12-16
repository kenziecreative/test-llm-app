import Anthropic from '@anthropic-ai/sdk';
import { BaseLLMProvider } from './base';
import {
  CompletionOptions,
  CompletionResponse,
  LLMProvider,
  ProviderConfig,
  StreamChunk,
} from '../types';

/**
 * Anthropic provider implementation
 * Supports: claude-opus-4.5, claude-sonnet-4, claude-3-5-sonnet, claude-3-5-haiku
 */
export class AnthropicProvider extends BaseLLMProvider {
  readonly provider: LLMProvider = 'anthropic';
  private client: Anthropic;

  constructor(config: ProviderConfig) {
    super(config);
    this.client = new Anthropic({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    });
  }

  async complete(options: CompletionOptions): Promise<CompletionResponse> {
    // Extract system message if present
    const systemMessage = options.messages.find((m) => m.role === 'system');
    const nonSystemMessages = options.messages.filter((m) => m.role !== 'system');

    const response = await this.client.messages.create({
      model: options.model || this.config.model,
      max_tokens: options.maxTokens || this.config.maxTokens || 4096,
      system: systemMessage?.content,
      messages: nonSystemMessages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    const textContent = response.content.find((c) => c.type === 'text');

    return {
      content: textContent?.type === 'text' ? textContent.text : '',
      model: response.model,
      provider: this.provider,
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
      finishReason: response.stop_reason || 'unknown',
    };
  }

  async *stream(
    options: CompletionOptions
  ): AsyncGenerator<StreamChunk, void, unknown> {
    const systemMessage = options.messages.find((m) => m.role === 'system');
    const nonSystemMessages = options.messages.filter((m) => m.role !== 'system');

    const stream = this.client.messages.stream({
      model: options.model || this.config.model,
      max_tokens: options.maxTokens || this.config.maxTokens || 4096,
      system: systemMessage?.content,
      messages: nonSystemMessages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        yield { content: event.delta.text, done: false };
      } else if (event.type === 'message_stop') {
        yield { content: '', done: true };
      }
    }
  }
}
