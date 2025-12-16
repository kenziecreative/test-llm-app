"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMClient = void 0;
exports.createLLMClient = createLLMClient;
const providers_1 = require("./providers");
const utils_1 = require("./utils");
const types_1 = require("./types");
/**
 * Main LLM client with provider abstraction and rate limiting
 *
 * Usage:
 * ```typescript
 * const client = createLLMClient();
 * const response = await client.complete({
 *   messages: [{ role: 'user', content: 'Hello!' }],
 * });
 * ```
 */
class LLMClient {
    provider;
    rateLimiter;
    providerName;
    constructor(config) {
        this.providerName = config.provider;
        this.rateLimiter = config.rateLimiter || utils_1.defaultRateLimiter;
        this.provider = this.createProvider(config);
    }
    createProvider(config) {
        switch (config.provider) {
            case 'openai':
                if (!config.openai) {
                    throw new Error('OpenAI configuration required');
                }
                return new providers_1.OpenAIProvider(config.openai);
            case 'anthropic':
                if (!config.anthropic) {
                    throw new Error('Anthropic configuration required');
                }
                return new providers_1.AnthropicProvider(config.anthropic);
            case 'google':
                if (!config.google) {
                    throw new Error('Google configuration required');
                }
                return new providers_1.GoogleProvider(config.google);
            case 'bedrock':
                if (!config.bedrock) {
                    throw new Error('Bedrock configuration required');
                }
                return new providers_1.BedrockProvider(config.bedrock, {
                    region: config.bedrock.region,
                    accessKeyId: config.bedrock.accessKeyId,
                    secretAccessKey: config.bedrock.secretAccessKey,
                });
            case 'perplexity':
                if (!config.perplexity) {
                    throw new Error('Perplexity configuration required');
                }
                return new providers_1.PerplexityProvider(config.perplexity);
            case 'openrouter':
                if (!config.openrouter) {
                    throw new Error('OpenRouter configuration required');
                }
                return new providers_1.OpenRouterProvider(config.openrouter, {
                    siteUrl: config.openrouter.siteUrl,
                    siteName: config.openrouter.siteName,
                });
            default:
                throw new Error(`Unknown provider: ${config.provider}`);
        }
    }
    /**
     * Generate a completion with rate limiting and validation
     */
    async complete(options) {
        // Validate input
        const validated = types_1.CompletionRequestSchema.parse(options);
        // Check rate limit
        const userId = options.userId || 'anonymous';
        const estimatedTokens = this.estimateInputTokens(options.messages);
        const rateLimitCheck = this.rateLimiter.check(userId, estimatedTokens);
        if (!rateLimitCheck.allowed) {
            throw new Error(`Rate limit exceeded: ${rateLimitCheck.reason}. Reset in ${Math.ceil(rateLimitCheck.resetIn / 1000)}s`);
        }
        // Make the request
        const response = await this.provider.complete(validated);
        // Record usage
        this.rateLimiter.record(userId, response.usage.totalTokens);
        return response;
    }
    /**
     * Generate a streaming completion with rate limiting
     */
    async *stream(options) {
        // Validate input
        const validated = types_1.CompletionRequestSchema.parse(options);
        // Check rate limit
        const userId = options.userId || 'anonymous';
        const estimatedTokens = this.estimateInputTokens(options.messages);
        const rateLimitCheck = this.rateLimiter.check(userId, estimatedTokens);
        if (!rateLimitCheck.allowed) {
            throw new Error(`Rate limit exceeded: ${rateLimitCheck.reason}. Reset in ${Math.ceil(rateLimitCheck.resetIn / 1000)}s`);
        }
        // Record request (we'll estimate output tokens)
        this.rateLimiter.record(userId, estimatedTokens);
        // Stream the response
        yield* this.provider.stream(validated);
    }
    /**
     * Get the current provider name
     */
    getProvider() {
        return this.providerName;
    }
    /**
     * Get the current model
     */
    getModel() {
        return this.provider.getModel();
    }
    estimateInputTokens(messages) {
        return messages.reduce((sum, m) => sum + this.provider.estimateTokens(m.content), 0);
    }
}
exports.LLMClient = LLMClient;
/**
 * Create an LLM client from environment variables
 *
 * Default models are set to cost-effective options for development.
 * Change via environment variables for production.
 */
