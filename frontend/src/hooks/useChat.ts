import { useState, useCallback } from 'react';
import { fetchApi } from '@/lib/api';

export interface ChatResponse {
  success: boolean;
  answer: string;
  provider: string;
  model: string;
  latency: number;
  tokenUsage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export const useChat = (projectId: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (question: string): Promise<ChatResponse | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetchApi<ChatResponse>(`/projects/${projectId}/chat`, {
          method: 'POST',
          body: JSON.stringify({ question }),
        });
        
        return response;
      } catch (err: any) {
        const message = err.message || 'An unexpected error occurred while communicating with AI Copilot.';
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [projectId]
  );

  return { sendMessage, isLoading, error };
};
