import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { BaseLLMProvider } from './base';
import {
  CompletionOptions,
  CompletionResponse,
  LLMProvider,
  ProviderConfig,
  StreamChunk,
} from '../types';

/**
 * Google Gemini provider implementation
 * Supports: gemini-3-pro, gemini-2.0-flash, gemini-1.5-pro
 */
export class GoogleProvider extends BaseLLMProvider {
  readonly provider: LLMProvider = 'google';
  private client: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor(config: ProviderConfig) {
    super(config);
    this.client = new GoogleGenerativeAI(config.apiKey);
    this.model = this.client.getGenerativeModel({ model: config.model });
  }

  async complete(options: CompletionOptions): Promise<CompletionResponse> {
    // Extract system instruction if present
    const systemMessage = options.messages.find((m) => m.role === 'system');
    const nonSystemMessages = options.messages.filter((m) => m.role !== 'system');

    // Get model with system instruction if provided
    const model = systemMessage
      ? this.client.getGenerativeModel({
          model: options.model || this.config.model,
          systemInstruction: systemMessage.content,
        })
      : this.model;

    // Convert messages to Gemini format
    const history = nonSystemMessages.slice(0, -1).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const lastMessage = nonSystemMessages[nonSystemMessages.length - 1];

    const chat = model.startChat({
      history: history as any,
      generationConfig: {
        maxOutputTokens: options.maxTokens || this.config.maxTokens || 4096,
        temperature: options.temperature ?? 0.7,
      },
    });

    const result = await chat.sendMessage(lastMessage.content);
    const response = result.response;

    return {
      content: response.text(),
      model: options.model || this.config.model,
      provider: this.provider,
      usage: {
        promptTokens: response.usageMetadata?.promptTokenCount || 0,
        completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: response.usageMetadata?.totalTokenCount || 0,
      },
      finishReason: response.candidates?.[0]?.finishReason || 'unknown',
    };
  }

  async *stream(
    options: CompletionOptions
  ): AsyncGenerator<StreamChunk, void, unknown> {
    const systemMessage = options.messages.find((m) => m.role === 'system');
    const nonSystemMessages = options.messages.filter((m) => m.role !== 'system');

    const model = systemMessage
      ? this.client.getGenerativeModel({
          model: options.model || this.config.model,
          systemInstruction: systemMessage.content,
        })
      : this.model;

    const history = nonSystemMessages.slice(0, -1).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const lastMessage = nonSystemMessages[nonSystemMessages.length - 1];

    const chat = model.startChat({
      history: history as any,
      generationConfig: {
        maxOutputTokens: options.maxTokens || this.config.maxTokens || 4096,
        temperature: options.temperature ?? 0.7,
      },
    });

    const result = await chat.sendMessageStream(lastMessage.content);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      yield { content: text, done: false };
    }

    yield { content: '', done: true };
  }
}
