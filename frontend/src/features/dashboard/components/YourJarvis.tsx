'use client';

import { useState } from 'react';
import { useChat, ChatResponse } from '@/hooks/useChat';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  metadata?: ChatResponse;
}

export function YourJarvis({ projectId }: { projectId: string }) {
  const { sendMessage, isLoading, error } = useChat(projectId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    const response = await sendMessage(input);
    
    if (response) {
      const assistantMessage: Message = { 
        role: 'assistant', 
        content: response.answer,
        metadata: response 
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[600px] border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--surface))] overflow-hidden">
      {/* Header */}
      <div className="flex-none p-4 border-b border-[hsl(var(--border))] bg-[hsl(var(--surface-hover))]">
        <h2 className="text-lg font-semibold text-[hsl(var(--text-primary))] flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          Your Jarvis
        </h2>
        <p className="text-sm text-[hsl(var(--text-muted))]">Ask anything about your project or troubleshoot recent logs.</p>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-[hsl(var(--text-muted))]">
            <svg className="w-12 h-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
            <p>I am Your Jarvis. How can I assist you with your logs today?</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div 
                className={`max-w-[80%] rounded-lg p-4 ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600/20 border border-indigo-500/30 text-[hsl(var(--text-primary))]'
                    : 'bg-[hsl(var(--surface-hover))] border border-[hsl(var(--border))] text-[hsl(var(--text-secondary))]'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
              
              {/* AI Metadata Card */}
              {msg.metadata && (
                <div className="mt-2 p-3 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-md text-xs text-[hsl(var(--text-muted))] max-w-[80%] flex flex-wrap gap-x-4 gap-y-2">
                  <div className="flex items-center gap-1"><span className="font-semibold text-[hsl(var(--text-secondary))]">Provider:</span> {msg.metadata.provider}</div>
                  <div className="flex items-center gap-1"><span className="font-semibold text-[hsl(var(--text-secondary))]">Model:</span> {msg.metadata.model}</div>
                  <div className="flex items-center gap-1"><span className="font-semibold text-[hsl(var(--text-secondary))]">Latency:</span> {msg.metadata.latency}ms</div>
                  <div className="flex items-center gap-1"><span className="font-semibold text-[hsl(var(--text-secondary))]">Tokens:</span> {msg.metadata.tokenUsage.total_tokens}</div>
                </div>
              )}
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex items-start">
            <div className="max-w-[80%] rounded-lg p-4 bg-[hsl(var(--surface-hover))] border border-[hsl(var(--border))]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start">
            <div className="max-w-[80%] rounded-lg p-4 bg-red-900/20 border border-red-500/30 text-red-400">
              <div className="flex items-center gap-2 font-semibold mb-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                AI temporarily unavailable
              </div>
              <div className="text-sm">{error}</div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="flex-none p-4 border-t border-[hsl(var(--border))] bg-[hsl(var(--surface-hover))]">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Your Jarvis about recent errors or logs (Press Enter to send)..."
            className="w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg py-3 pl-4 pr-12 text-[hsl(var(--text-primary))] placeholder-[hsl(var(--text-muted))] focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none h-14"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-2 p-2 rounded-md bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
