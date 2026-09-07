import crypto from 'crypto';

/**
 * Generates a deterministic hash from log content to identify duplicates.
 * Strips out volatile fields (timestamps, request IDs, etc.) so semantically
 * identical errors hash to the same value.
 *
 * @param level The log level
 * @param message The raw log message
 * @param stack The stack trace (if any)
 * @returns A SHA-256 hash string
 */
export function generateLogHash(level: string, message: string, stack?: string): string {
  // Normalize message: remove timestamps, UUIDs, IP addresses, memory addresses
  let normalizedMsg = message || '';
  
  // Remove UUIDs
  normalizedMsg = normalizedMsg.replace(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g, '[UUID]');
  
  // Remove IP addresses
  normalizedMsg = normalizedMsg.replace(/\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g, '[IP]');
  
  // Remove hex memory addresses
  normalizedMsg = normalizedMsg.replace(/0x[a-fA-F0-9]+/g, '[ADDR]');

  // Remove timestamps (basic ISO format matcher)
  normalizedMsg = normalizedMsg.replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})/g, '[TIMESTAMP]');

  // Normalize stack trace: only keep the first 3 frames, and strip paths/line numbers
  let normalizedStack = '';
  if (stack) {
    const frames = stack.split('\n').slice(0, 4); // Include error type + 3 frames
    // Strip line/column numbers like :123:45
    normalizedStack = frames.join('\n').replace(/:\d+:\d+/g, '');
  }

  const rawString = `${level}|${normalizedMsg}|${normalizedStack}`;
  
  return crypto.createHash('sha256').update(rawString).digest('hex');
}
