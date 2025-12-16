# Instructions for Manus

This document provides instructions for Manus on how to work on this project.

## 1. Project Overview

This is a Next.js application with Supabase backend and LLM integration. Before starting any work, review the `openspec/project.md` file to understand the project goals and technology stack.

**Key characteristics:**
- Next.js 14 with App Router
- Supabase for authentication and database
- Multi-provider LLM support (OpenAI, Anthropic, Google, Perplexity, OpenRouter, Bedrock)
- Rate limiting and streaming support
- Core LLM logic in `packages/engine/` (protected IP)

## 2. Project Initialization Workflow

When initializing a new project from this template, follow these steps in order:

### Step 1: Clone Templates Repository (if not already present)

```bash
cd /home/ubuntu
if [ ! -d "manus-project-templates" ]; then
  gh repo clone kenziecreative/manus-project-templates
fi
```

### Step 2: Create New GitHub Repository

```bash
# Create new repo under kenziecreative org
gh repo create kenziecreative/[project-name] --public --description "[Project description]" --clone
cd /home/ubuntu/[project-name]
```

### Step 3: Copy Template Files

```bash
# Copy all template files to the new repo
cp -r /home/ubuntu/manus-project-templates/templates/nextjs-supabase-llm/* .
cp /home/ubuntu/manus-project-templates/templates/nextjs-supabase-llm/.gitignore . 2>/dev/null || true
cp /home/ubuntu/manus-project-templates/templates/nextjs-supabase-llm/.env.example . 2>/dev/null || true

# Remove workflow files that may cause permission issues
rm -rf .github/workflows
```

### Step 4: LLM Provider Selection

**Ask the user which LLM provider they want to use:**

> **LLM Provider Selection**
>
> Which LLM provider would you like to use? Consider cost vs capability:
>
> | Provider | Cheap Model (dev) | Cost (1M tokens) | Best Model |
> |----------|-------------------|------------------|------------|
> | **OpenAI** | gpt-4o-mini | $0.15 in / $0.60 out | gpt-5.2 |
> | **Anthropic** | claude-3-5-haiku | $0.25 in / $1.25 out | claude-opus-4.5 |
> | **Google** | gemini-2.0-flash | $0.075 in / $0.30 out | gemini-3-pro |
> | **Perplexity** | sonar-small | varies | sonar-huge |
> | **OpenRouter** | varies | see openrouter.ai | many models |
> | **Bedrock** | varies | AWS pricing | enterprise |
>
> Which provider? And which model tier (cheap for dev, or specific model)?

**Record the user's selection:**
- Selected provider: `[provider]`
- Selected model: `[model]`

### Step 5: Create Supabase Project (via MCP)

1. **Get organization ID:**
   ```bash
   manus-mcp-cli tool call list_organizations --server supabase --input '{}'
   ```

2. **Get cost estimate:**
   ```bash
   manus-mcp-cli tool call get_cost --server supabase --input '{"type": "project", "organization_id": "[org-id]"}'
   ```

3. **Confirm cost with user** - Always ask before creating:
   > **Supabase Project Cost**
   >
   > Creating a Supabase project will cost approximately $[amount]/month.
   > Do you want to proceed?

4. **After user confirms, get cost confirmation:**
   ```bash
   manus-mcp-cli tool call confirm_cost --server supabase --input '{"type": "project", "recurrence": "monthly", "amount": [cost]}'
   ```

5. **Create project:**
   ```bash
   manus-mcp-cli tool call create_project --server supabase --input '{
     "organization_id": "[org-id]",
     "confirm_cost_id": "[confirmation-id]",
     "name": "[project-name]",
     "region": "us-east-1"
   }'
   ```

6. **Wait for project to be ready** (check status):
   ```bash
   manus-mcp-cli tool call get_project --server supabase --input '{"id": "[project-id]"}'
   ```
   Repeat until status is "ACTIVE_HEALTHY".

7. **Get API keys:**
   ```bash
   manus-mcp-cli tool call get_project_url --server supabase --input '{"project_id": "[project-id]"}'
   manus-mcp-cli tool call get_publishable_keys --server supabase --input '{"project_id": "[project-id]"}'
   ```

### Step 6: Commit and Push

```bash
git add -A
git commit -m "feat: initialize project from nextjs-supabase-llm template"
git push origin main
```

### Step 7: Prompt User for Vercel Setup

After Supabase is configured, prompt the user with this exact message (customize based on their LLM provider selection):

