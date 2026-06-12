import { readFileSync } from 'fs';
import { AppError } from '../../utils/AppError';

/**
 * CSV Parser
 * Parses CSV files with format: timestamp,level,service,message[,metadata_json]
 * Returns an array of raw log objects for validation
 */
export const parseCSV = (filePath: string): Record<string, unknown>[] => {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n');

    if (lines.length < 2) {
      throw new AppError('CSV file is empty or contains only headers', 400, 'CSV_EMPTY');
    }

    const headers = parseCSVLine(lines[0] ?? '');
    const requiredHeaders = ['timestamp', 'level', 'service', 'message'];

    // Validate headers
    const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));
    if (missingHeaders.length > 0) {
      throw new AppError(
        `CSV missing required headers: ${missingHeaders.join(', ')}`,
        400,
        'CSV_INVALID_HEADERS'
      );
    }

    const logs: Record<string, unknown>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = (lines[i] ?? '').trim();
      if (!line) continue; // Skip empty lines

      try {
        const values = parseCSVLine(line);
        const row: Record<string, unknown> = {};

        headers.forEach((header, index) => {
          row[header] = values[index] ?? '';
        });

        const log: Record<string, unknown> = {
          timestamp: row.timestamp,
          level: row.level,
          service: row.service,
          message: row.message,
        };

        // Parse metadata if provided as JSON
        if (row.metadata && typeof row.metadata === 'string' && row.metadata.trim()) {
          try {
            log.metadata = JSON.parse(row.metadata as string);
          } catch {
            // Ignore invalid metadata JSON
          }
        }

        logs.push(log);
      } catch (error) {
        throw new AppError(
          `Error parsing CSV line ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          400,
          'CSV_PARSE_ERROR'
        );
      }
    }

    return logs;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      `Failed to parse CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      400,
      'CSV_READ_ERROR'
    );
  }
};

/**
 * Parse a single CSV line, handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Handle escaped quotes
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      // End of field
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Add last field
  result.push(current.trim());

  return result;
}
