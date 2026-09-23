/**
 * normalization.test.ts
 * Unit tests for logNormalizer and logEnricher utilities.
 * All tests are pure, deterministic, and require no external dependencies.
 */

import {
  normalizeLevel,
  normalizeTimestamp,
  normalizeService,
  normalizeEnvironment,
  normalizeSource,
  normalizeLogPayload,
  extractMetadataString,
} from '../utils/logNormalizer';

import {
  deriveErrorCategory,
  deriveHttpStatusCategory,
  computeFingerprint,
  enrichLog,
} from '../utils/logEnricher';

// ─── normalizeLevel ──────────────────────────────────────────────────────────

describe('normalizeLevel', () => {
  describe('Standard variants', () => {
    it.each([
      ['info', 'info'],
      ['INFO', 'info'],
      ['Info', 'info'],
      ['warn', 'warn'],
      ['WARN', 'warn'],
      ['WARNING', 'warn'],
      ['warning', 'warn'],
      ['error', 'error'],
      ['ERROR', 'error'],
      ['Error', 'error'],
      ['ERR', 'error'],
      ['err', 'error'],
      ['debug', 'debug'],
      ['DEBUG', 'debug'],
      ['DBG', 'debug'],
      ['fatal', 'fatal'],
      ['FATAL', 'fatal'],
      ['CRITICAL', 'fatal'],
      ['critical', 'fatal'],
      ['CRIT', 'fatal'],
    ])('normalizes "%s" → "%s"', (input, expected) => {
      expect(normalizeLevel(input)).toBe(expected);
    });
  });

  describe('Syslog numeric levels', () => {
    it.each([
      ['0', 'fatal'],
      ['1', 'fatal'],
      ['2', 'fatal'],
      ['3', 'error'],
      ['4', 'warn'],
      ['5', 'info'],
      ['6', 'info'],
      ['7', 'debug'],
    ])('syslog level %s → %s', (input, expected) => {
      expect(normalizeLevel(input)).toBe(expected);
    });
  });

  describe('Edge cases', () => {
    it('returns "info" for undefined', () => {
      expect(normalizeLevel(undefined)).toBe('info');
    });
    it('returns "info" for null', () => {
      expect(normalizeLevel(null)).toBe('info');
    });
    it('returns "info" for empty string', () => {
      expect(normalizeLevel('')).toBe('info');
    });
    it('returns "info" for unknown value', () => {
      expect(normalizeLevel('VERBOSE')).toBe('info');
    });
    it('handles whitespace', () => {
      expect(normalizeLevel('  ERROR  ')).toBe('error');
    });
  });
});

// ─── normalizeTimestamp ──────────────────────────────────────────────────────

describe('normalizeTimestamp', () => {
  it('returns current time for undefined', () => {
    const before = Date.now();
    const result = normalizeTimestamp(undefined);
    const after = Date.now();
    expect(result.getTime()).toBeGreaterThanOrEqual(before);
    expect(result.getTime()).toBeLessThanOrEqual(after);
  });

  it('returns current time for null', () => {
    const result = normalizeTimestamp(null);
    expect(result).toBeInstanceOf(Date);
    expect(isNaN(result.getTime())).toBe(false);
  });

  it('returns current time for invalid string', () => {
    const result = normalizeTimestamp('not-a-date');
    expect(result).toBeInstanceOf(Date);
    expect(isNaN(result.getTime())).toBe(false);
  });

  it('parses valid ISO-8601 string', () => {
    const iso = '2024-01-15T10:30:00Z';
    const result = normalizeTimestamp(iso);
    expect(result.toISOString()).toBe(new Date(iso).toISOString());
  });

  it('parses unix timestamp number', () => {
    const ts = 1700000000000;
    const result = normalizeTimestamp(ts);
    expect(result.getTime()).toBe(ts);
  });

  it('accepts Date object', () => {
    const d = new Date('2024-06-01T00:00:00Z');
    expect(normalizeTimestamp(d).toISOString()).toBe(d.toISOString());
  });

  it('rejects far-future timestamps (> 1 year ahead)', () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 2);
    const result = normalizeTimestamp(future.toISOString());
    // Should return ~now, not the future date
    const now = Date.now();
    expect(Math.abs(result.getTime() - now)).toBeLessThan(5000);
  });
});

// ─── normalizeService ────────────────────────────────────────────────────────

describe('normalizeService', () => {
  it('lowercases service name', () => {
    expect(normalizeService('AuthService')).toBe('authservice');
  });

  it('trims whitespace', () => {
    expect(normalizeService('  api-gateway  ')).toBe('api-gateway');
  });

  it('replaces spaces with hyphens', () => {
    expect(normalizeService('My Service Name')).toBe('my-service-name');
  });

  it('returns "default" for undefined', () => {
    expect(normalizeService(undefined)).toBe('default');
  });

  it('returns "default" for null', () => {
    expect(normalizeService(null)).toBe('default');
  });

  it('returns "default" for empty string', () => {
    expect(normalizeService('')).toBe('default');
  });

  it('returns "default" for whitespace-only string', () => {
    expect(normalizeService('   ')).toBe('default');
  });
});

