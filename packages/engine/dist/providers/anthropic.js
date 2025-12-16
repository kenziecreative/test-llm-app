"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnthropicProvider = void 0;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const base_1 = require("./base");
/**
 * Anthropic provider implementation
 * Supports: claude-opus-4.5, claude-sonnet-4, claude-3-5-sonnet, claude-3-5-haiku
 */
class AnthropicProvider extends base_1.BaseLLMProvider {
    provider = 'anthropic';
    client;
    constructor(config) {
        super(config);
        this.client = new sdk_1.default({
            apiKey: config.apiKey,
            baseURL: config.baseUrl,
        });
    }
    async complete(options) {
        // Extract system message if present
        const systemMessage = options.messages.find((m) => m.role === 'system');
        const nonSystemMessages = options.messages.filter((m) => m.role !== 'system');
        const response = await this.client.messages.create({
            model: options.model || this.config.model,
            max_tokens: options.maxTokens || this.config.maxTokens || 4096,
            system: systemMessage?.content,
            messages: nonSystemMessages.map((m) => ({
                role: m.role,
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
    async *stream(options) {
        const systemMessage = options.messages.find((m) => m.role === 'system');
        const nonSystemMessages = options.messages.filter((m) => m.role !== 'system');
        const stream = this.client.messages.stream({
            model: options.model || this.config.model,
            max_tokens: options.maxTokens || this.config.maxTokens || 4096,
            system: systemMessage?.content,
            messages: nonSystemMessages.map((m) => ({
                role: m.role,
                content: m.content,
            })),
        });
        for await (const event of stream) {
            if (event.type === 'content_block_delta' &&
                event.delta.type === 'text_delta') {
                yield { content: event.delta.text, done: false };
            }
            else if (event.type === 'message_stop') {
                yield { content: '', done: true };
            }
        }
    }
}
exports.AnthropicProvider = AnthropicProvider;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW50aHJvcGljLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3Byb3ZpZGVycy9hbnRocm9waWMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsNERBQTBDO0FBQzFDLGlDQUF5QztBQVN6Qzs7O0dBR0c7QUFDSCxNQUFhLGlCQUFrQixTQUFRLHNCQUFlO0lBQzNDLFFBQVEsR0FBZ0IsV0FBVyxDQUFDO0lBQ3JDLE1BQU0sQ0FBWTtJQUUxQixZQUFZLE1BQXNCO1FBQ2hDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNkLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxhQUFTLENBQUM7WUFDMUIsTUFBTSxFQUFFLE1BQU0sQ0FBQyxNQUFNO1lBQ3JCLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTztTQUN4QixDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQsS0FBSyxDQUFDLFFBQVEsQ0FBQyxPQUEwQjtRQUN2QyxvQ0FBb0M7UUFDcEMsTUFBTSxhQUFhLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssUUFBUSxDQUFDLENBQUM7UUFDeEUsTUFBTSxpQkFBaUIsR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxRQUFRLENBQUMsQ0FBQztRQUU5RSxNQUFNLFFBQVEsR0FBRyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQztZQUNqRCxLQUFLLEVBQUUsT0FBTyxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUs7WUFDekMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxTQUFTLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLElBQUksSUFBSTtZQUM5RCxNQUFNLEVBQUUsYUFBYSxFQUFFLE9BQU87WUFDOUIsUUFBUSxFQUFFLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDdEMsSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUE0QjtnQkFDcEMsT0FBTyxFQUFFLENBQUMsQ0FBQyxPQUFPO2FBQ25CLENBQUMsQ0FBQztTQUNKLENBQUMsQ0FBQztRQUVILE1BQU0sV0FBVyxHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLE1BQU0sQ0FBQyxDQUFDO1FBRXBFLE9BQU87WUFDTCxPQUFPLEVBQUUsV0FBVyxFQUFFLElBQUksS0FBSyxNQUFNLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFDN0QsS0FBSyxFQUFFLFFBQVEsQ0FBQyxLQUFLO1lBQ3JCLFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUTtZQUN2QixLQUFLLEVBQUU7Z0JBQ0wsWUFBWSxFQUFFLFFBQVEsQ0FBQyxLQUFLLENBQUMsWUFBWTtnQkFDekMsZ0JBQWdCLEVBQUUsUUFBUSxDQUFDLEtBQUssQ0FBQyxhQUFhO2dCQUM5QyxXQUFXLEVBQUUsUUFBUSxDQUFDLEtBQUssQ0FBQyxZQUFZLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxhQUFhO2FBQ3hFO1lBQ0QsWUFBWSxFQUFFLFFBQVEsQ0FBQyxXQUFXLElBQUksU0FBUztTQUNoRCxDQUFDO0lBQ0osQ0FBQztJQUVELEtBQUssQ0FBQyxDQUFDLE1BQU0sQ0FDWCxPQUEwQjtRQUUxQixNQUFNLGFBQWEsR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxRQUFRLENBQUMsQ0FBQztRQUN4RSxNQUFNLGlCQUFpQixHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLFFBQVEsQ0FBQyxDQUFDO1FBRTlFLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQztZQUN6QyxLQUFLLEVBQUUsT0FBTyxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUs7WUFDekMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxTQUFTLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLElBQUksSUFBSTtZQUM5RCxNQUFNLEVBQUUsYUFBYSxFQUFFLE9BQU87WUFDOUIsUUFBUSxFQUFFLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDdEMsSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUE0QjtnQkFDcEMsT0FBTyxFQUFFLENBQUMsQ0FBQyxPQUFPO2FBQ25CLENBQUMsQ0FBQztTQUNKLENBQUMsQ0FBQztRQUVILElBQUksS0FBSyxFQUFFLE1BQU0sS0FBSyxJQUFJLE1BQU0sRUFBRSxDQUFDO1lBQ2pDLElBQ0UsS0FBSyxDQUFDLElBQUksS0FBSyxxQkFBcUI7Z0JBQ3BDLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxLQUFLLFlBQVksRUFDakMsQ0FBQztnQkFDRCxNQUFNLEVBQUUsT0FBTyxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQztZQUNuRCxDQUFDO2lCQUFNLElBQUksS0FBSyxDQUFDLElBQUksS0FBSyxjQUFjLEVBQUUsQ0FBQztnQkFDekMsTUFBTSxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDO1lBQ3BDLENBQUM7UUFDSCxDQUFDO0lBQ0gsQ0FBQztDQUNGO0FBckVELDhDQXFFQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBBbnRocm9waWMgZnJvbSAnQGFudGhyb3BpYy1haS9zZGsnO1xuaW1wb3J0IHsgQmFzZUxMTVByb3ZpZGVyIH0gZnJvbSAnLi9iYXNlJztcbmltcG9ydCB7XG4gIENvbXBsZXRpb25PcHRpb25zLFxuICBDb21wbGV0aW9uUmVzcG9uc2UsXG4gIExMTVByb3ZpZGVyLFxuICBQcm92aWRlckNvbmZpZyxcbiAgU3RyZWFtQ2h1bmssXG59IGZyb20gJy4uL3R5cGVzJztcblxuLyoqXG4gKiBBbnRocm9waWMgcHJvdmlkZXIgaW1wbGVtZW50YXRpb25cbiAqIFN1cHBvcnRzOiBjbGF1ZGUtb3B1cy00LjUsIGNsYXVkZS1zb25uZXQtNCwgY2xhdWRlLTMtNS1zb25uZXQsIGNsYXVkZS0zLTUtaGFpa3VcbiAqL1xuZXhwb3J0IGNsYXNzIEFudGhyb3BpY1Byb3ZpZGVyIGV4dGVuZHMgQmFzZUxMTVByb3ZpZGVyIHtcbiAgcmVhZG9ubHkgcHJvdmlkZXI6IExMTVByb3ZpZGVyID0gJ2FudGhyb3BpYyc7XG4gIHByaXZhdGUgY2xpZW50OiBBbnRocm9waWM7XG5cbiAgY29uc3RydWN0b3IoY29uZmlnOiBQcm92aWRlckNvbmZpZykge1xuICAgIHN1cGVyKGNvbmZpZyk7XG4gICAgdGhpcy5jbGllbnQgPSBuZXcgQW50aHJvcGljKHtcbiAgICAgIGFwaUtleTogY29uZmlnLmFwaUtleSxcbiAgICAgIGJhc2VVUkw6IGNvbmZpZy5iYXNlVXJsLFxuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgY29tcGxldGUob3B0aW9uczogQ29tcGxldGlvbk9wdGlvbnMpOiBQcm9taXNlPENvbXBsZXRpb25SZXNwb25zZT4ge1xuICAgIC8vIEV4dHJhY3Qgc3lzdGVtIG1lc3NhZ2UgaWYgcHJlc2VudFxuICAgIGNvbnN0IHN5c3RlbU1lc3NhZ2UgPSBvcHRpb25zLm1lc3NhZ2VzLmZpbmQoKG0pID0+IG0ucm9sZSA9PT0gJ3N5c3RlbScpO1xuICAgIGNvbnN0IG5vblN5c3RlbU1lc3NhZ2VzID0gb3B0aW9ucy5tZXNzYWdlcy5maWx0ZXIoKG0pID0+IG0ucm9sZSAhPT0gJ3N5c3RlbScpO1xuXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLmNsaWVudC5tZXNzYWdlcy5jcmVhdGUoe1xuICAgICAgbW9kZWw6IG9wdGlvbnMubW9kZWwgfHwgdGhpcy5jb25maWcubW9kZWwsXG4gICAgICBtYXhfdG9rZW5zOiBvcHRpb25zLm1heFRva2VucyB8fCB0aGlzLmNvbmZpZy5tYXhUb2tlbnMgfHwgNDA5NixcbiAgICAgIHN5c3RlbTogc3lzdGVtTWVzc2FnZT8uY29udGVudCxcbiAgICAgIG1lc3NhZ2VzOiBub25TeXN0ZW1NZXNzYWdlcy5tYXAoKG0pID0+ICh7XG4gICAgICAgIHJvbGU6IG0ucm9sZSBhcyAndXNlcicgfCAnYXNzaXN0YW50JyxcbiAgICAgICAgY29udGVudDogbS5jb250ZW50LFxuICAgICAgfSkpLFxuICAgIH0pO1xuXG4gICAgY29uc3QgdGV4dENvbnRlbnQgPSByZXNwb25zZS5jb250ZW50LmZpbmQoKGMpID0+IGMudHlwZSA9PT0gJ3RleHQnKTtcblxuICAgIHJldHVybiB7XG4gICAgICBjb250ZW50OiB0ZXh0Q29udGVudD8udHlwZSA9PT0gJ3RleHQnID8gdGV4dENvbnRlbnQudGV4dCA6ICcnLFxuICAgICAgbW9kZWw6IHJlc3BvbnNlLm1vZGVsLFxuICAgICAgcHJvdmlkZXI6IHRoaXMucHJvdmlkZXIsXG4gICAgICB1c2FnZToge1xuICAgICAgICBwcm9tcHRUb2tlbnM6IHJlc3BvbnNlLnVzYWdlLmlucHV0X3Rva2VucyxcbiAgICAgICAgY29tcGxldGlvblRva2VuczogcmVzcG9uc2UudXNhZ2Uub3V0cHV0X3Rva2VucyxcbiAgICAgICAgdG90YWxUb2tlbnM6IHJlc3BvbnNlLnVzYWdlLmlucHV0X3Rva2VucyArIHJlc3BvbnNlLnVzYWdlLm91dHB1dF90b2tlbnMsXG4gICAgICB9LFxuICAgICAgZmluaXNoUmVhc29uOiByZXNwb25zZS5zdG9wX3JlYXNvbiB8fCAndW5rbm93bicsXG4gICAgfTtcbiAgfVxuXG4gIGFzeW5jICpzdHJlYW0oXG4gICAgb3B0aW9uczogQ29tcGxldGlvbk9wdGlvbnNcbiAgKTogQXN5bmNHZW5lcmF0b3I8U3RyZWFtQ2h1bmssIHZvaWQsIHVua25vd24+IHtcbiAgICBjb25zdCBzeXN0ZW1NZXNzYWdlID0gb3B0aW9ucy5tZXNzYWdlcy5maW5kKChtKSA9PiBtLnJvbGUgPT09ICdzeXN0ZW0nKTtcbiAgICBjb25zdCBub25TeXN0ZW1NZXNzYWdlcyA9IG9wdGlvbnMubWVzc2FnZXMuZmlsdGVyKChtKSA9PiBtLnJvbGUgIT09ICdzeXN0ZW0nKTtcblxuICAgIGNvbnN0IHN0cmVhbSA9IHRoaXMuY2xpZW50Lm1lc3NhZ2VzLnN0cmVhbSh7XG4gICAgICBtb2RlbDogb3B0aW9ucy5tb2RlbCB8fCB0aGlzLmNvbmZpZy5tb2RlbCxcbiAgICAgIG1heF90b2tlbnM6IG9wdGlvbnMubWF4VG9rZW5zIHx8IHRoaXMuY29uZmlnLm1heFRva2VucyB8fCA0MDk2LFxuICAgICAgc3lzdGVtOiBzeXN0ZW1NZXNzYWdlPy5jb250ZW50LFxuICAgICAgbWVzc2FnZXM6IG5vblN5c3RlbU1lc3NhZ2VzLm1hcCgobSkgPT4gKHtcbiAgICAgICAgcm9sZTogbS5yb2xlIGFzICd1c2VyJyB8ICdhc3Npc3RhbnQnLFxuICAgICAgICBjb250ZW50OiBtLmNvbnRlbnQsXG4gICAgICB9KSksXG4gICAgfSk7XG5cbiAgICBmb3IgYXdhaXQgKGNvbnN0IGV2ZW50IG9mIHN0cmVhbSkge1xuICAgICAgaWYgKFxuICAgICAgICBldmVudC50eXBlID09PSAnY29udGVudF9ibG9ja19kZWx0YScgJiZcbiAgICAgICAgZXZlbnQuZGVsdGEudHlwZSA9PT0gJ3RleHRfZGVsdGEnXG4gICAgICApIHtcbiAgICAgICAgeWllbGQgeyBjb250ZW50OiBldmVudC5kZWx0YS50ZXh0LCBkb25lOiBmYWxzZSB9O1xuICAgICAgfSBlbHNlIGlmIChldmVudC50eXBlID09PSAnbWVzc2FnZV9zdG9wJykge1xuICAgICAgICB5aWVsZCB7IGNvbnRlbnQ6ICcnLCBkb25lOiB0cnVlIH07XG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iXX0=