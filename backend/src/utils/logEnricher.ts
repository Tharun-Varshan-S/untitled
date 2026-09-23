/**
 * logEnricher.ts
 *
 * Responsibility:
 * Deterministic enrichment of normalized log records.
 * Derives structured metadata from actual log content only.
 *
 * Rules:
 * - All enrichment is derived strictly from data present in the log.
 * - No LLM, no external calls, no network I/O.
 * - All functions are pure, deterministic, and testable.
 * - Never fabricates: if evidence is absent, returns 'unknown' or undefined.
 */

import { ErrorCategory, NormalizedLevel } from '../models/Log';
import { generateLogHash } from './logHash';

// ── Error category patterns ───────────────────────────────────────────────────

const ERROR_CATEGORY_PATTERNS: Array<{ category: ErrorCategory; patterns: RegExp[] }> = [
  {
    category: 'database',
    patterns: [
      /mongo(?:db)?|mongoose|connection refused.*27017|replica set|collection|document|bson/i,
      /sql|postgres|pg|mysql|oracle|sqlite|knex|sequelize|typeorm|prisma/i,
      /redis|cache.*error|memcache/i,
      /elasticsearch|es.*error/i,
    ],
  },
  {
    // timeout MUST be checked before network — ETIMEDOUT overlaps with network patterns
    category: 'timeout',
    patterns: [
      /timeout|timed out|deadline exceeded|request.*timeout/i,
      /etimedout|connect.*timeout|read.*timeout/i,
      /max.*retries|retry.*exceeded/i,
    ],
  },
  {
    category: 'network',
    patterns: [
      /econnrefused|enotfound|econnreset|socket hang up/i,
      /network|dns|tcp|udp|http.*error|fetch.*error|axios.*error/i,
      /connection.*refused|connect.*failed|cannot.*connect/i,
      /certificate|tls|ssl.*error/i,
    ],
  },
  {
    category: 'authentication',
    patterns: [
      /unauthorized|unauthenticated|401|403|forbidden/i,
      /invalid.*token|token.*expired|jwt.*error|bearer/i,
      /api.?key.*invalid|authentication.*failed|auth.*error/i,
      /permission denied|access denied|not authorized/i,
    ],
  },
  {
    category: 'validation',
    patterns: [
      /validation.*error|invalid.*input|bad request|400/i,
      /schema.*error|zod.*error|joi.*error|yup.*error/i,
      /required.*field|missing.*field|constraint.*violation/i,
      /malformed|parse.*error|invalid.*json/i,
    ],
  },
  {
    category: 'permission',
    patterns: [
      /eacces|eperm|permission.*denied|access.*denied/i,
      /insufficient.*privileges|not.*permitted/i,
    ],
  },
];

/**
 * Derives an error category by pattern-matching the log message.
 * Returns 'unknown' if no pattern matches — never fabricates a category.
 * Only meaningful for error/fatal level logs.
 */
export function deriveErrorCategory(
  level: NormalizedLevel,
  message: string
): ErrorCategory | undefined {
  // Only categorize actual errors/fatals — don't assign category to info/debug
  if (level !== 'error' && level !== 'fatal') return undefined;
  if (!message || typeof message !== 'string') return 'unknown';

  for (const { category, patterns } of ERROR_CATEGORY_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(message)) return category;
    }
  }

  return 'unknown';
}

// ── HTTP status category ──────────────────────────────────────────────────────

export type HttpStatusCategory = '1xx' | '2xx' | '3xx' | '4xx' | '5xx';

/**
 * Extracts HTTP status category from metadata.
 * Returns null if no HTTP status information is available.
 */
export function deriveHttpStatusCategory(
  metadata: Record<string, unknown> | undefined | null
): HttpStatusCategory | null {
  if (!metadata || typeof metadata !== 'object') return null;

  const status =
    metadata.statusCode ??
    metadata.status_code ??
    metadata.httpStatus ??
    metadata.http_status ??
    metadata.status;

  if (status === undefined || status === null) return null;

  const code = Number(status);
  if (isNaN(code) || code < 100 || code > 599) return null;

  const prefix = Math.floor(code / 100);
  const categoryMap: Record<number, HttpStatusCategory> = {
    1: '1xx',
    2: '2xx',
    3: '3xx',
    4: '4xx',
    5: '5xx',
  };

  return categoryMap[prefix] ?? null;
}

// ── Fingerprint ───────────────────────────────────────────────────────────────

/**
 * Computes a stable content fingerprint for deduplication and pattern matching.
 * Uses the existing logHash utility which already strips dynamic values
 * (timestamps, IPs, UUIDs) to produce a structural fingerprint.
 */
export function computeFingerprint(
  level: string,
  message: string,
  stack?: string
): string {
  return generateLogHash(level, message, stack);
}

// ── Composite enricher ────────────────────────────────────────────────────────

export interface EnrichedLogFields {
  normalizedLevel: NormalizedLevel;
  fingerprint: string;
  errorCategory?: ErrorCategory;
  httpStatusCategory?: HttpStatusCategory | null;
}

/**
 * Applies all deterministic enrichment to a normalized log in one pass.
 * Accepts the already-normalized level to avoid double normalization.
 */
export function enrichLog(params: {
  normalizedLevel: NormalizedLevel;
  message: string;
  metadata?: Record<string, unknown>;
  stack?: string;
}): EnrichedLogFields {
  const { normalizedLevel, message, metadata, stack } = params;

  const fingerprint = computeFingerprint(normalizedLevel, message, stack);
  const errorCategory = deriveErrorCategory(normalizedLevel, message);
  const httpStatusCategory = deriveHttpStatusCategory(metadata ?? null);

  return {
    normalizedLevel,
    fingerprint,
    ...(errorCategory !== undefined ? { errorCategory } : {}),
    ...(httpStatusCategory !== null ? { httpStatusCategory } : {}),
  };
}
