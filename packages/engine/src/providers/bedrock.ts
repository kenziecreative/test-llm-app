import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelWithResponseStreamCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { BaseLLMProvider } from './base';
import {
  CompletionOptions,
  CompletionResponse,
  LLMProvider,
  ProviderConfig,
  StreamChunk,
} from '../types';

/**
 * AWS Bedrock provider implementation
 * Supports: anthropic.claude-3-5-sonnet-v2, amazon.titan-text-premier-v1:0
 */
export class BedrockProvider extends BaseLLMProvider {
  readonly provider: LLMProvider = 'bedrock';
  private client: BedrockRuntimeClient;

  constructor(
    config: ProviderConfig,
    awsConfig?: { region?: string; accessKeyId?: string; secretAccessKey?: string }
  ) {
    super(config);
    this.client = new BedrockRuntimeClient({
      region: awsConfig?.region || process.env.AWS_REGION || 'us-east-1',
      credentials: awsConfig?.accessKeyId
        ? {
            accessKeyId: awsConfig.accessKeyId,
            secretAccessKey: awsConfig.secretAccessKey || '',
          }
        : undefined,
    });
  }

  async complete(options: CompletionOptions): Promise<CompletionResponse> {
    const model = options.model || this.config.model;
    const isAnthropic = model.startsWith('anthropic.');

    let body: string;

    if (isAnthropic) {
      // Anthropic Claude format for Bedrock
      const systemMessage = options.messages.find((m) => m.role === 'system');
      const nonSystemMessages = options.messages.filter((m) => m.role !== 'system');

      body = JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: options.maxTokens || this.config.maxTokens || 4096,
        system: systemMessage?.content,
        messages: nonSystemMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });
    } else {
      // Amazon Titan format
      const prompt = options.messages.map((m) => `${m.role}: ${m.content}`).join('\n');
      body = JSON.stringify({
        inputText: prompt,
        textGenerationConfig: {
          maxTokenCount: options.maxTokens || this.config.maxTokens || 4096,
          temperature: options.temperature ?? 0.7,
        },
      });
    }

    const command = new InvokeModelCommand({
      modelId: model,
      body: Buffer.from(body),
      contentType: 'application/json',
      accept: 'application/json',
    });

    const response = await this.client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    if (isAnthropic) {
      return {
        content: responseBody.content?.[0]?.text || '',
        model,
        provider: this.provider,
        usage: {
          promptTokens: responseBody.usage?.input_tokens || 0,
          completionTokens: responseBody.usage?.output_tokens || 0,
          totalTokens:
            (responseBody.usage?.input_tokens || 0) +
            (responseBody.usage?.output_tokens || 0),
        },
        finishReason: responseBody.stop_reason || 'unknown',
      };
    } else {
      // Titan response format
      return {
        content: responseBody.results?.[0]?.outputText || '',
        model,
        provider: this.provider,
        usage: {
          promptTokens: responseBody.inputTextTokenCount || 0,
          completionTokens: responseBody.results?.[0]?.tokenCount || 0,
          totalTokens:
            (responseBody.inputTextTokenCount || 0) +
            (responseBody.results?.[0]?.tokenCount || 0),
        },
        finishReason: responseBody.results?.[0]?.completionReason || 'unknown',
      };
    }
  }

  async *stream(
    options: CompletionOptions
  ): AsyncGenerator<StreamChunk, void, unknown> {
    const model = options.model || this.config.model;
    const isAnthropic = model.startsWith('anthropic.');

    let body: string;

    if (isAnthropic) {
      const systemMessage = options.messages.find((m) => m.role === 'system');
      const nonSystemMessages = options.messages.filter((m) => m.role !== 'system');

      body = JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: options.maxTokens || this.config.maxTokens || 4096,
        system: systemMessage?.content,
        messages: nonSystemMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });
    } else {
      const prompt = options.messages.map((m) => `${m.role}: ${m.content}`).join('\n');
      body = JSON.stringify({
        inputText: prompt,
        textGenerationConfig: {
          maxTokenCount: options.maxTokens || this.config.maxTokens || 4096,
          temperature: options.temperature ?? 0.7,
        },
      });
    }

    const command = new InvokeModelWithResponseStreamCommand({
      modelId: model,
      body: Buffer.from(body),
      contentType: 'application/json',
      accept: 'application/json',
    });

    const response = await this.client.send(command);

    if (response.body) {
      for await (const event of response.body) {
        if (event.chunk?.bytes) {
          const chunk = JSON.parse(new TextDecoder().decode(event.chunk.bytes));

          if (isAnthropic && chunk.type === 'content_block_delta') {
            yield { content: chunk.delta?.text || '', done: false };
          } else if (!isAnthropic && chunk.outputText) {
            yield { content: chunk.outputText, done: false };
          }
        }
      }
    }

    yield { content: '', done: true };
  }
}
