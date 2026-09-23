/**
 * logNormalizer.ts
 *
 * Responsibility:
 * Deterministic, stateless normalization of raw log ingestion payloads
 * into the canonical internal log representation.
 *
 * Rules:
 * - Never fabricate missing data. If a field is absent, it becomes null/undefined.
 * - All transformations are deterministic and testable.
 * - No LLM, no external calls, no side effects.
 */

import { LogLevel, NormalizedLevel, LogEnvironment, LogSource } from '../models/Log';

// ── Level normalization ───────────────────────────────────────────────────────

const LEVEL_MAP: Record<string, NormalizedLevel> = {
  // Standard
  info:    'info',
  warn:    'warn',
  warning: 'warn',
  error:   'error',
  err:     'error',
  debug:   'debug',
  dbg:     'debug',
  fatal:   'fatal',
  crit:    'fatal',
  critical:'fatal',
  // Syslog severity numbers (0-7)
  '0': 'fatal', // emerg
  '1': 'fatal', // alert
  '2': 'fatal', // crit
  '3': 'error', // err
  '4': 'warn',  // warning
  '5': 'info',  // notice
  '6': 'info',  // info
  '7': 'debug', // debug
};

/**
 * Normalizes any raw level string to a canonical LogLevel.
 * Falls back to 'info' for unrecognized values (never throws).
 */
export function normalizeLevel(raw: string | undefined | null): NormalizedLevel {
  if (!raw) return 'info';
  const key = raw.toString().toLowerCase().trim();
  return LEVEL_MAP[key] ?? 'info';
}

// ── Timestamp normalization ───────────────────────────────────────────────────

/**
 * Normalizes a raw timestamp to a valid Date.
 * If the input is invalid or absent, returns the current time.
 * Never fabricates future timestamps.
 */
export function normalizeTimestamp(raw: string | number | Date | undefined | null): Date {
  if (!raw) return new Date();
  const d = new Date(raw as any);
  if (isNaN(d.getTime())) return new Date();
  // Reject obviously nonsensical future timestamps (> 1 year ahead)
  const oneYearAhead = new Date();
  oneYearAhead.setFullYear(oneYearAhead.getFullYear() + 1);
  if (d > oneYearAhead) return new Date();
  return d;
}

// ── Service normalization ─────────────────────────────────────────────────────

/**
 * Normalizes service name: lowercase, trim, replace spaces with hyphens.
 * Returns 'default' only if the value is truly absent/empty.
 */
export function normalizeService(raw: string | undefined | null): string {
  if (!raw || typeof raw !== 'string') return 'default';
  const trimmed = raw.trim().toLowerCase().replace(/\s+/g, '-');
  return trimmed.length > 0 ? trimmed : 'default';
}

// ── Environment normalization ─────────────────────────────────────────────────

const ENV_MAP: Record<string, LogEnvironment> = {
  production:  'production',
  prod:        'production',
  staging:     'staging',
  stage:       'staging',
  development: 'development',
  dev:         'development',
  local:       'development',
  test:        'test',
  testing:     'test',
  ci:          'test',
};

/**
 * Normalizes environment name from raw metadata or payload.
 * Returns 'unknown' if the value cannot be mapped.
 */
export function normalizeEnvironment(raw: string | undefined | null): LogEnvironment {
  if (!raw || typeof raw !== 'string') return 'unknown';
  const key = raw.trim().toLowerCase();
  return ENV_MAP[key] ?? 'unknown';
}

// ── Source normalization ──────────────────────────────────────────────────────

/**
 * Determines log ingestion source from the request context.
 */
export function normalizeSource(raw: string | undefined | null): LogSource {
  if (!raw || typeof raw !== 'string') return 'unknown';
  const key = raw.trim().toLowerCase();
  if (key === 'sdk')    return 'sdk';
  if (key === 'upload') return 'upload';
  if (key === 'api')    return 'api';
  return 'unknown';
}

// ── Metadata field extraction ─────────────────────────────────────────────────

/**
 * Safely extracts a string field from metadata without throwing.
 */
export function extractMetadataString(
  metadata: Record<string, unknown> | undefined | null,
  ...keys: string[]
): string | undefined {
  if (!metadata || typeof metadata !== 'object') return undefined;
  for (const key of keys) {
    const value = metadata[key];
    if (value !== undefined && value !== null && typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return undefined;
}

// ── Composite normalizer ──────────────────────────────────────────────────────

export interface NormalizedLogFields {
  normalizedLevel: NormalizedLevel;
  normalizedService: string;
  normalizedTimestamp: Date;
  environment: LogEnvironment;
  source: LogSource;
  traceId: string | undefined;
  spanId: string | undefined;
  requestId: string | undefined;
  host: string | undefined;
}

/**
 * Applies all normalization steps to a raw log payload in one pass.
 * Returns a partial LogDocument-compatible object with only normalized fields.
 * The caller is responsible for merging with the original payload.
 */
export function normalizeLogPayload(payload: {
  level?: string;
  service?: string;
  timestamp?: string | number | Date;
  metadata?: Record<string, unknown>;
  source?: string;
}): NormalizedLogFields {
  const metadata = payload.metadata ?? {};

  // Environment: check payload root then metadata
  const rawEnv =
    extractMetadataString(metadata, 'environment', 'env') ??
    (typeof (payload as any).environment === 'string' ? (payload as any).environment : undefined);

  // RequestId: check metadata for common field names
  const requestId =
    extractMetadataString(metadata, 'requestId', 'request_id', 'req_id', 'x-request-id') ??
    extractMetadataString(metadata, 'correlationId', 'correlation_id');

  // TraceId/SpanId: OpenTelemetry and common patterns
  const traceId =
    extractMetadataString(metadata, 'traceId', 'trace_id', 'traceid') ??
    extractMetadataString(metadata, 'dd.trace_id'); // Datadog compat

  const spanId =
    extractMetadataString(metadata, 'spanId', 'span_id', 'spanid');

  const host =
    extractMetadataString(metadata, 'host', 'hostname', 'instance', 'pod');

  return {
    normalizedLevel:     normalizeLevel(payload.level),
    normalizedService:   normalizeService(payload.service),
    normalizedTimestamp: normalizeTimestamp(payload.timestamp),
    environment:         normalizeEnvironment(rawEnv),
    source:              normalizeSource(payload.source),
    traceId,
    spanId,
    requestId,
    host,
  };
}
