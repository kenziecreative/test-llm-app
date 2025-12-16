import { NextRequest, NextResponse } from 'next/server';
import { createLLMClient, CompletionRequestSchema } from '@project/engine';

// Initialize the LLM client (server-side only)
const llmClient = createLLMClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validatedRequest = CompletionRequestSchema.safeParse(body);
    if (!validatedRequest.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validatedRequest.error.errors },
        { status: 400 }
      );
    }

    const { messages, stream, maxTokens, temperature, userId } = validatedRequest.data;

    // Check for streaming request
    if (stream) {
      // Create a streaming response
      const encoder = new TextEncoder();
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of llmClient.stream({
              messages,
              maxTokens,
              temperature,
              userId,
            })) {
              // Send Server-Sent Events format
              const data = JSON.stringify({ content: chunk.content, done: chunk.done });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));

              if (chunk.done) {
                controller.close();
              }
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Stream error';
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`)
            );
            controller.close();
          }
        },
      });

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    // Non-streaming request
    const response = await llmClient.complete({
      messages,
      maxTokens,
      temperature,
      userId,
    });

    return NextResponse.json({
      content: response.content,
      model: response.model,
      provider: response.provider,
      usage: response.usage,
    });
  } catch (error) {
    console.error('Chat API error:', error);

    // Handle rate limit errors
    if (error instanceof Error && error.message.includes('Rate limit')) {
      return NextResponse.json(
        { error: error.message },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    provider: llmClient.getProvider(),
    model: llmClient.getModel(),
  });
}