> **Vercel Setup Required**
>
> Your repository and Supabase project are ready:
> - GitHub: https://github.com/kenziecreative/[project-name]
> - Supabase URL: `[supabase-url]`
> - LLM Provider: `[selected-provider]`
>
> Please complete the following:
>
> 1. Go to [Vercel Dashboard](https://vercel.com/new)
> 2. Click **Add New...** → **Project**
> 3. Select **Import Git Repository** and find `kenziecreative/[project-name]`
> 4. Configure:
>    - **Framework Preset**: Next.js
>    - **Root Directory**: `web`
> 5. Add Environment Variables:
>    - `NEXT_PUBLIC_SUPABASE_URL`: `[supabase-url]`
>    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `[anon-key]`
>    - `LLM_PROVIDER`: `[selected-provider]`
>    - `[PROVIDER]_API_KEY`: *You need to add your own API key*
>    - `[PROVIDER]_MODEL`: `[selected-model]`
> 6. Click **Deploy**
>
> **Important:** You'll need to add your own `[PROVIDER]_API_KEY` for the LLM provider.
>
> Let me know when the deployment is complete and share the deployment URL.

### Step 8: Verify Deployment

Once the user confirms Vercel setup:

1. Use Vercel MCP to check deployment status:
   ```bash
   manus-mcp-cli tool call list_teams --server vercel --input '{}'
   # Get team ID from response, then:
   manus-mcp-cli tool call list_projects --server vercel --input '{"teamId": "[team-id]"}'
   manus-mcp-cli tool call list_deployments --server vercel --input '{"teamId": "[team-id]", "projectId": "[project-id]"}'
   ```

2. Verify the site is accessible at the deployment URL

3. Test the chat functionality (if LLM key is configured)

4. Confirm with user:
   > **Deployment Verified!**
   >
   > Your AI-powered app is live at [deployment-url].
   >
   > - LLM Provider: [provider]
   > - Model: [model]
   > - Supabase: Connected
   >
   > The project is ready for development.

## 3. Development Workflow

### Branching Strategy

- **main**: Production-ready code
- **feat/[feature-name]**: New features
- **fix/[issue-name]**: Bug fixes

### Commits

Use conventional commit messages:
- `feat: add conversation history`
- `fix: rate limiting edge case`
- `chore: update LLM SDK`

### Pull Requests

```bash
git checkout -b feat/[feature-name]
# Make changes
git add -A
git commit -m "feat: [description]"
git push origin feat/[feature-name]
gh pr create --title "feat: [description]" --body "[Details]"
```

## 4. Supabase MCP Commands Reference

### Database Operations

```bash
# Apply a migration
manus-mcp-cli tool call apply_migration --server supabase --input '{
  "project_id": "[id]",
  "name": "create_conversations_table",
  "query": "CREATE TABLE conversations (...)"
}'

# Execute SQL
manus-mcp-cli tool call execute_sql --server supabase --input '{
  "project_id": "[id]",
  "query": "SELECT * FROM conversations LIMIT 10"
}'

# Check for security issues
manus-mcp-cli tool call get_advisors --server supabase --input '{
  "project_id": "[id]",
  "type": "security"
}'
```

### Project Management

```bash
# Get project status
manus-mcp-cli tool call get_project --server supabase --input '{"id": "[project-id]"}'

# View logs
manus-mcp-cli tool call get_logs --server supabase --input '{
  "project_id": "[id]",
  "service": "api"
}'
```

## 5. LLM Engine Usage

The `packages/engine/` contains the LLM abstraction layer:

```typescript
import { createLLMClient } from '@project/engine';

// Create client (uses env vars)
const client = createLLMClient();

// Non-streaming completion
const response = await client.complete({
  messages: [{ role: 'user', content: 'Hello!' }],
  userId: 'user-123', // For rate limiting
});

// Streaming completion
for await (const chunk of client.stream({ messages })) {
  console.log(chunk.content);
}
```

### Switching Providers

To switch providers, update environment variables:
```bash
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-5-haiku-20241022
```

## 6. Project Constraints

- **PRs Required**: All changes must go through pull requests
- **CI Must Pass**: Never merge PRs with failing CI
- **User Owns Infrastructure**: User owns GitHub, Supabase, Vercel accounts
- **User Owns API Keys**: LLM API keys are user's responsibility
- **IP Protection**: Core LLM logic stays in `packages/engine/` with unit tests
- **Rate Limiting**: Always use rate limiting for LLM endpoints
- **No Hardcoded Keys**: Never commit API keys

## 7. Useful Commands

```bash
# Install dependencies
cd packages/engine && npm install && npm run build
cd ../.. && cd web && npm install

# Local development
cd web && npm run dev

# Run engine tests
cd packages/engine && npm test

# Build for production
cd web && npm run build
```

## 8. File Structure

```
├── packages/
│   └── engine/              # LLM abstraction layer
│       ├── src/
│       │   ├── providers/   # Provider implementations
│       │   ├── utils/       # Rate limiting, helpers
│       │   └── llm-client.ts
│       └── __tests__/       # Unit tests
├── web/
│   ├── app/
│   │   ├── api/chat/        # Chat API endpoint
│   │   └── page.tsx         # Demo chat UI
│   └── lib/
│       └── use-chat.ts      # Client-side hook
└── supabase/                # Database migrations
```
