import dotenv from 'dotenv';
dotenv.config();

// Extract API key directly from environment variables.
// Do not hardcode or log this value.
const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY) {
  // Fail fast on startup if the API key is missing
  throw new Error('CRITICAL: GROQ_API_KEY is not set in the environment variables.');
}

/**
 * Configuration object for the Groq AI service.
 * Centralizes magic values like model names and timeouts.
 */
export const groqConfig = {
  apiKey: GROQ_API_KEY,
  // We use a fast Groq model for structure output, e.g. llama-3.1-8b-instant or mixtral-8x7b-32768
  model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
  // Max retries for the Groq client connection itself
  maxRetries: 3,
  // Timeout in milliseconds to ensure jobs don't hang indefinitely (15 seconds)
  timeoutMs: 15000,
};
