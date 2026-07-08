import { AppError } from '../utils/AppError';
import { SearchQuery } from '../types/search.types';
import { Types } from 'mongoose';
import { SearchConfig } from '../config/search.config';

export const validateSearchQuery = (query: unknown): SearchQuery => {
  const data = query as Record<string, unknown>;
  const limit = Number(data.limit ?? SearchConfig.pagination.defaultLimit);

  if (Number.isNaN(limit) || limit < 1 || limit > SearchConfig.pagination.maxLimit) {
    throw new AppError(`Limit must be between 1 and ${SearchConfig.pagination.maxLimit}`, 400, 'INVALID_LIMIT');
  }

  const cursor = typeof data.cursor === 'string' && data.cursor.trim() ? data.cursor.trim() : undefined;
  if (cursor) {
    try {
      const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
      const parsed = JSON.parse(decoded);
      if (!parsed.timestamp || !parsed._id || !Types.ObjectId.isValid(parsed._id)) {
        throw new Error('Invalid cursor format');
      }
      if (Number.isNaN(Date.parse(parsed.timestamp))) {
        throw new Error('Invalid cursor date format');
      }
    } catch {
      throw new AppError('Invalid cursor', 400, 'INVALID_CURSOR');
    }
  }

  const q = typeof data.q === 'string' && data.q.trim() ? data.q.trim() : undefined;
  
  if (q && q.length > SearchConfig.validation.maxQueryLength) {
    throw new AppError(`Search query is too long (max ${SearchConfig.validation.maxQueryLength} characters)`, 400, 'INVALID_QUERY_LENGTH');
  }

  const level = typeof data.level === 'string' && data.level.trim() ? data.level.trim() : undefined;
  if (level && !(SearchConfig.validation.allowedLevels as readonly string[]).includes(level)) {
    throw new AppError(`Invalid level. Allowed values: ${SearchConfig.validation.allowedLevels.join(', ')}`, 400, 'INVALID_LEVEL');
  }

  const service = typeof data.service === 'string' && data.service.trim() ? data.service.trim() : undefined;
  if (service && service.length > SearchConfig.validation.maxFieldLength) {
    throw new AppError('Service name is too long', 400, 'INVALID_SERVICE_LENGTH');
  }

  const environment = typeof data.environment === 'string' && data.environment.trim() ? data.environment.trim() : undefined;
  if (environment && environment.length > SearchConfig.validation.maxFieldLength) {
    throw new AppError('Environment name is too long', 400, 'INVALID_ENVIRONMENT_LENGTH');
  }

  const source = typeof data.source === 'string' && data.source.trim() ? data.source.trim() : undefined;
  if (source && source.length > SearchConfig.validation.maxFieldLength) {
    throw new AppError('Source name is too long', 400, 'INVALID_SOURCE_LENGTH');
  }

  const startDate = typeof data.startDate === 'string' && data.startDate.trim() ? data.startDate.trim() : undefined;
  const endDate = typeof data.endDate === 'string' && data.endDate.trim() ? data.endDate.trim() : undefined;

  let startParsed: number | undefined;
  let endParsed: number | undefined;

  if (startDate) {
    startParsed = Date.parse(startDate);
    if (Number.isNaN(startParsed)) {
      throw new AppError('Invalid startDate format', 400, 'INVALID_START_DATE');
    }
  }

  if (endDate) {
    endParsed = Date.parse(endDate);
    if (Number.isNaN(endParsed)) {
      throw new AppError('Invalid endDate format', 400, 'INVALID_END_DATE');
    }
  }

  if (startParsed && endParsed && startParsed > endParsed) {
    throw new AppError('startDate cannot be after endDate', 400, 'INVALID_DATE_RANGE');
  }

  const result: SearchQuery = { limit };
  
  if (cursor) result.cursor = cursor;
  if (q) result.q = q;
  if (level) result.level = level;
  if (service) result.service = service;
  if (environment) result.environment = environment;
  if (source) result.source = source;
  if (startDate) result.startDate = startDate;
  if (endDate) result.endDate = endDate;

  return result;
};