// ─── normalizeEnvironment ────────────────────────────────────────────────────

describe('normalizeEnvironment', () => {
  it.each([
    ['production', 'production'],
    ['prod', 'production'],
    ['PRODUCTION', 'production'],
    ['staging', 'staging'],
    ['stage', 'staging'],
    ['STAGING', 'staging'],
    ['development', 'development'],
    ['dev', 'development'],
    ['local', 'development'],
    ['test', 'test'],
    ['testing', 'test'],
    ['ci', 'test'],
  ])('maps "%s" → "%s"', (input, expected) => {
    expect(normalizeEnvironment(input)).toBe(expected);
  });

  it('returns "unknown" for unrecognized value', () => {
    expect(normalizeEnvironment('sandbox')).toBe('unknown');
  });

  it('returns "unknown" for null', () => {
    expect(normalizeEnvironment(null)).toBe('unknown');
  });
});

// ─── normalizeSource ─────────────────────────────────────────────────────────

describe('normalizeSource', () => {
  it('returns "sdk" for sdk', () => {
    expect(normalizeSource('sdk')).toBe('sdk');
  });
  it('returns "upload" for upload', () => {
    expect(normalizeSource('UPLOAD')).toBe('upload');
  });
  it('returns "api" for api', () => {
    expect(normalizeSource('API')).toBe('api');
  });
  it('returns "unknown" for null', () => {
    expect(normalizeSource(null)).toBe('unknown');
  });
  it('returns "unknown" for unrecognized', () => {
    expect(normalizeSource('webhook')).toBe('unknown');
  });
});

// ─── extractMetadataString ───────────────────────────────────────────────────

describe('extractMetadataString', () => {
  it('extracts first matching key', () => {
    const meta = { requestId: 'req-123', traceId: 'tr-456' };
    expect(extractMetadataString(meta, 'requestId')).toBe('req-123');
  });

  it('falls through to second key if first is missing', () => {
    const meta = { trace_id: 'tr-456' };
    expect(extractMetadataString(meta, 'traceId', 'trace_id')).toBe('tr-456');
  });

  it('returns undefined if no keys match', () => {
    expect(extractMetadataString({ a: 'b' }, 'requestId')).toBeUndefined();
  });

  it('returns undefined for null metadata', () => {
    expect(extractMetadataString(null, 'requestId')).toBeUndefined();
  });

  it('ignores non-string values', () => {
    const meta = { requestId: 123 };
    expect(extractMetadataString(meta, 'requestId')).toBeUndefined();
  });

  it('ignores empty string values', () => {
    const meta = { requestId: '', traceId: 'tr-123' };
    expect(extractMetadataString(meta, 'requestId', 'traceId')).toBe('tr-123');
  });
});

// ─── normalizeLogPayload ─────────────────────────────────────────────────────

describe('normalizeLogPayload', () => {
  it('normalizes a complete payload', () => {
    const result = normalizeLogPayload({
      level: 'ERROR',
      service: 'Auth Service',
      timestamp: '2024-01-01T00:00:00Z',
      metadata: {
        environment: 'prod',
        traceId: 'abc-123',
        requestId: 'req-456',
        host: 'pod-xyz',
      },
      source: 'sdk',
    });

    expect(result.normalizedLevel).toBe('error');
    expect(result.normalizedService).toBe('auth-service');
    expect(result.normalizedTimestamp).toEqual(new Date('2024-01-01T00:00:00Z'));
    expect(result.environment).toBe('production');
    expect(result.source).toBe('sdk');
    expect(result.traceId).toBe('abc-123');
    expect(result.requestId).toBe('req-456');
    expect(result.host).toBe('pod-xyz');
  });

  it('handles missing optional fields without fabricating data', () => {
    const result = normalizeLogPayload({ level: 'info', service: 'api' });

    expect(result.normalizedLevel).toBe('info');
    expect(result.traceId).toBeUndefined();
    expect(result.spanId).toBeUndefined();
    expect(result.requestId).toBeUndefined();
    expect(result.host).toBeUndefined();
    expect(result.environment).toBe('unknown');
  });
});

// ─── deriveErrorCategory ─────────────────────────────────────────────────────

