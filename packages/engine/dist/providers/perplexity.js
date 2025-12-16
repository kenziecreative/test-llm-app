"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerplexityProvider = void 0;
const openai_1 = __importDefault(require("openai"));
const base_1 = require("./base");
/**
 * Perplexity provider implementation
 * Uses OpenAI-compatible API
 *
 * Models:
 * - llama-3.1-sonar-small-128k-online (fast, cheap, web search)
 * - llama-3.1-sonar-large-128k-online (balanced, web search)
 * - llama-3.1-sonar-huge-128k-online (most capable, web search)
 */
class PerplexityProvider extends base_1.BaseLLMProvider {
    provider = 'perplexity';
    client;
    constructor(config) {
        super(config);
        this.client = new openai_1.default({
            apiKey: config.apiKey,
            baseURL: config.baseUrl || 'https://api.perplexity.ai',
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
exports.PerplexityProvider = PerplexityProvider;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGVycGxleGl0eS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9wcm92aWRlcnMvcGVycGxleGl0eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxvREFBNEI7QUFDNUIsaUNBQXlDO0FBU3pDOzs7Ozs7OztHQVFHO0FBQ0gsTUFBYSxrQkFBbUIsU0FBUSxzQkFBZTtJQUM1QyxRQUFRLEdBQWdCLFlBQTJCLENBQUM7SUFDckQsTUFBTSxDQUFTO0lBRXZCLFlBQVksTUFBc0I7UUFDaEMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ2QsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLGdCQUFNLENBQUM7WUFDdkIsTUFBTSxFQUFFLE1BQU0sQ0FBQyxNQUFNO1lBQ3JCLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxJQUFJLDJCQUEyQjtTQUN2RCxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQsS0FBSyxDQUFDLFFBQVEsQ0FBQyxPQUEwQjtRQUN2QyxNQUFNLFFBQVEsR0FBRyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUM7WUFDekQsS0FBSyxFQUFFLE9BQU8sQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLO1lBQ3pDLFFBQVEsRUFBRSxPQUFPLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDckMsSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJO2dCQUNaLE9BQU8sRUFBRSxDQUFDLENBQUMsT0FBTzthQUNuQixDQUFDLENBQUM7WUFDSCxVQUFVLEVBQUUsT0FBTyxDQUFDLFNBQVMsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsSUFBSSxJQUFJO1lBQzlELFdBQVcsRUFBRSxPQUFPLENBQUMsV0FBVyxJQUFJLEdBQUc7U0FDeEMsQ0FBQyxDQUFDO1FBRUgsTUFBTSxNQUFNLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUVuQyxPQUFPO1lBQ0wsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxJQUFJLEVBQUU7WUFDckMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxLQUFLO1lBQ3JCLFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUTtZQUN2QixLQUFLLEVBQUU7Z0JBQ0wsWUFBWSxFQUFFLFFBQVEsQ0FBQyxLQUFLLEVBQUUsYUFBYSxJQUFJLENBQUM7Z0JBQ2hELGdCQUFnQixFQUFFLFFBQVEsQ0FBQyxLQUFLLEVBQUUsaUJBQWlCLElBQUksQ0FBQztnQkFDeEQsV0FBVyxFQUFFLFFBQVEsQ0FBQyxLQUFLLEVBQUUsWUFBWSxJQUFJLENBQUM7YUFDL0M7WUFDRCxZQUFZLEVBQUUsTUFBTSxDQUFDLGFBQWEsSUFBSSxTQUFTO1NBQ2hELENBQUM7SUFDSixDQUFDO0lBRUQsS0FBSyxDQUFDLENBQUMsTUFBTSxDQUNYLE9BQTBCO1FBRTFCLE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQztZQUN2RCxLQUFLLEVBQUUsT0FBTyxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUs7WUFDekMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUNyQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUk7Z0JBQ1osT0FBTyxFQUFFLENBQUMsQ0FBQyxPQUFPO2FBQ25CLENBQUMsQ0FBQztZQUNILFVBQVUsRUFBRSxPQUFPLENBQUMsU0FBUyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxJQUFJLElBQUk7WUFDOUQsV0FBVyxFQUFFLE9BQU8sQ0FBQyxXQUFXLElBQUksR0FBRztZQUN2QyxNQUFNLEVBQUUsSUFBSTtTQUNiLENBQUMsQ0FBQztRQUVILElBQUksS0FBSyxFQUFFLE1BQU0sS0FBSyxJQUFJLE1BQU0sRUFBRSxDQUFDO1lBQ2pDLE1BQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLE9BQU8sSUFBSSxFQUFFLENBQUM7WUFDdkQsTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxhQUFhLEtBQUssSUFBSSxDQUFDO1lBRXRELE1BQU0sRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLENBQUM7UUFDMUIsQ0FBQztJQUNILENBQUM7Q0FDRjtBQTNERCxnREEyREMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgT3BlbkFJIGZyb20gJ29wZW5haSc7XG5pbXBvcnQgeyBCYXNlTExNUHJvdmlkZXIgfSBmcm9tICcuL2Jhc2UnO1xuaW1wb3J0IHtcbiAgQ29tcGxldGlvbk9wdGlvbnMsXG4gIENvbXBsZXRpb25SZXNwb25zZSxcbiAgTExNUHJvdmlkZXIsXG4gIFByb3ZpZGVyQ29uZmlnLFxuICBTdHJlYW1DaHVuayxcbn0gZnJvbSAnLi4vdHlwZXMnO1xuXG4vKipcbiAqIFBlcnBsZXhpdHkgcHJvdmlkZXIgaW1wbGVtZW50YXRpb25cbiAqIFVzZXMgT3BlbkFJLWNvbXBhdGlibGUgQVBJXG4gKiBcbiAqIE1vZGVsczpcbiAqIC0gbGxhbWEtMy4xLXNvbmFyLXNtYWxsLTEyOGstb25saW5lIChmYXN0LCBjaGVhcCwgd2ViIHNlYXJjaClcbiAqIC0gbGxhbWEtMy4xLXNvbmFyLWxhcmdlLTEyOGstb25saW5lIChiYWxhbmNlZCwgd2ViIHNlYXJjaClcbiAqIC0gbGxhbWEtMy4xLXNvbmFyLWh1Z2UtMTI4ay1vbmxpbmUgKG1vc3QgY2FwYWJsZSwgd2ViIHNlYXJjaClcbiAqL1xuZXhwb3J0IGNsYXNzIFBlcnBsZXhpdHlQcm92aWRlciBleHRlbmRzIEJhc2VMTE1Qcm92aWRlciB7XG4gIHJlYWRvbmx5IHByb3ZpZGVyOiBMTE1Qcm92aWRlciA9ICdwZXJwbGV4aXR5JyBhcyBMTE1Qcm92aWRlcjtcbiAgcHJpdmF0ZSBjbGllbnQ6IE9wZW5BSTtcblxuICBjb25zdHJ1Y3Rvcihjb25maWc6IFByb3ZpZGVyQ29uZmlnKSB7XG4gICAgc3VwZXIoY29uZmlnKTtcbiAgICB0aGlzLmNsaWVudCA9IG5ldyBPcGVuQUkoe1xuICAgICAgYXBpS2V5OiBjb25maWcuYXBpS2V5LFxuICAgICAgYmFzZVVSTDogY29uZmlnLmJhc2VVcmwgfHwgJ2h0dHBzOi8vYXBpLnBlcnBsZXhpdHkuYWknLFxuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgY29tcGxldGUob3B0aW9uczogQ29tcGxldGlvbk9wdGlvbnMpOiBQcm9taXNlPENvbXBsZXRpb25SZXNwb25zZT4ge1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5jbGllbnQuY2hhdC5jb21wbGV0aW9ucy5jcmVhdGUoe1xuICAgICAgbW9kZWw6IG9wdGlvbnMubW9kZWwgfHwgdGhpcy5jb25maWcubW9kZWwsXG4gICAgICBtZXNzYWdlczogb3B0aW9ucy5tZXNzYWdlcy5tYXAoKG0pID0+ICh7XG4gICAgICAgIHJvbGU6IG0ucm9sZSxcbiAgICAgICAgY29udGVudDogbS5jb250ZW50LFxuICAgICAgfSkpLFxuICAgICAgbWF4X3Rva2Vuczogb3B0aW9ucy5tYXhUb2tlbnMgfHwgdGhpcy5jb25maWcubWF4VG9rZW5zIHx8IDQwOTYsXG4gICAgICB0ZW1wZXJhdHVyZTogb3B0aW9ucy50ZW1wZXJhdHVyZSA/PyAwLjcsXG4gICAgfSk7XG5cbiAgICBjb25zdCBjaG9pY2UgPSByZXNwb25zZS5jaG9pY2VzWzBdO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGNvbnRlbnQ6IGNob2ljZS5tZXNzYWdlLmNvbnRlbnQgfHwgJycsXG4gICAgICBtb2RlbDogcmVzcG9uc2UubW9kZWwsXG4gICAgICBwcm92aWRlcjogdGhpcy5wcm92aWRlcixcbiAgICAgIHVzYWdlOiB7XG4gICAgICAgIHByb21wdFRva2VuczogcmVzcG9uc2UudXNhZ2U/LnByb21wdF90b2tlbnMgfHwgMCxcbiAgICAgICAgY29tcGxldGlvblRva2VuczogcmVzcG9uc2UudXNhZ2U/LmNvbXBsZXRpb25fdG9rZW5zIHx8IDAsXG4gICAgICAgIHRvdGFsVG9rZW5zOiByZXNwb25zZS51c2FnZT8udG90YWxfdG9rZW5zIHx8IDAsXG4gICAgICB9LFxuICAgICAgZmluaXNoUmVhc29uOiBjaG9pY2UuZmluaXNoX3JlYXNvbiB8fCAndW5rbm93bicsXG4gICAgfTtcbiAgfVxuXG4gIGFzeW5jICpzdHJlYW0oXG4gICAgb3B0aW9uczogQ29tcGxldGlvbk9wdGlvbnNcbiAgKTogQXN5bmNHZW5lcmF0b3I8U3RyZWFtQ2h1bmssIHZvaWQsIHVua25vd24+IHtcbiAgICBjb25zdCBzdHJlYW0gPSBhd2FpdCB0aGlzLmNsaWVudC5jaGF0LmNvbXBsZXRpb25zLmNyZWF0ZSh7XG4gICAgICBtb2RlbDogb3B0aW9ucy5tb2RlbCB8fCB0aGlzLmNvbmZpZy5tb2RlbCxcbiAgICAgIG1lc3NhZ2VzOiBvcHRpb25zLm1lc3NhZ2VzLm1hcCgobSkgPT4gKHtcbiAgICAgICAgcm9sZTogbS5yb2xlLFxuICAgICAgICBjb250ZW50OiBtLmNvbnRlbnQsXG4gICAgICB9KSksXG4gICAgICBtYXhfdG9rZW5zOiBvcHRpb25zLm1heFRva2VucyB8fCB0aGlzLmNvbmZpZy5tYXhUb2tlbnMgfHwgNDA5NixcbiAgICAgIHRlbXBlcmF0dXJlOiBvcHRpb25zLnRlbXBlcmF0dXJlID8/IDAuNyxcbiAgICAgIHN0cmVhbTogdHJ1ZSxcbiAgICB9KTtcblxuICAgIGZvciBhd2FpdCAoY29uc3QgY2h1bmsgb2Ygc3RyZWFtKSB7XG4gICAgICBjb25zdCBjb250ZW50ID0gY2h1bmsuY2hvaWNlc1swXT8uZGVsdGE/LmNvbnRlbnQgfHwgJyc7XG4gICAgICBjb25zdCBkb25lID0gY2h1bmsuY2hvaWNlc1swXT8uZmluaXNoX3JlYXNvbiAhPT0gbnVsbDtcblxuICAgICAgeWllbGQgeyBjb250ZW50LCBkb25lIH07XG4gICAgfVxuICB9XG59XG4iXX0=