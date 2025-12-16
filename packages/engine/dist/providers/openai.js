"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIProvider = void 0;
const openai_1 = __importDefault(require("openai"));
const base_1 = require("./base");
/**
 * OpenAI provider implementation
 * Supports: gpt-5.2, gpt-4o, gpt-4-turbo, o1-preview, o1-mini
 */
class OpenAIProvider extends base_1.BaseLLMProvider {
    provider = 'openai';
    client;
    constructor(config) {
        super(config);
        this.client = new openai_1.default({
            apiKey: config.apiKey,
            baseURL: config.baseUrl,
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
exports.OpenAIProvider = OpenAIProvider;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3BlbmFpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3Byb3ZpZGVycy9vcGVuYWkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsb0RBQTRCO0FBQzVCLGlDQUF5QztBQVN6Qzs7O0dBR0c7QUFDSCxNQUFhLGNBQWUsU0FBUSxzQkFBZTtJQUN4QyxRQUFRLEdBQWdCLFFBQVEsQ0FBQztJQUNsQyxNQUFNLENBQVM7SUFFdkIsWUFBWSxNQUFzQjtRQUNoQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDZCxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksZ0JBQU0sQ0FBQztZQUN2QixNQUFNLEVBQUUsTUFBTSxDQUFDLE1BQU07WUFDckIsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPO1NBQ3hCLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRCxLQUFLLENBQUMsUUFBUSxDQUFDLE9BQTBCO1FBQ3ZDLE1BQU0sUUFBUSxHQUFHLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQztZQUN6RCxLQUFLLEVBQUUsT0FBTyxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUs7WUFDekMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUNyQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUk7Z0JBQ1osT0FBTyxFQUFFLENBQUMsQ0FBQyxPQUFPO2FBQ25CLENBQUMsQ0FBQztZQUNILFVBQVUsRUFBRSxPQUFPLENBQUMsU0FBUyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxJQUFJLElBQUk7WUFDOUQsV0FBVyxFQUFFLE9BQU8sQ0FBQyxXQUFXLElBQUksR0FBRztTQUN4QyxDQUFDLENBQUM7UUFFSCxNQUFNLE1BQU0sR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRW5DLE9BQU87WUFDTCxPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLElBQUksRUFBRTtZQUNyQyxLQUFLLEVBQUUsUUFBUSxDQUFDLEtBQUs7WUFDckIsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRO1lBQ3ZCLEtBQUssRUFBRTtnQkFDTCxZQUFZLEVBQUUsUUFBUSxDQUFDLEtBQUssRUFBRSxhQUFhLElBQUksQ0FBQztnQkFDaEQsZ0JBQWdCLEVBQUUsUUFBUSxDQUFDLEtBQUssRUFBRSxpQkFBaUIsSUFBSSxDQUFDO2dCQUN4RCxXQUFXLEVBQUUsUUFBUSxDQUFDLEtBQUssRUFBRSxZQUFZLElBQUksQ0FBQzthQUMvQztZQUNELFlBQVksRUFBRSxNQUFNLENBQUMsYUFBYSxJQUFJLFNBQVM7U0FDaEQsQ0FBQztJQUNKLENBQUM7SUFFRCxLQUFLLENBQUMsQ0FBQyxNQUFNLENBQ1gsT0FBMEI7UUFFMUIsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDO1lBQ3ZELEtBQUssRUFBRSxPQUFPLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSztZQUN6QyxRQUFRLEVBQUUsT0FBTyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ3JDLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSTtnQkFDWixPQUFPLEVBQUUsQ0FBQyxDQUFDLE9BQU87YUFDbkIsQ0FBQyxDQUFDO1lBQ0gsVUFBVSxFQUFFLE9BQU8sQ0FBQyxTQUFTLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLElBQUksSUFBSTtZQUM5RCxXQUFXLEVBQUUsT0FBTyxDQUFDLFdBQVcsSUFBSSxHQUFHO1lBQ3ZDLE1BQU0sRUFBRSxJQUFJO1NBQ2IsQ0FBQyxDQUFDO1FBRUgsSUFBSSxLQUFLLEVBQUUsTUFBTSxLQUFLLElBQUksTUFBTSxFQUFFLENBQUM7WUFDakMsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLEVBQUUsT0FBTyxJQUFJLEVBQUUsQ0FBQztZQUN2RCxNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLGFBQWEsS0FBSyxJQUFJLENBQUM7WUFFdEQsTUFBTSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FBQztRQUMxQixDQUFDO0lBQ0gsQ0FBQztDQUNGO0FBM0RELHdDQTJEQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBPcGVuQUkgZnJvbSAnb3BlbmFpJztcbmltcG9ydCB7IEJhc2VMTE1Qcm92aWRlciB9IGZyb20gJy4vYmFzZSc7XG5pbXBvcnQge1xuICBDb21wbGV0aW9uT3B0aW9ucyxcbiAgQ29tcGxldGlvblJlc3BvbnNlLFxuICBMTE1Qcm92aWRlcixcbiAgUHJvdmlkZXJDb25maWcsXG4gIFN0cmVhbUNodW5rLFxufSBmcm9tICcuLi90eXBlcyc7XG5cbi8qKlxuICogT3BlbkFJIHByb3ZpZGVyIGltcGxlbWVudGF0aW9uXG4gKiBTdXBwb3J0czogZ3B0LTUuMiwgZ3B0LTRvLCBncHQtNC10dXJibywgbzEtcHJldmlldywgbzEtbWluaVxuICovXG5leHBvcnQgY2xhc3MgT3BlbkFJUHJvdmlkZXIgZXh0ZW5kcyBCYXNlTExNUHJvdmlkZXIge1xuICByZWFkb25seSBwcm92aWRlcjogTExNUHJvdmlkZXIgPSAnb3BlbmFpJztcbiAgcHJpdmF0ZSBjbGllbnQ6IE9wZW5BSTtcblxuICBjb25zdHJ1Y3Rvcihjb25maWc6IFByb3ZpZGVyQ29uZmlnKSB7XG4gICAgc3VwZXIoY29uZmlnKTtcbiAgICB0aGlzLmNsaWVudCA9IG5ldyBPcGVuQUkoe1xuICAgICAgYXBpS2V5OiBjb25maWcuYXBpS2V5LFxuICAgICAgYmFzZVVSTDogY29uZmlnLmJhc2VVcmwsXG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBjb21wbGV0ZShvcHRpb25zOiBDb21wbGV0aW9uT3B0aW9ucyk6IFByb21pc2U8Q29tcGxldGlvblJlc3BvbnNlPiB7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLmNsaWVudC5jaGF0LmNvbXBsZXRpb25zLmNyZWF0ZSh7XG4gICAgICBtb2RlbDogb3B0aW9ucy5tb2RlbCB8fCB0aGlzLmNvbmZpZy5tb2RlbCxcbiAgICAgIG1lc3NhZ2VzOiBvcHRpb25zLm1lc3NhZ2VzLm1hcCgobSkgPT4gKHtcbiAgICAgICAgcm9sZTogbS5yb2xlLFxuICAgICAgICBjb250ZW50OiBtLmNvbnRlbnQsXG4gICAgICB9KSksXG4gICAgICBtYXhfdG9rZW5zOiBvcHRpb25zLm1heFRva2VucyB8fCB0aGlzLmNvbmZpZy5tYXhUb2tlbnMgfHwgNDA5NixcbiAgICAgIHRlbXBlcmF0dXJlOiBvcHRpb25zLnRlbXBlcmF0dXJlID8/IDAuNyxcbiAgICB9KTtcblxuICAgIGNvbnN0IGNob2ljZSA9IHJlc3BvbnNlLmNob2ljZXNbMF07XG5cbiAgICByZXR1cm4ge1xuICAgICAgY29udGVudDogY2hvaWNlLm1lc3NhZ2UuY29udGVudCB8fCAnJyxcbiAgICAgIG1vZGVsOiByZXNwb25zZS5tb2RlbCxcbiAgICAgIHByb3ZpZGVyOiB0aGlzLnByb3ZpZGVyLFxuICAgICAgdXNhZ2U6IHtcbiAgICAgICAgcHJvbXB0VG9rZW5zOiByZXNwb25zZS51c2FnZT8ucHJvbXB0X3Rva2VucyB8fCAwLFxuICAgICAgICBjb21wbGV0aW9uVG9rZW5zOiByZXNwb25zZS51c2FnZT8uY29tcGxldGlvbl90b2tlbnMgfHwgMCxcbiAgICAgICAgdG90YWxUb2tlbnM6IHJlc3BvbnNlLnVzYWdlPy50b3RhbF90b2tlbnMgfHwgMCxcbiAgICAgIH0sXG4gICAgICBmaW5pc2hSZWFzb246IGNob2ljZS5maW5pc2hfcmVhc29uIHx8ICd1bmtub3duJyxcbiAgICB9O1xuICB9XG5cbiAgYXN5bmMgKnN0cmVhbShcbiAgICBvcHRpb25zOiBDb21wbGV0aW9uT3B0aW9uc1xuICApOiBBc3luY0dlbmVyYXRvcjxTdHJlYW1DaHVuaywgdm9pZCwgdW5rbm93bj4ge1xuICAgIGNvbnN0IHN0cmVhbSA9IGF3YWl0IHRoaXMuY2xpZW50LmNoYXQuY29tcGxldGlvbnMuY3JlYXRlKHtcbiAgICAgIG1vZGVsOiBvcHRpb25zLm1vZGVsIHx8IHRoaXMuY29uZmlnLm1vZGVsLFxuICAgICAgbWVzc2FnZXM6IG9wdGlvbnMubWVzc2FnZXMubWFwKChtKSA9PiAoe1xuICAgICAgICByb2xlOiBtLnJvbGUsXG4gICAgICAgIGNvbnRlbnQ6IG0uY29udGVudCxcbiAgICAgIH0pKSxcbiAgICAgIG1heF90b2tlbnM6IG9wdGlvbnMubWF4VG9rZW5zIHx8IHRoaXMuY29uZmlnLm1heFRva2VucyB8fCA0MDk2LFxuICAgICAgdGVtcGVyYXR1cmU6IG9wdGlvbnMudGVtcGVyYXR1cmUgPz8gMC43LFxuICAgICAgc3RyZWFtOiB0cnVlLFxuICAgIH0pO1xuXG4gICAgZm9yIGF3YWl0IChjb25zdCBjaHVuayBvZiBzdHJlYW0pIHtcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBjaHVuay5jaG9pY2VzWzBdPy5kZWx0YT8uY29udGVudCB8fCAnJztcbiAgICAgIGNvbnN0IGRvbmUgPSBjaHVuay5jaG9pY2VzWzBdPy5maW5pc2hfcmVhc29uICE9PSBudWxsO1xuXG4gICAgICB5aWVsZCB7IGNvbnRlbnQsIGRvbmUgfTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==