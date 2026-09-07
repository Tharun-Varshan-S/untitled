/**
 * Masks secrets in log messages to prevent accidental leakage in internal logs.
 * Replaces credentials, API keys, and tokens with a redaction marker.
 *
 * @param message The raw log message or object
 * @returns The sanitized message
 */
export function sanitizeLogOutput(message: any): string {
  if (message === null || message === undefined) return String(message);

  let strMessage = typeof message === 'string' ? message : JSON.stringify(message);

  // Mask common API key patterns (e.g., Bearer tokens, typical key formats)
  // Bearer tokens
  strMessage = strMessage.replace(/Bearer\s+[A-Za-z0-9\-\._~+\/]+=*/gi, 'Bearer [REDACTED]');
  
  // Generic secrets (api_key=..., secret=...)
  strMessage = strMessage.replace(/(api_?key|secret|token|password)[\s:=]+['"]?[A-Za-z0-9\-\._]+['"]?/gi, '$1=[REDACTED]');

  // Groq / OpenAI keys
  strMessage = strMessage.replace(/gsk_[A-Za-z0-9]{20,}/g, '[GROQ_KEY_REDACTED]');
  strMessage = strMessage.replace(/sk-[A-Za-z0-9]{20,}/g, '[OAI_KEY_REDACTED]');

  return strMessage;
}