function createLLMClient(overrides) {
    const provider = (overrides?.provider ||
        process.env.LLM_PROVIDER ||
        'openai');
    const config = {
        provider,
        // OpenAI - default to gpt-4o-mini for cost efficiency
        openai: {
            apiKey: process.env.OPENAI_API_KEY || '',
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        },
        // Anthropic - default to claude-3-5-haiku for cost efficiency
        anthropic: {
            apiKey: process.env.ANTHROPIC_API_KEY || '',
            model: process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022',
        },
        // Google - default to gemini-2.0-flash for cost efficiency
        google: {
            apiKey: process.env.GOOGLE_API_KEY || '',
            model: process.env.GOOGLE_MODEL || 'gemini-2.0-flash',
        },
        // AWS Bedrock
        bedrock: {
            apiKey: '', // Not used for Bedrock
            model: process.env.BEDROCK_MODEL || 'anthropic.claude-3-5-sonnet-v2',
            region: process.env.AWS_REGION,
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
        // Perplexity - default to small model for cost efficiency
        perplexity: {
            apiKey: process.env.PERPLEXITY_API_KEY || '',
            model: process.env.PERPLEXITY_MODEL || 'llama-3.1-sonar-small-128k-online',
        },
        // OpenRouter - default to gpt-4o-mini via OpenRouter
        openrouter: {
            apiKey: process.env.OPENROUTER_API_KEY || '',
            model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
            siteUrl: process.env.OPENROUTER_SITE_URL,
            siteName: process.env.OPENROUTER_SITE_NAME,
        },
        ...overrides,
    };
    return new LLMClient(config);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGxtLWNsaWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9sbG0tY2xpZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQWtNQSwwQ0E4Q0M7QUFoUEQsMkNBUXFCO0FBQ3JCLG1DQUEwRDtBQUMxRCxtQ0FPaUI7QUF1QmpCOzs7Ozs7Ozs7O0dBVUc7QUFDSCxNQUFhLFNBQVM7SUFDWixRQUFRLENBQWtCO0lBQzFCLFdBQVcsQ0FBYztJQUN6QixZQUFZLENBQWM7SUFFbEMsWUFBWSxNQUF1QjtRQUNqQyxJQUFJLENBQUMsWUFBWSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUM7UUFDcEMsSUFBSSxDQUFDLFdBQVcsR0FBRyxNQUFNLENBQUMsV0FBVyxJQUFJLDBCQUFrQixDQUFDO1FBQzVELElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUM5QyxDQUFDO0lBRU8sY0FBYyxDQUFDLE1BQXVCO1FBQzVDLFFBQVEsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ3hCLEtBQUssUUFBUTtnQkFDWCxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO29CQUNuQixNQUFNLElBQUksS0FBSyxDQUFDLCtCQUErQixDQUFDLENBQUM7Z0JBQ25ELENBQUM7Z0JBQ0QsT0FBTyxJQUFJLDBCQUFjLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBRTNDLEtBQUssV0FBVztnQkFDZCxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDO29CQUN0QixNQUFNLElBQUksS0FBSyxDQUFDLGtDQUFrQyxDQUFDLENBQUM7Z0JBQ3RELENBQUM7Z0JBQ0QsT0FBTyxJQUFJLDZCQUFpQixDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUVqRCxLQUFLLFFBQVE7Z0JBQ1gsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQztvQkFDbkIsTUFBTSxJ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QUNWLE1BQU0sRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixJQUFJLEVBQUU7WUFDNUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLElBQUksb0JBQW9CO1lBQzNELE9BQU8sRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQjtZQUN4QyxRQUFRLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0I7U0FDM0M7UUFDRCxHQUFHLFNBQVM7S0FDYixDQUFDO0lBRUYsT0FBTyxJQUFJLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUMvQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgQmFzZUxMTVByb3ZpZGVyLFxuICBPcGVuQUlQcm92aWRlcixcbiAgQW50aHJvcGljUHJvdmlkZXIsXG4gIEdvb2dsZVByb3ZpZGVyLFxuICBCZWRyb2NrUHJvdmlkZXIsXG4gIFBlcnBsZXhpdHlQcm92aWRlcixcbiAgT3BlblJvdXRlclByb3ZpZGVyLFxufSBmcm9tICcuL3Byb3ZpZGVycyc7XG5pbXBvcnQgeyBSYXRlTGltaXRlciwgZGVmYXVsdFJhdGVMaW1pdGVyIH0gZnJvbSAnLi91dGlscyc7XG5pbXBvcnQge1xuICBDb21wbGV0aW9uT3B0aW9ucyxcbiAgQ29tcGxldGlvblJlc3BvbnNlLFxuICBDb21wbGV0aW9uUmVxdWVzdFNjaGVtYSxcbiAgTExNUHJvdmlkZXIsXG4gIFByb3ZpZGVyQ29uZmlnLFxuICBTdHJlYW1DaHVuayxcbn0gZnJvbSAnLi90eXBlcyc7XG5cbi8qKlxuICogQ29uZmlndXJhdGlvbiBmb3IgdGhlIExMTSBjbGllbnRcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBMTE1DbGllbnRDb25maWcge1xuICBwcm92aWRlcjogTExNUHJvdmlkZXI7XG4gIG9wZW5haT86IFByb3ZpZGVyQ29uZmlnO1xuICBhbnRocm9waWM/OiBQcm92aWRlckNvbmZpZztcbiAgZ29vZ2xlPzogUHJvdmlkZXJDb25maWc7XG4gIGJlZHJvY2s/OiBQcm92aWRlckNvbmZpZyAmIHtcbiAgICByZWdpb24/OiBzdHJpbmc7XG4gICAgYWNjZXNzS2V5SWQ/OiBzdHJpbmc7XG4gICAgc2VjcmV0QWNjZXNzS2V5Pzogc3RyaW5nO1xuICB9O1xuICBwZXJwbGV4aXR5PzogUHJvdmlkZXJDb25maWc7XG4gIG9wZW5yb3V0ZXI/OiBQcm92aWRlckNvbmZpZyAmIHtcbiAgICBzaXRlVXJsPzogc3RyaW5nO1xuICAgIHNpdGVOYW1lPzogc3RyaW5nO1xuICB9O1xuICByYXRlTGltaXRlcj86IFJhdGVMaW1pdGVyO1xufVxuXG4vKipcbiAqIE1haW4gTExNIGNsaWVudCB3aXRoIHByb3ZpZGVyIGFic3RyYWN0aW9uIGFuZCByYXRlIGxpbWl0aW5nXG4gKiBcbiAqIFVzYWdlOlxuICogYGBgdHlwZXNjcmlwdFxuICogY29uc3QgY2xpZW50ID0gY3JlYXRlTExNQ2xpZW50KCk7XG4gKiBjb25zdCByZXNwb25zZSA9IGF3YWl0IGNsaWVudC5jb21wbGV0ZSh7XG4gKiAgIG1lc3NhZ2VzOiBbeyByb2xlOiAndXNlcicsIGNvbnRlbnQ6ICdIZWxsbyEnIH1dLFxuICogfSk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGNsYXNzIExMTUNsaWVudCB7XG4gIHByaXZhdGUgcHJvdmlkZXI6IEJhc2VMTE1Qcm92aWRlcjtcbiAgcHJpdmF0ZSByYXRlTGltaXRlcjogUmF0ZUxpbWl0ZXI7XG4gIHByaXZhdGUgcHJvdmlkZXJOYW1lOiBMTE1Qcm92aWRlcjtcblxuICBjb25zdHJ1Y3Rvcihjb25maWc6IExMTUNsaWVudENvbmZpZykge1xuICAgIHRoaXMucHJvdmlkZXJOYW1lID0gY29uZmlnLnByb3ZpZGVyO1xuICAgIHRoaXMucmF0ZUxpbWl0ZXIgPSBjb25maWcucmF0ZUxpbWl0ZXIgfHwgZGVmYXVsdFJhdGVMaW1pdGVyO1xuICAgIHRoaXMucHJvdmlkZXIgPSB0aGlzLmNyZWF0ZVByb3ZpZGVyKGNvbmZpZyk7XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZVByb3ZpZGVyKGNvbmZpZzogTExNQ2xpZW50Q29uZmlnKTogQmFzZUxMTVByb3ZpZGVyIHtcbiAgICBzd2l0Y2ggKGNvbmZpZy5wcm92aWRlcikge1xuICAgICAgY2FzZSAnb3BlbmFpJzpcbiAgICAgICAgaWYgKCFjb25maWcub3BlbmFpKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdPcGVuQUkgY29uZmlndXJhdGlvbiByZXF1aXJlZCcpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXcgT3BlbkFJUHJvdmlkZXIoY29uZmlnLm9wZW5haSk7XG5cbiAgICAgIGNhc2UgJ2FudGhyb3BpYyc6XG4gICAgICAgIGlmICghY29uZmlnLmFudGhyb3BpYykge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQW50aHJvcGljIGNvbmZpZ3VyYXRpb24gcmVxdWlyZWQnKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3IEFudGhyb3BpY1Byb3ZpZGVyKGNvbmZpZy5hbnRocm9waWMpO1xuXG4gICAgICBjYXNlICdnb29nbGUnOlxuICAgICAgICBpZiAoIWNvbmZpZy5nb29nbGUpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0dvb2dsZSBjb25maWd1cmF0aW9uIHJlcXVpcmVkJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ldyBHb29nbGVQcm92aWRlcihjb25maWcuZ29vZ2xlKTtcblxuICAgICAgY2FzZSAnYmVkcm9jayc6XG4gICAgICAgIGlmICghY29uZmlnLmJlZHJvY2spIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0JlZHJvY2sgY29uZmlndXJhdGlvbiByZXF1aXJlZCcpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXcgQmVkcm9ja1Byb3ZpZGVyKGNvbmZpZy5iZWRyb2NrLCB7XG4gICAgICAgICAgcmVnaW9uOiBjb25maWcuYmVkcm9jay5yZWdpb24sXG4gICAgICAgICAgYWNjZXNzS2V5SWQ6IGNvbmZpZy5iZWRyb2NrLmFjY2Vzc0tleUlkLFxuICAgICAgICAgIHNlY3JldEFjY2Vzc0tleTogY29uZmlnLmJlZHJvY2suc2VjcmV0QWNjZXNzS2V5LFxuICAgICAgICB9KTtcblxuICAgICAgY2FzZSAncGVycGxleGl0eSc6XG4gICAgICAgIGlmICghY29uZmlnLnBlcnBsZXhpdHkpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1BlcnBsZXhpdHkgY29uZmlndXJhdGlvbiByZXF1aXJlZCcpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXcgUGVycGxleGl0eVByb3ZpZGVyKGNvbmZpZy5wZXJwbGV4aXR5KTtcblxuICAgICAgY2FzZSAnb3BlbnJvdXRlcic6XG4gICAgICAgIGlmICghY29uZmlnLm9wZW5yb3V0ZXIpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ09wZW5Sb3V0ZXIgY29uZmlndXJhdGlvbiByZXF1aXJlZCcpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXcgT3BlblJvdXRlclByb3ZpZGVyKGNvbmZpZy5vcGVucm91dGVyLCB7XG4gICAgICAgICAgc2l0ZVVybDogY29uZmlnLm9wZW5yb3V0ZXIuc2l0ZVVybCxcbiAgICAgICAgICBzaXRlTmFtZTogY29uZmlnLm9wZW5yb3V0ZXIuc2l0ZU5hbWUsXG4gICAgICAgIH0pO1xuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gcHJvdmlkZXI6ICR7Y29uZmlnLnByb3ZpZGVyfWApO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZSBhIGNvbXBsZXRpb24gd2l0aCByYXRlIGxpbWl0aW5nIGFuZCB2YWxpZGF0aW9uXG4gICAqL1xuICBhc3luYyBjb21wbGV0ZShvcHRpb25zOiBDb21wbGV0aW9uT3B0aW9ucyk6IFByb21pc2U8Q29tcGxldGlvblJlc3BvbnNlPiB7XG4gICAgLy8gVmFsaWRhdGUgaW5wdXRcbiAgICBjb25zdCB2YWxpZGF0ZWQgPSBDb21wbGV0aW9uUmVxdWVzdFNjaGVtYS5wYXJzZShvcHRpb25zKTtcblxuICAgIC8vIENoZWNrIHJhdGUgbGltaXRcbiAgICBjb25zdCB1c2VySWQgPSBvcHRpb25zLnVzZXJJZCB8fCAnYW5vbnltb3VzJztcbiAgICBjb25zdCBlc3RpbWF0ZWRUb2tlbnMgPSB0aGlzLmVzdGltYXRlSW5wdXRUb2tlbnMob3B0aW9ucy5tZXNzYWdlcyk7XG4gICAgY29uc3QgcmF0ZUxpbWl0Q2hlY2sgPSB0aGlzLnJhdGVMaW1pdGVyLmNoZWNrKHVzZXJJZCwgZXN0aW1hdGVkVG9rZW5zKTtcblxuICAgIGlmICghcmF0ZUxpbWl0Q2hlY2suYWxsb3dlZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgUmF0ZSBsaW1pdCBleGNlZWRlZDogJHtyYXRlTGltaXRDaGVjay5yZWFzb259LiBSZXNldCBpbiAke01hdGguY2VpbChyYXRlTGltaXRDaGVjay5yZXNldEluIC8gMTAwMCl9c2BcbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gTWFrZSB0aGUgcmVxdWVzdFxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5wcm92aWRlci5jb21wbGV0ZSh2YWxpZGF0ZWQpO1xuXG4gICAgLy8gUmVjb3JkIHVzYWdlXG4gICAgdGhpcy5yYXRlTGltaXRlci5yZWNvcmQodXNlcklkLCByZXNwb25zZS51c2FnZS50b3RhbFRva2Vucyk7XG5cbiAgICByZXR1cm4gcmVzcG9uc2U7XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdGUgYSBzdHJlYW1pbmcgY29tcGxldGlvbiB3aXRoIHJhdGUgbGltaXRpbmdcbiAgICovXG4gIGFzeW5jICpzdHJlYW0oXG4gICAgb3B0aW9uczogQ29tcGxldGlvbk9wdGlvbnNcbiAgKTogQXN5bmNHZW5lcmF0b3I8U3RyZWFtQ2h1bmssIHZvaWQsIHVua25vd24+IHtcbiAgICAvLyBWYWxpZGF0ZSBpbnB1dFxuICAgIGNvbnN0IHZhbGlkYXRlZCA9IENvbXBsZXRpb25SZXF1ZXN0U2NoZW1hLnBhcnNlKG9wdGlvbnMpO1xuXG4gICAgLy8gQ2hlY2sgcmF0ZSBsaW1pdFxuICAgIGNvbnN0IHVzZXJJZCA9IG9wdGlvbnMudXNlcklkIHx8ICdhbm9ueW1vdXMnO1xuICAgIGNvbnN0IGVzdGltYXRlZFRva2VucyA9IHRoaXMuZXN0aW1hdGVJbnB1dFRva2VucyhvcHRpb25zLm1lc3NhZ2VzKTtcbiAgICBjb25zdCByYXRlTGltaXRDaGVjayA9IHRoaXMucmF0ZUxpbWl0ZXIuY2hlY2sodXNlcklkLCBlc3RpbWF0ZWRUb2tlbnMpO1xuXG4gICAgaWYgKCFyYXRlTGltaXRDaGVjay5hbGxvd2VkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIGBSYXRlIGxpbWl0IGV4Y2VlZGVkOiAke3JhdGVMaW1pdENoZWNrLnJlYXNvbn0uIFJlc2V0IGluICR7TWF0aC5jZWlsKHJhdGVMaW1pdENoZWNrLnJlc2V0SW4gLyAxMDAwKX1zYFxuICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyBSZWNvcmQgcmVxdWVzdCAod2UnbGwgZXN0aW1hdGUgb3V0cHV0IHRva2VucylcbiAgICB0aGlzLnJhdGVMaW1pdGVyLnJlY29yZCh1c2VySWQsIGVzdGltYXRlZFRva2Vucyk7XG5cbiAgICAvLyBTdHJlYW0gdGhlIHJlc3BvbnNlXG4gICAgeWllbGQqIHRoaXMucHJvdmlkZXIuc3RyZWFtKHZhbGlkYXRlZCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBjdXJyZW50IHByb3ZpZGVyIG5hbWVcbiAgICovXG4gIGdldFByb3ZpZGVyKCk6IExMTVByb3ZpZGVyIHtcbiAgICByZXR1cm4gdGhpcy5wcm92aWRlck5hbWU7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBjdXJyZW50IG1vZGVsXG4gICAqL1xuICBnZXRNb2RlbCgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLnByb3ZpZGVyLmdldE1vZGVsKCk7XG4gIH1cblxuICBwcml2YXRlIGVzdGltYXRlSW5wdXRUb2tlbnMobWVzc2FnZXM6IHsgY29udGVudDogc3RyaW5nIH1bXSk6IG51bWJlciB7XG4gICAgcmV0dXJuIG1lc3NhZ2VzLnJlZHVjZShcbiAgICAgIChzdW0sIG0pID0+IHN1bSArIHRoaXMucHJvdmlkZXIuZXN0aW1hdGVUb2tlbnMobS5jb250ZW50KSxcbiAgICAgIDBcbiAgICApO1xuICB9XG59XG5cbi8qKlxuICogQ3JlYXRlIGFuIExMTSBjbGllbnQgZnJvbSBlbnZpcm9ubWVudCB2YXJpYWJsZXNcbiAqIFxuICogRGVmYXVsdCBtb2RlbHMgYXJlIHNldCB0byBjb3N0LWVmZmVjdGl2ZSBvcHRpb25zIGZvciBkZXZlbG9wbWVudC5cbiAqIENoYW5nZSB2aWEgZW52aXJvbm1lbnQgdmFyaWFibGVzIGZvciBwcm9kdWN0aW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTExNQ2xpZW50KG92ZXJyaWRlcz86IFBhcnRpYWw8TExNQ2xpZW50Q29uZmlnPik6IExMTUNsaWVudCB7XG4gIGNvbnN0IHByb3ZpZGVyID0gKG92ZXJyaWRlcz8ucHJvdmlkZXIgfHxcbiAgICBwcm9jZXNzLmVudi5MTE1fUFJPVklERVIgfHxcbiAgICAnb3BlbmFpJykgYXMgTExNUHJvdmlkZXI7XG5cbiAgY29uc3QgY29uZmlnOiBMTE1DbGllbnRDb25maWcgPSB7XG4gICAgcHJvdmlkZXIsXG4gICAgLy8gT3BlbkFJIC0gZGVmYXVsdCB0byBncHQtNG8tbWluaSBmb3IgY29zdCBlZmZpY2llbmN5XG4gICAgb3BlbmFpOiB7XG4gICAgICBhcGlLZXk6IHByb2Nlc3MuZW52Lk9QRU5BSV9BUElfS0VZIHx8ICcnLFxuICAgICAgbW9kZWw6IHByb2Nlc3MuZW52Lk9QRU5BSV9NT0RFTCB8fCAnZ3B0LTRvLW1pbmknLFxuICAgIH0sXG4gICAgLy8gQW50aHJvcGljIC0gZGVmYXVsdCB0byBjbGF1ZGUtMy01LWhhaWt1IGZvciBjb3N0IGVmZmljaWVuY3lcbiAgICBhbnRocm9waWM6IHtcbiAgICAgIGFwaUtleTogcHJvY2Vzcy5lbnYuQU5USFJPUElDX0FQSV9LRVkgfHwgJycsXG4gICAgICBtb2RlbDogcHJvY2Vzcy5lbnYuQU5USFJPUElDX01PREVMIHx8ICdjbGF1ZGUtMy01LWhhaWt1LTIwMjQxMDIyJyxcbiAgICB9LFxuICAgIC8vIEdvb2dsZSAtIGRlZmF1bHQgdG8gZ2VtaW5pLTIuMC1mbGFzaCBmb3IgY29zdCBlZmZpY2llbmN5XG4gICAgZ29vZ2xlOiB7XG4gICAgICBhcGlLZXk6IHByb2Nlc3MuZW52LkdPT0dMRV9BUElfS0VZIHx8ICcnLFxuICAgICAgbW9kZWw6IHByb2Nlc3MuZW52LkdPT0dMRV9NT0RFTCB8fCAnZ2VtaW5pLTIuMC1mbGFzaCcsXG4gICAgfSxcbiAgICAvLyBBV1MgQmVkcm9ja1xuICAgIGJlZHJvY2s6IHtcbiAgICAgIGFwaUtleTogJycsIC8vIE5vdCB1c2VkIGZvciBCZWRyb2NrXG4gICAgICBtb2RlbDogcHJvY2Vzcy5lbnYuQkVEUk9DS19NT0RFTCB8fCAnYW50aHJvcGljLmNsYXVkZS0zLTUtc29ubmV0LXYyJyxcbiAgICAgIHJlZ2lvbjogcHJvY2Vzcy5lbnYuQVdTX1JFR0lPTixcbiAgICAgIGFjY2Vzc0tleUlkOiBwcm9jZXNzLmVudi5BV1NfQUNDRVNTX0tFWV9JRCxcbiAgICAgIHNlY3JldEFjY2Vzc0tleTogcHJvY2Vzcy5lbnYuQVdTX1NFQ1JFVF9BQ0NFU1NfS0VZLFxuICAgIH0sXG4gICAgLy8gUGVycGxleGl0eSAtIGRlZmF1bHQgdG8gc21hbGwgbW9kZWwgZm9yIGNvc3QgZWZmaWNpZW5jeVxuICAgIHBlcnBsZXhpdHk6IHtcbiAgICAgIGFwaUtleTogcHJvY2Vzcy5lbnYuUEVSUExFWElUWV9BUElfS0VZIHx8ICcnLFxuICAgICAgbW9kZWw6IHByb2Nlc3MuZW52LlBFUlBMRVhJVFlfTU9ERUwgfHwgJ2xsYW1hLTMuMS1zb25hci1zbWFsbC0xMjhrLW9ubGluZScsXG4gICAgfSxcbiAgICAvLyBPcGVuUm91dGVyIC0gZGVmYXVsdCB0byBncHQtNG8tbWluaSB2aWEgT3BlblJvdXRlclxuICAgIG9wZW5yb3V0ZXI6IHtcbiAgICAgIGFwaUtleTogcHJvY2Vzcy5lbnYuT1BFTlJPVVRFUl9BUElfS0VZIHx8ICcnLFxuICAgICAgbW9kZWw6IHByb2Nlc3MuZW52Lk9QRU5ST1VURVJfTU9ERUwgfHwgJ29wZW5haS9ncHQtNG8tbWluaScsXG4gICAgICBzaXRlVXJsOiBwcm9jZXNzLmVudi5PUEVOUk9VVEVSX1NJVEVfVVJMLFxuICAgICAgc2l0ZU5hbWU6IHByb2Nlc3MuZW52Lk9QRU5ST1VURVJfU0lURV9OQU1FLFxuICAgIH0sXG4gICAgLi4ub3ZlcnJpZGVzLFxuICB9O1xuXG4gIHJldHVybiBuZXcgTExNQ2xpZW50KGNvbmZpZyk7XG59XG4iXX0=