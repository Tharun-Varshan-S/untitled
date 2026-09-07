import { z } from 'zod';
import { logger } from '../utils/logger';

// Define the exact schema we expect from the LLM
export const AiAnalysisSchema = z.object({
  summary: z.string().min(1),
  severity: z.enum(['info', 'warn', 'error', 'fatal']),
  rootCause: z.string().min(1),
  suggestedFix: z.string().min(1),
  confidence: z.number().min(0).max(1),
});

export type AiAnalysisOutput = z.infer<typeof AiAnalysisSchema>;

/**
 * Strips markdown code fences from a string if they exist.
 * LLMs often wrap JSON in ```json ... ``` blocks despite instructions.
 */
function stripMarkdownFences(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    // Remove the first line (e.g. ```json)
    const firstNewline = cleaned.indexOf('\n');
    if (firstNewline !== -1) {
      cleaned = cleaned.substring(firstNewline + 1);
    }
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3).trim();
  }
  return cleaned;
}

/**
 * Parses and validates the raw text response from the AI.
 *
 * @param rawResponse The raw string returned by the Groq AI API
 * @returns The validated and typed object
 * @throws Error if parsing or validation fails
 */
export function validateAiResponse(rawResponse: string): AiAnalysisOutput {
  try {
    const cleaned = stripMarkdownFences(rawResponse);
    const parsedJson = JSON.parse(cleaned);
    
    // Zod will throw an error if the structure doesn't match
    return AiAnalysisSchema.parse(parsedJson);
  } catch (error) {
    logger.error(`[AI Validator] Failed to validate AI response. Raw: ${rawResponse.substring(0, 200)}... Error: ${error}`);
    throw new Error('Invalid AI Response format');
  }
}
