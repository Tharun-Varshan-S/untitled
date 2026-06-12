import { readFileSync } from 'fs';
import { AppError } from '../../utils/AppError';

/**
 * NDJSON Parser (Newline-Delimited JSON)
 * Parses NDJSON files with format: One JSON object per line
 * Example:
 *   {"timestamp":"2026-01-01","level":"info","service":"auth","message":"Started"}
 *   {"timestamp":"2026-01-01","level":"error","service":"auth","message":"Failed"}
 * Returns an array of raw log objects for validation
 */
export const parseNDJSON = (filePath: string): Record<string, unknown>[] => {
  try {
    const content = readFileSync(filePath, 'utf-8');

    if (!content.trim()) {
      throw new AppError('NDJSON file is empty', 400, 'NDJSON_EMPTY');
    }

    const lines = content.trim().split('\n');
    const logs: Record<string, unknown>[] = [];
    const errors: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = (lines[i] ?? '').trim();

      // Skip empty lines
      if (!line) continue;

      try {
        let parsed: unknown;
        try {
          parsed = JSON.parse(line);
        } catch (error) {
          errors.push(
            `Line ${i + 1}: Invalid JSON syntax - ${error instanceof Error ? error.message : 'Unknown error'}`
          );
          continue; // Skip malformed rows gracefully
        }

        // Validate that parsed content is an object
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
          errors.push(`Line ${i + 1}: Entry must be a JSON object, not ${typeof parsed}`);
          continue;
        }

        logs.push(parsed as Record<string, unknown>);
      } catch (error) {
        errors.push(
          `Line ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    if (logs.length === 0) {
      throw new AppError(
        `NDJSON file contains no valid entries. Errors: ${errors.slice(0, 3).join('; ')}`,
        400,
        'NDJSON_NO_VALID_ENTRIES'
      );
    }

    // Log warnings for skipped rows but don't fail
    if (errors.length > 0) {
      // In a production system, you might want to track these
      // eslint-disable-next-line no-console
      console.warn(`NDJSON parser: Skipped ${errors.length} malformed rows`);
    }

    return logs;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      `Failed to parse NDJSON file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      400,
      'NDJSON_READ_ERROR'
    );
  }
};
