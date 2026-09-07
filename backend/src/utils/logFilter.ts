import { LogLevel } from '../models/Log';

/**
 * Filter configuration for AI analysis.
 * We only want to analyze actionable logs, primarily errors.
 */
const ANALYSIS_WORTHY_LEVELS: LogLevel[] = ['error', 'fatal'];

/**
 * Determines if a log entry should be processed by the AI pipeline.
 *
 * @param level The log severity level
 * @param message The log message
 * @returns boolean True if the log should be analyzed
 */
export function isAnalysisWorthy(level: string, message?: string): boolean {
  // Check if level is in the allowed list
  if (!ANALYSIS_WORTHY_LEVELS.includes(level as LogLevel)) {
    return false;
  }

  // We can add further rules here, like ignoring specific known non-actionable errors
  // e.g., "Network disconnected" from a specific noisy service
  if (message && message.toLowerCase().includes('user cancelled')) {
    return false;
  }

  return true;
}
