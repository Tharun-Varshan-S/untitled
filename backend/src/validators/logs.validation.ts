import { AppError } from '../utils/AppError';
import { LogLevel } from '../models/Log';

const validLevels: LogLevel[] = ['info', 'warn', 'error', 'debug'];

export type LogPayload = {
  level: LogLevel;
  message: string;
  service: string;
  metadata?: Record<string, unknown> | undefined;
  timestamp?: string | Date | undefined;
};

export const validateLogPayload = (payload: unknown): LogPayload => {
  const data = payload as Record<string, unknown>;
  const level = typeof data.level === 'string' ? data.level.trim() : '';
  const message = typeof data.message === 'string' ? data.message.trim() : '';
  const service = typeof data.service === 'string' ? data.service.trim() : '';
  const metadata = data.metadata as Record<string, unknown> | undefined;
  const timestamp = data.timestamp;

  if (!level) {
    throw new AppError('Log level is required', 400, 'LOG_LEVEL_REQUIRED');
  }
  if (!validLevels.includes(level as LogLevel)) {
    throw new AppError('Invalid log level', 400, 'LOG_LEVEL_INVALID');
  }
  if (!message) {
    throw new AppError('Log message is required', 400, 'LOG_MESSAGE_REQUIRED');
  }
  if (!service) {
    throw new AppError('Log service is required', 400, 'LOG_SERVICE_REQUIRED');
  }
  if (timestamp !== undefined && timestamp !== null) {
    const parsedDate = new Date(timestamp as string | Date);
    if (Number.isNaN(parsedDate.getTime())) {
      throw new AppError('Invalid timestamp format', 400, 'LOG_TIMESTAMP_INVALID');
    }
  }

  return {
    level: level as LogLevel,
    message,
    service,
    metadata,
    timestamp: timestamp as string | Date | undefined,
  };
};

export const validateBulkLogPayload = (payload: unknown): LogPayload[] => {
  if (!Array.isArray(payload)) {
    throw new AppError('Bulk payload must be an array', 400, 'LOG_BULK_PAYLOAD_INVALID');
  }

  if (payload.length === 0) {
    throw new AppError('Bulk payload must contain at least one log entry', 400, 'LOG_BULK_EMPTY');
  }

  return payload.map((item, index) => {
    try {
      return validateLogPayload(item);
    } catch (error) {
      if (error instanceof AppError) {
        throw new AppError(`Item ${index}: ${error.message}`, 400, error.errorCode);
      }
      throw error;
    }
  });
};
