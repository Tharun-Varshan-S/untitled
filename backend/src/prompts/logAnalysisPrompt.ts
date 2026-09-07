import Groq from 'groq-sdk';
import { compressStackTrace } from '../utils/stackTraceCompressor';
import { LogDocument } from '../models/Log'; // Assuming we have the document type

// The exact JSON schema we require the model to output.
const OUTPUT_SCHEMA = `
{
  "summary": "Brief 1-2 sentence description of what happened",
  "severity": "info | warn | error | fatal",
  "rootCause": "Likely technical root cause (be specific)",
  "suggestedFix": "Actionable steps to resolve the issue",
  "confidence": 0.95 // Number between 0 and 1 indicating how confident you are in this analysis
}
`;

/**
 * Sanitizes untrusted log content to prevent prompt injection.
 * Strips instruction-like phrases so the LLM doesn't get tricked.
 */
function sanitizeLogContent(content: string): string {
  if (!content) return '';
  // Basic prompt injection guard: neutralize phrases like "ignore previous instructions"
  return content.replace(/(ignore|forget|disregard).*instructions/gi, '[SANITIZED]');
}

/**
 * Builds the prompt messages array for analyzing a log.
 * Instructs the AI to output strictly valid JSON.
 * 
 * @param logEntry The raw log object to analyze
 * @returns An array of messages ready to be sent to Groq
 */
export function buildLogAnalysisPrompt(logEntry: Partial<LogDocument>): any[] {
  const sanitizedMessage = sanitizeLogContent(logEntry.message || '');
  let processedMetadata = '';
  
  // Attempt to parse/compress stack traces if present in metadata
  if (logEntry.metadata && typeof logEntry.metadata === 'object') {
    const metaObj = logEntry.metadata as any;
    if (metaObj.stack) {
      metaObj.stack = compressStackTrace(String(metaObj.stack));
    }
    // Truncate overly long metadata to ~2000 chars to avoid blowing up the context window
    const stringified = JSON.stringify(metaObj, null, 2);
    processedMetadata = stringified.length > 2000 
      ? stringified.substring(0, 2000) + '\n...[TRUNCATED]' 
      : stringified;
  }

  const userPromptContent = `
Analyze the following log entry and provide a structured JSON response.

LOG DETAILS:
Level: ${logEntry.level || 'unknown'}
Service: ${logEntry.service || 'unknown'}
Message: ${sanitizedMessage}
Metadata: ${processedMetadata || 'none'}
`;

  return [
    {
      role: 'system',
      content: `You are an expert site reliability engineer (SRE). 
Your task is to analyze application logs to determine the root cause of issues and provide actionable fixes.
You MUST output ONLY valid JSON matching the following schema. Do NOT include markdown formatting, code blocks (like \`\`\`json), or any explanatory text. Just the raw JSON object.

SCHEMA:
${OUTPUT_SCHEMA}
`,
    },
    {
      role: 'user',
      content: userPromptContent,
    }
  ];
}
