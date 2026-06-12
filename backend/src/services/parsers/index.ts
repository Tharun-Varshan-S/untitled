import path from 'path';
import { AppError } from '../../utils/AppError';
import { parseCSV } from './csvParser';
import { parseJSON } from './jsonParser';
import { parseNDJSON } from './ndjsonParser';

/**
 * File parser type
 */
export type SupportedFileType = 'csv' | 'json' | 'ndjson';

/**
 * Parser factory
 * Routes file parsing to appropriate parser based on file extension
 * Extensible design allows easy addition of new format support
 * Returns raw log objects that will be validated by the validation layer
 */
export const parseFile = (filePath: string): Record<string, unknown>[] => {
  const ext = path.extname(filePath).toLowerCase();
  const fileType = getFileType(ext);

  switch (fileType) {
    case 'csv':
      return parseCSV(filePath);
    case 'json':
      return parseJSON(filePath);
    case 'ndjson':
      return parseNDJSON(filePath);
    default:
      throw new AppError(`Unsupported file type: ${fileType}`, 400, 'UNSUPPORTED_FILE_TYPE');
  }
};

/**
 * Get file type from extension
 */
function getFileType(ext: string): SupportedFileType {
  const typeMap: Record<string, SupportedFileType> = {
    '.csv': 'csv',
    '.json': 'json',
    '.ndjson': 'ndjson',
  };

  const fileType = typeMap[ext];
  if (!fileType) {
    throw new AppError(`Unsupported file extension: ${ext}`, 400, 'UNSUPPORTED_EXTENSION');
  }

  return fileType;
}
