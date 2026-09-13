import { AppError } from '../utils/AppError';
import { LogLevel } from '../models/Log';

const validLevels: LogLevel[] = ['info', 'warn', 'error', 'debug', 'fatal'];

export type LogPayload = {
  level: LogLevel;
  message: string;
  service: string;
  metadata?: Record<string, unknown> | undefined;
  timestamp?: string | Date | undefined;
};

export class LogValidationError extends AppError {
  constructor(message: string, errorCode: string) {
    super(message, 400, errorCode);
  }
}

const sensitiveKeys = ['password', 'token', 'authorization', 'cookie', 'secret', 'api_key'];

const redactMetadata = (metadata: Record<string, unknown> | undefined): Record<string, unknown> | undefined => {
  if (!metadata || typeof metadata !== 'object') return metadata;
  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveKeys.some(sk => lowerKey.includes(sk));
    if (isSensitive) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      redacted[key] = redactMetadata(value as Record<string, unknown>);
    } else {
      redacted[key] = value;
    }
  }
  return redacted;
};

export const validateLogPayload = (payload: unknown): LogPayload => {
  const data = payload as Record<string, unknown>;
  const level = typeof data.level === 'string' ? data.level.trim() : '';
  const message = typeof data.message === 'string' ? data.message.trim() : '';
  const service = typeof data.service === 'string' ? data.service.trim() : '';
  const metadata = data.metadata as Record<string, unknown> | undefined;
  const timestamp = data.timestamp;

  if (!level) {
    throw new LogValidationError('Log level is required', 'LOG_LEVEL_REQUIRED');
  }
  if (!validLevels.includes(level as LogLevel)) {
    throw new LogValidationError('Invalid log level', 'LOG_LEVEL_INVALID');
  }
  if (!message) {
    throw new LogValidationError('Log message is required', 'LOG_MESSAGE_REQUIRED');
  }
  if (!service) {
    throw new LogValidationError('Log service is required', 'LOG_SERVICE_REQUIRED');
  }
  if (timestamp !== undefined && timestamp !== null) {
    const parsedDate = new Date(timestamp as string | Date);
    if (Number.isNaN(parsedDate.getTime())) {
      throw new LogValidationError('Invalid timestamp format', 'LOG_TIMESTAMP_INVALID');
    }
  }

  return {
    level: level as LogLevel,
    message,
    service,
    metadata: redactMetadata(metadata),
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
