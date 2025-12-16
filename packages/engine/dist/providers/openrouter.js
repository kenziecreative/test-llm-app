"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenRouterProvider = void 0;
const openai_1 = __importDefault(require("openai"));
const base_1 = require("./base");
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
class OpenRouterProvider extends base_1.BaseLLMProvider {
    provider = 'openrouter';
    client;
    siteUrl;
    siteName;
    constructor(config, options) {
        super(config);
        this.siteUrl = options?.siteUrl;
        this.siteName = options?.siteName;
        this.client = new openai_1.default({
            apiKey: config.apiKey,
            baseURL: config.baseUrl || 'https://openrouter.ai/api/v1',
            defaultHeaders: {
                'HTTP-Referer': this.siteUrl || '',
                'X-Title': this.siteName || '',
            },
        });
    }
    async complete(options) {
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
    async *stream(options) {
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
exports.OpenRouterProvider = OpenRouterProvider;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3BlbnJvdXRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9wcm92aWRlcnMvb3BlbnJvdXRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxvREFBNEI7QUFDNUIsaUNBQXlDO0FBU3pDOzs7Ozs7Ozs7Ozs7O0dBYUc7QUFDSCxNQUFhLGtCQUFtQixTQUFRLHNCQUFlO0lBQzVDLFFBQVEsR0FBZ0IsWUFBMkIsQ0FBQztJQUNyRCxNQUFNLENBQVM7SUFDZixPQUFPLENBQVU7SUFDakIsUUFBUSxDQUFVO0lBRTFCLFlBQ0UsTUFBc0IsRUFDdEIsT0FBaUQ7UUFFakQsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ2QsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLEVBQUUsT0FBTyxDQUFDO1FBQ2hDLElBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxFQUFFLFFBQVEsQ0FBQztRQUNsQyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksZ0JBQU0sQ0FBQztZQUN2QixNQUFNLEVBQUUsTUFBTSxDQUFDLE1BQU07WUFDckIsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLElBQUksOEJBQThCO1lBQ3pELGNBQWMsRUFBRTtnQkFDZCxjQUFjLEVBQUUsSUFBSSxDQUFDLE9BQU8sSUFBSSxFQUFFO2dCQUNsQyxTQUFTLEVBQUUsSUFBSSxDQUFDLFFBQVEsSUFBSSxFQUFFO2FBQy9CO1NBQ0YsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVELEtBQUssQ0FBQyxRQUFRLENBQUMsT0FBMEI7UUFDdkMsTUFBTSxRQUFRLEdBQUcsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDO1lBQ3pELEtBQUssRUFBRSxPQUFPLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSztZQUN6QyxRQUFRLEVBQUUsT0FBTyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ3JDLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSTtnQkFDWixPQUFPLEVBQUUsQ0FBQyxDQUFDLE9BQU87YUFDbkIsQ0FBQyxDQUFDO1lBQ0gsVUFBVSxFQUFFLE9BQU8sQ0FBQyxTQUFTLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLElBQUksSUFBSTtZQUM5RCxXQUFXLEVBQUUsT0FBTyxDQUFDLFdBQVcsSUFBSSxHQUFHO1NBQ3hDLENBQUMsQ0FBQztRQUVILE1BQU0sTUFBTSxHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFbkMsT0FBTztZQUNMLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sSUFBSSxFQUFFO1lBQ3JDLEtBQUssRUFBRSxRQUFRLENBQUMsS0FBSztZQUNyQixRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVE7WUFDdkIsS0FBSyxFQUFFO2dCQUNMLFlBQVksRUFBRSxRQUFRLENBQUMsS0FBSyxFQUFFLGFBQWEsSUFBSSxDQUFDO2dCQUNoRCxnQkFBZ0IsRUFBRSxRQUFRLENBQUMsS0FBSyxFQUFFLGlCQUFpQixJQUFJLENBQUM7Z0JBQ3hELFdBQVcsRUFBRSxRQUFRLENBQUMsS0FBSyxFQUFFLFlBQVksSUFBSSxDQUFDO2FBQy9DO1lBQ0QsWUFBWSxFQUFFLE1BQU0sQ0FBQyxhQUFhLElBQUksU0FBUztTQUNoRCxDQUFDO0lBQ0osQ0FBQztJQUVELEtBQUssQ0FBQyxDQUFDLE1BQU0sQ0FDWCxPQUEwQjtRQUUxQixNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUM7WUFDdkQsS0FBSyxFQUFFLE9BQU8sQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLO1lBQ3pDLFFBQVEsRUFBRSxPQUFPLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDckMsSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJO2dCQUNaLE9BQU8sRUFBRSxDQUFDLENBQUMsT0FBTzthQUNuQixDQUFDLENBQUM7WUFDSCxVQUFVLEVBQUUsT0FBTyxDQUFDLFNBQVMsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsSUFBSSxJQUFJO1lBQzlELFdBQVcsRUFBRSxPQUFPLENBQUMsV0FBVyxJQUFJLEdBQUc7WUFDdkMsTUFBTSxFQUFFLElBQUk7U0FDYixDQUFDLENBQUM7UUFFSCxJQUFJLEtBQUssRUFBRSxNQUFNLEtBQUssSUFBSSxNQUFNLEVBQUUsQ0FBQztZQUNqQyxNQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssRUFBRSxPQUFPLElBQUksRUFBRSxDQUFDO1lBQ3ZELE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsYUFBYSxLQUFLLElBQUksQ0FBQztZQUV0RCxNQUFNLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDO1FBQzFCLENBQUM7SUFDSCxDQUFDO0NBQ0Y7QUF0RUQsZ0RBc0VDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IE9wZW5BSSBmcm9tICdvcGVuYWknO1xuaW1wb3J0IHsgQmFzZUxMTVByb3ZpZGVyIH0gZnJvbSAnLi9iYXNlJztcbmltcG9ydCB7XG4gIENvbXBsZXRpb25PcHRpb25zLFxuICBDb21wbGV0aW9uUmVzcG9uc2UsXG4gIExMTVByb3ZpZGVyLFxuICBQcm92aWRlckNvbmZpZyxcbiAgU3RyZWFtQ2h1bmssXG59IGZyb20gJy4uL3R5cGVzJztcblxuLyoqXG4gKiBPcGVuUm91dGVyIHByb3ZpZGVyIGltcGxlbWVudGF0aW9uXG4gKiBQcm92aWRlcyB1bmlmaWVkIGFjY2VzcyB0byBtYW55IG1vZGVscyB2aWEgT3BlbkFJLWNvbXBhdGlibGUgQVBJXG4gKiBcbiAqIFBvcHVsYXIgbW9kZWxzICh1c2UgZnVsbCBtb2RlbCBJRCk6XG4gKiAtIG9wZW5haS9ncHQtNG8tbWluaSAoY2hlYXApXG4gKiAtIG9wZW5haS9ncHQtNG8gKGJhbGFuY2VkKVxuICogLSBhbnRocm9waWMvY2xhdWRlLTMuNS1zb25uZXQgKGJhbGFuY2VkKVxuICogLSBnb29nbGUvZ2VtaW5pLTIuMC1mbGFzaC1leHAgKGZhc3QpXG4gKiAtIG1ldGEtbGxhbWEvbGxhbWEtMy4xLTcwYi1pbnN0cnVjdCAob3BlbiBzb3VyY2UpXG4gKiAtIG1pc3RyYWxhaS9taXN0cmFsLWxhcmdlIChFdXJvcGVhbilcbiAqIFxuICogU2VlIGh0dHBzOi8vb3BlbnJvdXRlci5haS9tb2RlbHMgZm9yIGZ1bGwgbGlzdFxuICovXG5leHBvcnQgY2xhc3MgT3BlblJvdXRlclByb3ZpZGVyIGV4dGVuZHMgQmFzZUxMTVByb3ZpZGVyIHtcbiAgcmVhZG9ubHkgcHJvdmlkZXI6IExMTVByb3ZpZGVyID0gJ29wZW5yb3V0ZXInIGFzIExMTVByb3ZpZGVyO1xuICBwcml2YXRlIGNsaWVudDogT3BlbkFJO1xuICBwcml2YXRlIHNpdGVVcmw/OiBzdHJpbmc7XG4gIHByaXZhdGUgc2l0ZU5hbWU/OiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgY29uZmlnOiBQcm92aWRlckNvbmZpZyxcbiAgICBvcHRpb25zPzogeyBzaXRlVXJsPzogc3RyaW5nOyBzaXRlTmFtZT86IHN0cmluZyB9XG4gICkge1xuICAgIHN1cGVyKGNvbmZpZyk7XG4gICAgdGhpcy5zaXRlVXJsID0gb3B0aW9ucz8uc2l0ZVVybDtcbiAgICB0aGlzLnNpdGVOYW1lID0gb3B0aW9ucz8uc2l0ZU5hbWU7XG4gICAgdGhpcy5jbGllbnQgPSBuZXcgT3BlbkFJKHtcbiAgICAgIGFwaUtleTogY29uZmlnLmFwaUtleSxcbiAgICAgIGJhc2VVUkw6IGNvbmZpZy5iYXNlVXJsIHx8ICdodHRwczovL29wZW5yb3V0ZXIuYWkvYXBpL3YxJyxcbiAgICAgIGRlZmF1bHRIZWFkZXJzOiB7XG4gICAgICAgICdIVFRQLVJlZmVyZXInOiB0aGlzLnNpdGVVcmwgfHwgJycsXG4gICAgICAgICdYLVRpdGxlJzogdGhpcy5zaXRlTmFtZSB8fCAnJyxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBjb21wbGV0ZShvcHRpb25zOiBDb21wbGV0aW9uT3B0aW9ucyk6IFByb21pc2U8Q29tcGxldGlvblJlc3BvbnNlPiB7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLmNsaWVudC5jaGF0LmNvbXBsZXRpb25zLmNyZWF0ZSh7XG4gICAgICBtb2RlbDogb3B0aW9ucy5tb2RlbCB8fCB0aGlzLmNvbmZpZy5tb2RlbCxcbiAgICAgIG1lc3NhZ2VzOiBvcHRpb25zLm1lc3NhZ2VzLm1hcCgobSkgPT4gKHtcbiAgICAgICAgcm9sZTogbS5yb2xlLFxuICAgICAgICBjb250ZW50OiBtLmNvbnRlbnQsXG4gICAgICB9KSksXG4gICAgICBtYXhfdG9rZW5zOiBvcHRpb25zLm1heFRva2VucyB8fCB0aGlzLmNvbmZpZy5tYXhUb2tlbnMgfHwgNDA5NixcbiAgICAgIHRlbXBlcmF0dXJlOiBvcHRpb25zLnRlbXBlcmF0dXJlID8/IDAuNyxcbiAgICB9KTtcblxuICAgIGNvbnN0IGNob2ljZSA9IHJlc3BvbnNlLmNob2ljZXNbMF07XG5cbiAgICByZXR1cm4ge1xuICAgICAgY29udGVudDogY2hvaWNlLm1lc3NhZ2UuY29udGVudCB8fCAnJyxcbiAgICAgIG1vZGVsOiByZXNwb25zZS5tb2RlbCxcbiAgICAgIHByb3ZpZGVyOiB0aGlzLnByb3ZpZGVyLFxuICAgICAgdXNhZ2U6IHtcbiAgICAgICAgcHJvbXB0VG9rZW5zOiByZXNwb25zZS51c2FnZT8ucHJvbXB0X3Rva2VucyB8fCAwLFxuICAgICAgICBjb21wbGV0aW9uVG9rZW5zOiByZXNwb25zZS51c2FnZT8uY29tcGxldGlvbl90b2tlbnMgfHwgMCxcbiAgICAgICAgdG90YWxUb2tlbnM6IHJlc3BvbnNlLnVzYWdlPy50b3RhbF90b2tlbnMgfHwgMCxcbiAgICAgIH0sXG4gICAgICBmaW5pc2hSZWFzb246IGNob2ljZS5maW5pc2hfcmVhc29uIHx8ICd1bmtub3duJyxcbiAgICB9O1xuICB9XG5cbiAgYXN5bmMgKnN0cmVhbShcbiAgICBvcHRpb25zOiBDb21wbGV0aW9uT3B0aW9uc1xuICApOiBBc3luY0dlbmVyYXRvcjxTdHJlYW1DaHVuaywgdm9pZCwgdW5rbm93bj4ge1xuICAgIGNvbnN0IHN0cmVhbSA9IGF3YWl0IHRoaXMuY2xpZW50LmNoYXQuY29tcGxldGlvbnMuY3JlYXRlKHtcbiAgICAgIG1vZGVsOiBvcHRpb25zLm1vZGVsIHx8IHRoaXMuY29uZmlnLm1vZGVsLFxuICAgICAgbWVzc2FnZXM6IG9wdGlvbnMubWVzc2FnZXMubWFwKChtKSA9PiAoe1xuICAgICAgICByb2xlOiBtLnJvbGUsXG4gICAgICAgIGNvbnRlbnQ6IG0uY29udGVudCxcbiAgICAgIH0pKSxcbiAgICAgIG1heF90b2tlbnM6IG9wdGlvbnMubWF4VG9rZW5zIHx8IHRoaXMuY29uZmlnLm1heFRva2VucyB8fCA0MDk2LFxuICAgICAgdGVtcGVyYXR1cmU6IG9wdGlvbnMudGVtcGVyYXR1cmUgPz8gMC43LFxuICAgICAgc3RyZWFtOiB0cnVlLFxuICAgIH0pO1xuXG4gICAgZm9yIGF3YWl0IChjb25zdCBjaHVuayBvZiBzdHJlYW0pIHtcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBjaHVuay5jaG9pY2VzWzBdPy5kZWx0YT8uY29udGVudCB8fCAnJztcbiAgICAgIGNvbnN0IGRvbmUgPSBjaHVuay5jaG9pY2VzWzBdPy5maW5pc2hfcmVhc29uICE9PSBudWxsO1xuXG4gICAgICB5aWVsZCB7IGNvbnRlbnQsIGRvbmUgfTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==