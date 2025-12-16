'use client';

import { useChat } from '@/lib/use-chat';
import { FormEvent, useRef, useEffect } from 'react';

export default function Home() {
  const { messages, input, setInput, isLoading, error, sendMessage, clearMessages } =
    useChat({
      onError: (err) => console.error('Chat error:', err),
    });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await sendMessage();
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8">
      <div className="w-full max-w-3xl flex flex-col h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b">
          <div>
            <h1 className="text-2xl font-bold">AI Chat</h1>
            <p className="text-sm text-gray-500">
              Powered by multi-provider LLM engine
            </p>
          </div>
          <button
            onClick={clearMessages}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Clear Chat
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-400 py-12">
              <p className="text-lg mb-2">Start a conversation</p>
              <p className="text-sm">
                This template supports OpenAI, Anthropic, Google Gemini, and AWS Bedrock
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                {message.role === 'assistant' && !message.content && isLoading && (
                  <span className="inline-block animate-pulse">▊</span>
                )}
              </div>
            </div>
          ))}

          {error && (
            <div className="text-center text-red-500 py-2">
              <p className="text-sm">Error: {error.message}</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t text-center text-xs text-gray-400">
          <p>
            Configure your LLM provider in <code>.env.local</code> using{' '}
            <code>LLM_PROVIDER</code>
          </p>
        </div>
      </div>
    </main>
  );
}
