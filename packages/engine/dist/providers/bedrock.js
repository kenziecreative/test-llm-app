"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BedrockProvider = void 0;
const client_bedrock_runtime_1 = require("@aws-sdk/client-bedrock-runtime");
const base_1 = require("./base");
/**
 * AWS Bedrock provider implementation
 * Supports: anthropic.claude-3-5-sonnet-v2, amazon.titan-text-premier-v1:0
 */
class BedrockProvider extends base_1.BaseLLMProvider {
    provider = 'bedrock';
    client;
    constructor(config, awsConfig) {
        super(config);
        this.client = new client_bedrock_runtime_1.BedrockRuntimeClient({
            region: awsConfig?.region || process.env.AWS_REGION || 'us-east-1',
            credentials: awsConfig?.accessKeyId
                ? {
                    accessKeyId: awsConfig.accessKeyId,
                    secretAccessKey: awsConfig.secretAccessKey || '',
                }
                : undefined,
        });
    }
    async complete(options) {
        const model = options.model || this.config.model;
        const isAnthropic = model.startsWith('anthropic.');
        let body;
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
        }
        else {
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
        const command = new client_bedrock_runtime_1.InvokeModelCommand({
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
                    totalTokens: (responseBody.usage?.input_tokens || 0) +
                        (responseBody.usage?.output_tokens || 0),
                },
                finishReason: responseBody.stop_reason || 'unknown',
            };
        }
        else {
            // Titan response format
            return {
                content: responseBody.results?.[0]?.outputText || '',
                model,
                provider: this.provider,
                usage: {
                    promptTokens: responseBody.inputTextTokenCount || 0,
                    completionTokens: responseBody.results?.[0]?.tokenCount || 0,
                    totalTokens: (responseBody.inputTextTokenCount || 0) +
                        (responseBody.results?.[0]?.tokenCount || 0),
                },
                finishReason: responseBody.results?.[0]?.completionReason || 'unknown',
            };
        }
    }
    async *stream(options) {
        const model = options.model || this.config.model;
        const isAnthropic = model.startsWith('anthropic.');
        let body;
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
        }
        else {
            const prompt = options.messages.map((m) => `${m.role}: ${m.content}`).join('\n');
            body = JSON.stringify({
                inputText: prompt,
                textGenerationConfig: {
                    maxTokenCount: options.maxTokens || this.config.maxTokens || 4096,
                    temperature: options.temperature ?? 0.7,
                },
            });
        }
        const command = new client_bedrock_runtime_1.InvokeModelWithResponseStreamCommand({
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
                    }
                    else if (!isAnthropic && chunk.outputText) {
                        yield { content: chunk.outputText, done: false };
                    }
                }
            }
        }
        yield { content: '', done: true };
    }
}
exports.BedrockProvider = BedrockProvider;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmVkcm9jay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9wcm92aWRlcnMvYmVkcm9jay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw0RUFJeUM7QUFDekMsaUNBQXlDO0FBU3pDOzs7R0FHRztBQUNILE1BQWEsZUFBZ0IsU0FBUSxzQkFBZTtJQUN6QyxRQUFRLEdBQWdCLFNBQVMsQ0FBQztJQUNuQyxNQUFNLENBQXVCO0lBRXJDLFlBQ0UsTUFBc0IsRUFDdEIsU0FBK0U7UUFFL0UsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ2QsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLDZDQUFvQixDQUFDO1lBQ3JDLE1BQU0sRUFBRSxTQUFTLEVBQUUsTUFBTSxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxJQUFJLFdBQVc7WUFDbEUsV0FBVyxFQUFFLFNBQVMsRUFBRSxXQUFXO2dCQUNqQyxDQUFDLENBQUM7b0JBQ0UsV0FBVyxFQUFFLFNBQVMsQ0FBQyxXQUFXO29CQUNsQyxlQUFlLEVBQUUsU0FBUyxDQUFDLGVBQWUsSUFBSSxFQUFFO2lCQUNqRDtnQkFDSCxDQUFDLENBQUMsU0FBUztTQUNkLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRCxLQUFLLENBQUMsUUFBUSxDQUFDLE9BQTBCO1FBQ3ZDLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7UUFDakQsTUFBTSxXQUFXLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUVuRCxJQUFJLElBQVksQ0FBQztRQUVqQixJQUFJLFdBQVcsRUFBRSxDQUFDO1lBQ2hCLHNDQUFzQztZQUN0QyxNQUFNLGFBQWEsR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxRQUFRLENBQUMs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QztZQUNsQixJQUFJLEtBQUssRUFBRSxNQUFNLEtBQUssSUFBSSxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ3hDLElBQUksS0FBSyxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsQ0FBQztvQkFDdkIsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLFdBQVcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7b0JBRXRFLElBQUksV0FBVyxJQUFJLEtBQUssQ0FBQyxJQUFJLEtBQUsscUJBQXFCLEVBQUUsQ0FBQzt3QkFDeEQsTUFBTSxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUMsS0FBSyxFQUFFLElBQUksSUFBSSxFQUFFLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxDQUFDO29CQUMxRCxDQUFDO3lCQUFNLElBQUksQ0FBQyxXQUFXLElBQUksS0FBSyxDQUFDLFVBQVUsRUFBRSxDQUFDO3dCQUM1QyxNQUFNLEVBQUUsT0FBTyxFQUFFLEtBQUssQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxDQUFDO29CQUNuRCxDQUFDO2dCQUNILENBQUM7WUFDSCxDQUFDO1FBQ0gsQ0FBQztRQUVELE1BQU0sRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQztJQUNwQyxDQUFDO0NBQ0Y7QUF2SkQsMENBdUpDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgQmVkcm9ja1J1bnRpbWVDbGllbnQsXG4gIEludm9rZU1vZGVsQ29tbWFuZCxcbiAgSW52b2tlTW9kZWxXaXRoUmVzcG9uc2VTdHJlYW1Db21tYW5kLFxufSBmcm9tICdAYXdzLXNkay9jbGllbnQtYmVkcm9jay1ydW50aW1lJztcbmltcG9ydCB7IEJhc2VMTE1Qcm92aWRlciB9IGZyb20gJy4vYmFzZSc7XG5pbXBvcnQge1xuICBDb21wbGV0aW9uT3B0aW9ucyxcbiAgQ29tcGxldGlvblJlc3BvbnNlLFxuICBMTE1Qcm92aWRlcixcbiAgUHJvdmlkZXJDb25maWcsXG4gIFN0cmVhbUNodW5rLFxufSBmcm9tICcuLi90eXBlcyc7XG5cbi8qKlxuICogQVdTIEJlZHJvY2sgcHJvdmlkZXIgaW1wbGVtZW50YXRpb25cbiAqIFN1cHBvcnRzOiBhbnRocm9waWMuY2xhdWRlLTMtNS1zb25uZXQtdjIsIGFtYXpvbi50aXRhbi10ZXh0LXByZW1pZXItdjE6MFxuICovXG5leHBvcnQgY2xhc3MgQmVkcm9ja1Byb3ZpZGVyIGV4dGVuZHMgQmFzZUxMTVByb3ZpZGVyIHtcbiAgcmVhZG9ubHkgcHJvdmlkZXI6IExMTVByb3ZpZGVyID0gJ2JlZHJvY2snO1xuICBwcml2YXRlIGNsaWVudDogQmVkcm9ja1J1bnRpbWVDbGllbnQ7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgY29uZmlnOiBQcm92aWRlckNvbmZpZyxcbiAgICBhd3NDb25maWc/OiB7IHJlZ2lvbj86IHN0cmluZzsgYWNjZXNzS2V5SWQ/OiBzdHJpbmc7IHNlY3JldEFjY2Vzc0tleT86IHN0cmluZyB9XG4gICkge1xuICAgIHN1cGVyKGNvbmZpZyk7XG4gICAgdGhpcy5jbGllbnQgPSBuZXcgQmVkcm9ja1J1bnRpbWVDbGllbnQoe1xuICAgICAgcmVnaW9uOiBhd3NDb25maWc/LnJlZ2lvbiB8fCBwcm9jZXNzLmVudi5BV1NfUkVHSU9OIHx8ICd1cy1lYXN0LTEnLFxuICAgICAgY3JlZGVudGlhbHM6IGF3c0NvbmZpZz8uYWNjZXNzS2V5SWRcbiAgICAgICAgPyB7XG4gICAgICAgICAgICBhY2Nlc3NLZXlJZDogYXdzQ29uZmlnLmFjY2Vzc0tleUlkLFxuICAgICAgICAgICAgc2VjcmV0QWNjZXNzS2V5OiBhd3NDb25maWcuc2VjcmV0QWNjZXNzS2V5IHx8ICcnLFxuICAgICAgICAgIH1cbiAgICAgICAgOiB1bmRlZmluZWQsXG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBjb21wbGV0ZShvcHRpb25zOiBDb21wbGV0aW9uT3B0aW9ucyk6IFByb21pc2U8Q29tcGxldGlvblJlc3BvbnNlPiB7XG4gICAgY29uc3QgbW9kZWwgPSBvcHRpb25zLm1vZGVsIHx8IHRoaXMuY29uZmlnLm1vZGVsO1xuICAgIGNvbnN0IGlzQW50aHJvcGljID0gbW9kZWwuc3RhcnRzV2l0aCgnYW50aHJvcGljLicpO1xuXG4gICAgbGV0IGJvZHk6IHN0cmluZztcblxuICAgIGlmIChpc0FudGhyb3BpYykge1xuICAgICAgLy8gQW50aHJvcGljIENsYXVkZSBmb3JtYXQgZm9yIEJlZHJvY2tcbiAgICAgIGNvbnN0IHN5c3RlbU1lc3NhZ2UgPSBvcHRpb25zLm1lc3NhZ2VzLmZpbmQoKG0pID0+IG0ucm9sZSA9PT0gJ3N5c3RlbScpO1xuICAgICAgY29uc3Qgbm9uU3lzdGVtTWVzc2FnZXMgPSBvcHRpb25zLm1lc3NhZ2VzLmZpbHRlcigobSkgPT4gbS5yb2xlICE9PSAnc3lzdGVtJyk7XG5cbiAgICAgIGJvZHkgPSBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgIGFudGhyb3BpY192ZXJzaW9uOiAnYmVkcm9jay0yMDIzLTA1LTMxJyxcbiAgICAgICAgbWF4X3Rva2Vuczogb3B0aW9ucy5tYXhUb2tlbnMgfHwgdGhpcy5jb25maWcubWF4VG9rZW5zIHx8IDQwOTYsXG4gICAgICAgIHN5c3RlbTogc3lzdGVtTWVzc2FnZT8uY29udGVudCxcbiAgICAgICAgbWVzc2FnZXM6IG5vblN5c3RlbU1lc3NhZ2VzLm1hcCgobSkgPT4gKHtcbiAgICAgICAgICByb2xlOiBtLnJvbGUsXG4gICAgICAgICAgY29udGVudDogbS5jb250ZW50LFxuICAgICAgICB9KSksXG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gQW1hem9uIFRpdGFuIGZvcm1hdFxuICAgICAgY29uc3QgcHJvbXB0ID0gb3B0aW9ucy5tZXNzYWdlcy5tYXAoKG0pID0+IGAke20ucm9sZX06ICR7bS5jb250ZW50fWApLmpvaW4oJ1xcbicpO1xuICAgICAgYm9keSA9IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgaW5wdXRUZXh0OiBwcm9tcHQsXG4gICAgICAgIHRleHRHZW5lcmF0aW9uQ29uZmlnOiB7XG4gICAgICAgICAgbWF4VG9rZW5Db3VudDogb3B0aW9ucy5tYXhUb2tlbnMgfHwgdGhpcy5jb25maWcubWF4VG9rZW5zIHx8IDQwOTYsXG4gICAgICAgICAgdGVtcGVyYXR1cmU6IG9wdGlvbnMudGVtcGVyYXR1cmUgPz8gMC43LFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgY29tbWFuZCA9IG5ldyBJbnZva2VNb2RlbENvbW1hbmQoe1xuICAgICAgbW9kZWxJZDogbW9kZWwsXG4gICAgICBib2R5OiBCdWZmZXIuZnJvbShib2R5KSxcbiAgICAgIGNvbnRlbnRUeXBlOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICBhY2NlcHQ6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICB9KTtcblxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5jbGllbnQuc2VuZChjb21tYW5kKTtcbiAgICBjb25zdCByZXNwb25zZUJvZHkgPSBKU09OLnBhcnNlKG5ldyBUZXh0RGVjb2RlcigpLmRlY29kZShyZXNwb25zZS5ib2R5KSk7XG5cbiAgICBpZiAoaXNBbnRocm9waWMpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNvbnRlbnQ6IHJlc3BvbnNlQm9keS5jb250ZW50Py5bMF0/LnRleHQgfHwgJycsXG4gICAgICAgIG1vZGVsLFxuICAgICAgICBwcm92aWRlcjogdGhpcy5wcm92aWRlcixcbiAgICAgICAgdXNhZ2U6IHtcbiAgICAgICAgICBwcm9tcHRUb2tlbnM6IHJlc3BvbnNlQm9keS51c2FnZT8uaW5wdXRfdG9rZW5zIHx8IDAsXG4gICAgICAgICAgY29tcGxldGlvblRva2VuczogcmVzcG9uc2VCb2R5LnVzYWdlPy5vdXRwdXRfdG9rZW5zIHx8IDAsXG4gICAgICAgICAgdG90YWxUb2tlbnM6XG4gICAgICAgICAgICAocmVzcG9uc2VCb2R5LnVzYWdlPy5pbnB1dF90b2tlbnMgfHwgMCkgK1xuICAgICAgICAgICAgKHJlc3BvbnNlQm9keS51c2FnZT8ub3V0cHV0X3Rva2VucyB8fCAwKSxcbiAgICAgICAgfSxcbiAgICAgICAgZmluaXNoUmVhc29uOiByZXNwb25zZUJvZHkuc3RvcF9yZWFzb24gfHwgJ3Vua25vd24nLFxuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gVGl0YW4gcmVzcG9uc2UgZm9ybWF0XG4gICAgICByZXR1cm4ge1xuICAgICAgICBjb250ZW50OiByZXNwb25zZUJvZHkucmVzdWx0cz8uWzBdPy5vdXRwdXRUZXh0IHx8ICcnLFxuICAgICAgICBtb2RlbCxcbiAgICAgICAgcHJvdmlkZXI6IHRoaXMucHJvdmlkZXIsXG4gICAgICAgIHVzYWdlOiB7XG4gICAgICAgICAgcHJvbXB0VG9rZW5zOiByZXNwb25zZUJvZHkuaW5wdXRUZXh0VG9rZW5Db3VudCB8fCAwLFxuICAgICAgICAgIGNvbXBsZXRpb25Ub2tlbnM6IHJlc3BvbnNlQm9keS5yZXN1bHRzPy5bMF0/LnRva2VuQ291bnQgfHwgMCxcbiAgICAgICAgICB0b3RhbFRva2VuczpcbiAgICAgICAgICAgIChyZXNwb25zZUJvZHkuaW5wdXRUZXh0VG9rZW5Db3VudCB8fCAwKSArXG4gICAgICAgICAgICAocmVzcG9uc2VCb2R5LnJlc3VsdHM/LlswXT8udG9rZW5Db3VudCB8fCAwKSxcbiAgICAgICAgfSxcbiAgICAgICAgZmluaXNoUmVhc29uOiByZXNwb25zZUJvZHkucmVzdWx0cz8uWzBdPy5jb21wbGV0aW9uUmVhc29uIHx8ICd1bmtub3duJyxcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgKnN0cmVhbShcbiAgICBvcHRpb25zOiBDb21wbGV0aW9uT3B0aW9uc1xuICApOiBBc3luY0dlbmVyYXRvcjxTdHJlYW1DaHVuaywgdm9pZCwgdW5rbm93bj4ge1xuICAgIGNvbnN0IG1vZGVsID0gb3B0aW9ucy5tb2RlbCB8fCB0aGlzLmNvbmZpZy5tb2RlbDtcbiAgICBjb25zdCBpc0FudGhyb3BpYyA9IG1vZGVsLnN0YXJ0c1dpdGgoJ2FudGhyb3BpYy4nKTtcblxuICAgIGxldCBib2R5OiBzdHJpbmc7XG5cbiAgICBpZiAoaXNBbnRocm9waWMpIHtcbiAgICAgIGNvbnN0IHN5c3RlbU1lc3NhZ2UgPSBvcHRpb25zLm1lc3NhZ2VzLmZpbmQoKG0pID0+IG0ucm9sZSA9PT0gJ3N5c3RlbScpO1xuICAgICAgY29uc3Qgbm9uU3lzdGVtTWVzc2FnZXMgPSBvcHRpb25zLm1lc3NhZ2VzLmZpbHRlcigobSkgPT4gbS5yb2xlICE9PSAnc3lzdGVtJyk7XG5cbiAgICAgIGJvZHkgPSBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgIGFudGhyb3BpY192ZXJzaW9uOiAnYmVkcm9jay0yMDIzLTA1LTMxJyxcbiAgICAgICAgbWF4X3Rva2Vuczogb3B0aW9ucy5tYXhUb2tlbnMgfHwgdGhpcy5jb25maWcubWF4VG9rZW5zIHx8IDQwOTYsXG4gICAgICAgIHN5c3RlbTogc3lzdGVtTWVzc2FnZT8uY29udGVudCxcbiAgICAgICAgbWVzc2FnZXM6IG5vblN5c3RlbU1lc3NhZ2VzLm1hcCgobSkgPT4gKHtcbiAgICAgICAgICByb2xlOiBtLnJvbGUsXG4gICAgICAgICAgY29udGVudDogbS5jb250ZW50LFxuICAgICAgICB9KSksXG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgcHJvbXB0ID0gb3B0aW9ucy5tZXNzYWdlcy5tYXAoKG0pID0+IGAke20ucm9sZX06ICR7bS5jb250ZW50fWApLmpvaW4oJ1xcbicpO1xuICAgICAgYm9keSA9IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgaW5wdXRUZXh0OiBwcm9tcHQsXG4gICAgICAgIHRleHRHZW5lcmF0aW9uQ29uZmlnOiB7XG4gICAgICAgICAgbWF4VG9rZW5Db3VudDogb3B0aW9ucy5tYXhUb2tlbnMgfHwgdGhpcy5jb25maWcubWF4VG9rZW5zIHx8IDQwOTYsXG4gICAgICAgICAgdGVtcGVyYXR1cmU6IG9wdGlvbnMudGVtcGVyYXR1cmUgPz8gMC43LFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgY29tbWFuZCA9IG5ldyBJbnZva2VNb2RlbFdpdGhSZXNwb25zZVN0cmVhbUNvbW1hbmQoe1xuICAgICAgbW9kZWxJZDogbW9kZWwsXG4gICAgICBib2R5OiBCdWZmZXIuZnJvbShib2R5KSxcbiAgICAgIGNvbnRlbnRUeXBlOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICBhY2NlcHQ6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICB9KTtcblxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5jbGllbnQuc2VuZChjb21tYW5kKTtcblxuICAgIGlmIChyZXNwb25zZS5ib2R5KSB7XG4gICAgICBmb3IgYXdhaXQgKGNvbnN0IGV2ZW50IG9mIHJlc3BvbnNlLmJvZHkpIHtcbiAgICAgICAgaWYgKGV2ZW50LmNodW5rPy5ieXRlcykge1xuICAgICAgICAgIGNvbnN0IGNodW5rID0gSlNPTi5wYXJzZShuZXcgVGV4dERlY29kZXIoKS5kZWNvZGUoZXZlbnQuY2h1bmsuYnl0ZXMpKTtcblxuICAgICAgICAgIGlmIChpc0FudGhyb3BpYyAmJiBjaHVuay50eXBlID09PSAnY29udGVudF9ibG9ja19kZWx0YScpIHtcbiAgICAgICAgICAgIHlpZWxkIHsgY29udGVudDogY2h1bmsuZGVsdGE/LnRleHQgfHwgJycsIGRvbmU6IGZhbHNlIH07XG4gICAgICAgICAgfSBlbHNlIGlmICghaXNBbnRocm9waWMgJiYgY2h1bmsub3V0cHV0VGV4dCkge1xuICAgICAgICAgICAgeWllbGQgeyBjb250ZW50OiBjaHVuay5vdXRwdXRUZXh0LCBkb25lOiBmYWxzZSB9O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHlpZWxkIHsgY29udGVudDogJycsIGRvbmU6IHRydWUgfTtcbiAgfVxufVxuIl19