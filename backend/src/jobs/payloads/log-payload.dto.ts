/**
 * Version 1 Job Payload Schema for Log Processing Jobs.
 * Following Pass-by-Reference pattern and Schema Versioning.
 */
export interface LogJobPayloadV1 {
  version: 1;
  logId?: string;
  projectId: string;
  level: 'info' | 'warn' | 'error' | 'fatal' | 'debug';
  message: string;
  service?: string;
  environment?: string;
  source?: string;
  metadata?: Record<string, unknown>;
  timestamp?: string;
  simulateFailure?: boolean;
}

/**
 * Payload validation result
 */
export interface PayloadValidationResult<T> {
  isValid: boolean;
  data?: T;
  errors?: string[];
}

/**
 * Validates incoming BullMQ job payloads before processing.
 */
export const validateLogJobPayload = (payload: unknown): PayloadValidationResult<LogJobPayloadV1> => {
  const errors: string[] = [];

  if (!payload || typeof payload !== 'object') {
    return { isValid: false, errors: ['Payload must be a non-null object'] };
  }

  const p = payload as Record<string, unknown>;

  if (p.version !== 1) {
    errors.push(`Unsupported payload version: ${p.version}. Expected version 1.`);
  }

  if (!p.projectId || typeof p.projectId !== 'string' || p.projectId.trim() === '') {
    errors.push('Missing or invalid required field: projectId (non-empty string required)');
  }

  if (!p.message || typeof p.message !== 'string') {
    errors.push('Missing or invalid required field: message (string required)');
  }

  const validLevels = ['info', 'warn', 'error', 'fatal', 'debug'];
  if (!p.level || typeof p.level !== 'string' || !validLevels.includes(p.level)) {
    errors.push(`Invalid level: '${p.level}'. Allowed levels: ${validLevels.join(', ')}`);
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    data: p as unknown as LogJobPayloadV1,
  };
};