describe('deriveErrorCategory', () => {
  it('categorizes database errors', () => {
    expect(deriveErrorCategory('error', 'MongoDB connection refused')).toBe('database');
    expect(deriveErrorCategory('error', 'Redis connection failed')).toBe('database');
    expect(deriveErrorCategory('error', 'mongoose: duplicate key error')).toBe('database');
  });

  it('categorizes network errors', () => {
    expect(deriveErrorCategory('error', 'ECONNREFUSED 127.0.0.1:3000')).toBe('network');
    expect(deriveErrorCategory('error', 'socket hang up')).toBe('network');
    expect(deriveErrorCategory('error', 'DNS lookup failed')).toBe('network');
  });

  it('categorizes authentication errors', () => {
    expect(deriveErrorCategory('error', 'Unauthorized: invalid JWT token')).toBe('authentication');
    expect(deriveErrorCategory('error', '401 unauthenticated')).toBe('authentication');
    expect(deriveErrorCategory('fatal', 'API key invalid')).toBe('authentication');
  });

  it('categorizes timeout errors', () => {
    expect(deriveErrorCategory('error', 'Request timeout after 30s')).toBe('timeout');
    expect(deriveErrorCategory('error', 'ETIMEDOUT')).toBe('timeout');
  });

  it('categorizes validation errors', () => {
    expect(deriveErrorCategory('error', 'Validation error: required field missing')).toBe('validation');
    expect(deriveErrorCategory('error', 'Bad request: invalid JSON')).toBe('validation');
  });

  it('returns undefined for non-error levels', () => {
    expect(deriveErrorCategory('info', 'MongoDB connection refused')).toBeUndefined();
    expect(deriveErrorCategory('warn', 'ECONNREFUSED')).toBeUndefined();
    expect(deriveErrorCategory('debug', 'timeout')).toBeUndefined();
  });

  it('returns "unknown" for error level with unrecognizable message', () => {
    expect(deriveErrorCategory('error', 'Something went wrong')).toBe('unknown');
  });

  it('returns undefined for empty message', () => {
    expect(deriveErrorCategory('error', '')).toBe('unknown');
  });
});

// ─── deriveHttpStatusCategory ────────────────────────────────────────────────

describe('deriveHttpStatusCategory', () => {
  it.each([
    [{ statusCode: 200 }, '2xx'],
    [{ statusCode: 201 }, '2xx'],
    [{ status_code: 400 }, '4xx'],
    [{ httpStatus: 404 }, '4xx'],
    [{ statusCode: 500 }, '5xx'],
    [{ statusCode: 503 }, '5xx'],
    [{ status: 301 }, '3xx'],
  ])('extracts %o → %s', (meta, expected) => {
    expect(deriveHttpStatusCategory(meta)).toBe(expected);
  });

  it('returns null for missing metadata', () => {
    expect(deriveHttpStatusCategory(null)).toBeNull();
  });

  it('returns null for metadata without status', () => {
    expect(deriveHttpStatusCategory({ foo: 'bar' })).toBeNull();
  });

  it('returns null for invalid status code', () => {
    expect(deriveHttpStatusCategory({ statusCode: 'abc' })).toBeNull();
    expect(deriveHttpStatusCategory({ statusCode: 0 })).toBeNull();
    expect(deriveHttpStatusCategory({ statusCode: 999 })).toBeNull();
  });
});

// ─── computeFingerprint ──────────────────────────────────────────────────────

describe('computeFingerprint', () => {
  it('produces consistent hash for same inputs', () => {
    const fp1 = computeFingerprint('error', 'Connection refused at 192.168.1.1');
    const fp2 = computeFingerprint('error', 'Connection refused at 10.0.0.1');
    expect(fp1).toBe(fp2); // IPs normalized
  });

  it('produces different hash for different messages', () => {
    const fp1 = computeFingerprint('error', 'Database connection failed');
    const fp2 = computeFingerprint('error', 'Network timeout occurred');
    expect(fp1).not.toBe(fp2);
  });

  it('produces different hash for different levels', () => {
    const fp1 = computeFingerprint('error', 'Something failed');
    const fp2 = computeFingerprint('warn', 'Something failed');
    expect(fp1).not.toBe(fp2);
  });

  it('returns a non-empty string', () => {
    const fp = computeFingerprint('info', 'Application started');
    expect(typeof fp).toBe('string');
    expect(fp.length).toBeGreaterThan(0);
  });
});

// ─── enrichLog ───────────────────────────────────────────────────────────────

describe('enrichLog', () => {
  it('produces all enrichment fields for an error log', () => {
    const result = enrichLog({
      normalizedLevel: 'error',
      message: 'MongoDB connection refused at 127.0.0.1:27017',
      metadata: { statusCode: 500 },
    });

    expect(result.normalizedLevel).toBe('error');
    expect(result.fingerprint).toBeTruthy();
    expect(result.errorCategory).toBe('database');
    expect(result.httpStatusCategory).toBe('5xx');
  });

  it('does not include errorCategory for info logs', () => {
    const result = enrichLog({
      normalizedLevel: 'info',
      message: 'User logged in',
    });

    expect(result.errorCategory).toBeUndefined();
  });

  it('does not include httpStatusCategory when metadata is absent', () => {
    const result = enrichLog({
      normalizedLevel: 'error',
      message: 'Something went wrong',
    });

    // httpStatusCategory should not appear when not in metadata
    expect(result.httpStatusCategory).toBeUndefined();
  });
});
