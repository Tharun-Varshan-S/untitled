import Groq from 'groq-sdk';
import { groqConfig } from '../config/groq';

/**
 * Singleton Groq client instance.
 * Reusing a single client is more efficient than instantiating per-call.
 */
export const aiClient = new Groq({
  apiKey: groqConfig.apiKey,
  maxRetries: groqConfig.maxRetries,
  timeout: groqConfig.timeoutMs,
});

/**
 * AI Service encapsulating calls to the Groq API.
 * Keeps external dependencies isolated from business logic.
 */
export const aiService = {
  /**
   * Generates a completion from the Groq model.
   * @param messages The array of chat messages to send to the model.
   * @param responseFormat Optional format (e.g., json_object)
   * @returns The text response from the model
   */
  async generateCompletion(
    messages: any[],
    responseFormat: { type: 'text' | 'json_object' } = { type: 'json_object' }
  ): Promise<string> {
    const response = await aiClient.chat.completions.create({
      model: groqConfig.model,
      messages: messages,
      response_format: responseFormat,
      temperature: 0.1, // Low temperature for more deterministic/structured responses
    });

    // Ensure we return the generated text content
    return response.choices[0]?.message?.content || '{}';
  },
};
