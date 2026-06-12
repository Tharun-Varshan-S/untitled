import { readFileSync } from 'fs';
import { AppError } from '../../utils/AppError';

/**
 * JSON Parser
 * Parses JSON files with format: Array<{timestamp, level, service, message, metadata?}>
 * Returns an array of raw log objects for validation
 */
export const parseJSON = (filePath: string): Record<string, unknown>[] => {
  try {
    const content = readFileSync(filePath, 'utf-8');

    if (!content.trim()) {
      throw new AppError('JSON file is empty', 400, 'JSON_EMPTY');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch (error) {
      throw new AppError(
        `Invalid JSON syntax: ${error instanceof Error ? error.message : 'Unknown error'}`,
        400,
        'JSON_PARSE_ERROR'
      );
    }

    // Validate that parsed content is an array
    if (!Array.isArray(parsed)) {
      throw new AppError('JSON root element must be an array', 400, 'JSON_NOT_ARRAY');
    }

    if (parsed.length === 0) {
      throw new AppError('JSON array is empty', 400, 'JSON_ARRAY_EMPTY');
    }

    const logs: Record<string, unknown>[] = [];

    for (let i = 0; i < parsed.length; i++) {
      const item = parsed[i];

      if (typeof item !== 'object' || item === null) {
        throw new AppError(`Item ${i} is not an object`, 400, 'JSON_ITEM_NOT_OBJECT');
      }

      logs.push(item as Record<string, unknown>);
    }

    return logs;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      `Failed to parse JSON file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      400,
      'JSON_READ_ERROR'
    );
  }
};
