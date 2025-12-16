# Next.js + Supabase + LLM Template

A production-ready template for building AI-powered applications with multi-provider LLM support.

## Features

- **6 LLM Providers**: OpenAI, Anthropic, Google Gemini, Perplexity, OpenRouter, AWS Bedrock
- **Unified API**: Single interface for all providers with streaming support
- **Cost-Optimized Defaults**: Development-friendly model defaults to avoid expensive API bills
- **Rate Limiting**: Built-in request and token rate limiting
- **Server-Side Protection**: API keys protected in `packages/engine/`
- **Supabase Integration**: Authentication and database ready
- **TypeScript**: Full type safety throughout

## Project Structure

```
├── openspec/              # OpenSpec requirements
├── packages/
│   └── engine/            # Server-side LLM engine (protected IP)
│       ├── src/
│       │   ├── providers/ # LLM provider implementations
│       │   ├── utils/     # Rate limiting, helpers
│       │   └── index.ts   # Main exports
│       └── __tests__/     # Unit tests
├── web/                   # Next.js application
│   ├── app/
│   │   ├── api/chat/      # Chat API endpoint
│   │   └── page.tsx       # Demo chat UI
│   └── lib/
│       └── use-chat.ts    # Client-side chat hook
└── vercel.json            # Deployment configuration
```

## Quick Start

1. **Install dependencies**:
   ```bash
   cd packages/engine && npm install && npm run build
   cd ../../web && npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local - set LLM_PROVIDER and the corresponding API key
   ```

3. **Run development server**:
   ```bash
   cd web && npm run dev
   ```

## LLM Provider Selection

### Cost Comparison (per 1M tokens)

| Provider | Cheap Model | Cost (in/out) | Balanced Model | Cost (in/out) | Best Model |
|----------|-------------|---------------|----------------|---------------|------------|
| **OpenAI** | gpt-4o-mini | $0.15/$0.60 | gpt-4o | $2.50/$10 | gpt-5.2 |
| **Anthropic** | claude-3-5-haiku | $0.25/$1.25 | claude-3-5-sonnet | $3/$15 | claude-opus-4.5 |
| **Google** | gemini-2.0-flash | $0.075/$0.30 | gemini-1.5-pro | $1.25/$5 | gemini-3-pro |
| **Perplexity** | sonar-small | varies | sonar-large | varies | sonar-huge |
| **OpenRouter** | varies by model | see openrouter.ai | - | - | - |
| **Bedrock** | varies | AWS pricing | - | - | - |

### Recommended Setup

**For Development:**
- Use cheap models to avoid burning through credits
- Default configuration uses cost-effective models

**For Production:**
- Upgrade to balanced or best models based on quality needs
- Configure rate limits appropriately

### Configuration

Set `LLM_PROVIDER` and the corresponding API key in `.env.local`:

```bash
# Example: Using OpenAI
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini  # or gpt-4o for better quality

# Example: Using Anthropic
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-5-haiku-20241022

# Example: Using Google
LLM_PROVIDER=google
GOOGLE_API_KEY=...
GOOGLE_MODEL=gemini-2.0-flash

# Example: Using OpenRouter (access to many models)
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=...
OPENROUTER_MODEL=openai/gpt-4o-mini
```

## API Usage

### Chat Endpoint

```typescript
// POST /api/chat
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Hello!' }],
    stream: true,
  }),
});
```

### Using the Engine Directly

```typescript
import { createLLMClient } from '@project/engine';

const client = createLLMClient();

// Non-streaming
const response = await client.complete({
  messages: [{ role: 'user', content: 'Hello!' }],
});

// Streaming
for await (const chunk of client.stream({ messages })) {
  console.log(chunk.content);
}
```

## Rate Limiting

Configure via environment variables:

- `LLM_RATE_LIMIT_REQUESTS`: Max requests per window (default: 100)
- `LLM_RATE_LIMIT_WINDOW_MS`: Window duration in ms (default: 60000)
- `LLM_MAX_TOKENS_PER_REQUEST`: Max tokens per request (default: 4096)

## Testing

```bash
cd packages/engine
npm test
```

## Deployment

1. Push to GitHub
2. Import to Vercel
3. Set `LLM_PROVIDER` and API keys in Vercel environment variables
4. Deploy

## Security Notes

- API keys are never exposed to the client
- All LLM calls go through server-side API routes
- Rate limiting prevents abuse
- Input validation with Zod schemas
