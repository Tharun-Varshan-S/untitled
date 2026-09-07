/**
 * Options for compressing stack traces.
 */
export interface StackTraceCompressorOptions {
  /** Maximum number of frames to keep. Default: 5 */
  maxFrames?: number;
}

/**
 * Compresses stack traces to save context window tokens for AI analysis.
 * Prioritizes application frames and collapses excessive node_modules/vendor frames.
 *
 * @param rawStack The raw stack trace string
 * @param options Configuration for compression
 * @returns The compressed stack trace
 */
export function compressStackTrace(rawStack: string, options?: StackTraceCompressorOptions): string {
  if (!rawStack || typeof rawStack !== 'string') return rawStack;

  const maxFrames = options?.maxFrames || 5;
  const lines = rawStack.split('\n');

  // Typically, the first line is the error message itself
  const header = lines[0] || '';
  const frames = lines.slice(1);

  if (frames.length <= maxFrames) {
    return rawStack;
  }

  // Filter to prioritize frames that do not come from node_modules (app-specific code)
  const appFrames = frames.filter((frame) => !frame.includes('node_modules') && !frame.includes('internal/'));
  
  // If we have enough app frames, just take the top maxFrames from appFrames
  // Otherwise, fallback to the top raw frames
  let keptFrames = [];
  if (appFrames.length > 0) {
    keptFrames = appFrames.slice(0, maxFrames);
  } else {
    keptFrames = frames.slice(0, maxFrames);
  }

  const omittedCount = frames.length - keptFrames.length;
  
  if (omittedCount > 0) {
    keptFrames.push(`    ... (${omittedCount} frames omitted to save context) ...`);
  }

  return [header, ...keptFrames].join('\n');
}
