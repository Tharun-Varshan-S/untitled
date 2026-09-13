/**
 * normalizeError.ts
 *
 * Converts raw unknown errors (from any layer) into a typed, structured
 * `NormalizedError` object for consistent handling across services.
 *
 * Supports:
 *  - AppError (our custom class)
 *  - Mongoose ValidationError / CastError
 *  - Axios / HTTP errors from internal microservice calls
 *  - Generic Error instances
 *  - Non-Error throwables (strings, objects)
 */

import { AppError } from '../AppError';

// ─── Type Definitions ────────────────────────────────────────────────────────

export type ServiceName =
  | 'database'
  | 'redis'
  | 'worker'
  | 'ai-service'
  | 'authentication'
  | 'api'
  | 'unknown';

export type ErrorCategory =
  | 'database'
  | 'api'
  | 'unknown'
  | 'cache'
  | 'background-processing'
  | 'security'
  | 'infrastructure';

export interface NormalizedError {
  service: ServiceName;
  category: ErrorCategory;
  message: string;
  code: string;
  statusCode: number;
  source: string;
  retryable: boolean;
  timestamp: string;
  originalError?: unknown;
  metadata?: Record<string, unknown>;
}

// ─── Category / Retryability Inference ───────────────────────────────────────

const CATEGORY_BY_SERVICE: Record<ServiceName, ErrorCategory> = {
  database: 'database',
  redis: 'cache',
  worker: 'background-processing',
  'ai-service': 'api',
  authentication: 'security',
  api: 'api',
  unknown: 'unknown',
};

/** Errors that typically resolve on retry (transient). */
const RETRYABLE_CODES = new Set([
  'ECONNREFUSED',
  'ETIMEDOUT',
  'ENOTFOUND',
  'ECONNRESET',
  'ECONNABORTED',
  'SERVICE_UNAVAILABLE',
  'GATEWAY_TIMEOUT',
  'TOO_MANY_REQUESTS',
]);

const isRetryable = (code: string, statusCode: number): boolean => {
  if (RETRYABLE_CODES.has(code)) return true;
  // 5xx errors (except 501 Not Implemented) are generally retryable
  return statusCode >= 500 && statusCode !== 501;
};

// ─── Axios Error Detection (no runtime import needed) ────────────────────────

const isAxiosError = (
  err: unknown
): err is { response?: { status: number; data?: { message?: string; errorCode?: string } }; code?: string; message: string } =>
  typeof err === 'object' &&
  err !== null &&
  'isAxiosError' in err &&
  (err as Record<string, unknown>).isAxiosError === true;

// ─── Main Normalizer ─────────────────────────────────────────────────────────

/**
 * Converts any thrown value into a `NormalizedError`.
 *
 * @param error   The raw caught value from a try/catch.
 * @param service Which service threw the error.
 * @param source  The function / module / step name where it was caught.
 */
export function normalizeError(
  error: unknown,
  service: ServiceName = 'unknown',
  source: string = 'unknown'
): NormalizedError {
  const timestamp = new Date().toISOString();
  const category = CATEGORY_BY_SERVICE[service];

  // ── AppError (our typed application errors) ────────────────────────────────
  if (error instanceof AppError) {
    const code = error.errorCode ?? (error.statusCode >= 500 ? 'SERVER_ERROR' : 'CLIENT_ERROR');
    return {
      service,
      category,
      message: error.message,
      code,
      statusCode: error.statusCode,
      source,
      retryable: isRetryable(code, error.statusCode),
      timestamp,
      originalError: error,
    };
  }

  // ── Axios / Fetch errors from internal service calls ───────────────────────
  if (isAxiosError(error)) {
    const statusCode = error.response?.status ?? 503;
    const code = error.code ?? 'SERVICE_UNAVAILABLE';
    const message = error.response?.data?.message ?? error.message ?? 'Internal service error';
    return {
      service,
      category,
      message,
      code,
      statusCode,
      source,
      retryable: isRetryable(code, statusCode),
      timestamp,
      originalError: error,
    };
  }

  // ── Mongoose ValidationError ───────────────────────────────────────────────
  if (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name: string }).name === 'ValidationError' &&
    'errors' in error
  ) {
    const mongoErr = error as { errors: Record<string, { message: string }> };
    const message = Object.values(mongoErr.errors)
      .map((e) => e.message)
      .join('; ');
    return {
      service: 'database',
      category: 'database',
      message,
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      source,
      retryable: false,
      timestamp,
      originalError: error,
    };
  }

  // ── Generic Error ──────────────────────────────────────────────────────────
  if (error instanceof Error) {
    const code =
      ('code' in error ? (error as NodeJS.ErrnoException).code : undefined) ?? 'INTERNAL_SERVER_ERROR';
    const statusCode = 500;
    return {
      service,
      category,
      message: error.message,
      code,
      statusCode,
      source,
      retryable: isRetryable(code, statusCode),
      timestamp,
      originalError: error,
    };
  }

  // ── Unknown (string, object, etc.) ────────────────────────────────────────
  return {
    service,
    category,
    message: typeof error === 'string' ? error : JSON.stringify(error),
    code: 'UNKNOWN_ERROR',
    statusCode: 500,
    source,
    retryable: false,
    timestamp,
    originalError: error,
  };
}
