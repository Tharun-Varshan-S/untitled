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
 * Payload schema for delayed AI Log Aggregation & Root Cause Analysis jobs.
 */
export interface AiAnalysisJobPayloadV1 {
  version: 1;
  projectId: string;
  batchId?: string;
  triggerReason: 'threshold_exceeded' | 'error_spike' | 'scheduled_summary';
  logCount?: number;
  initiatedAt: string;
}

/**
 * Payload schema for delayed notification/alert dispatching jobs.
 */
export interface NotificationJobPayloadV1 {
  version: 1;
  projectId: string;
  alertId: string;
  channel: 'email' | 'slack' | 'webhook';
  recipient: string;
  summary: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  dispatchAfterMs?: number;
}

/**
 * Payload schema for repeatable Collector Health Check jobs.
 */
export interface HealthCheckJobPayloadV1 {
  version: 1;
  checkType: 'collector_ping' | 'system_heartbeat';
  targetServices?: string[];
  executedAt: string;
}

/**
 * Payload schema for repeatable Analytics Aggregation jobs.
 */
export interface AnalyticsAggregationJobPayloadV1 {
  version: 1;
  granularity: '1m' | '5m' | '1h' | '24h';
  windowStart?: string;
  windowEnd?: string;
  executedAt: string;
}

/**
 * Payload schema for repeatable Log Retention Cleanup jobs.
 */
export interface LogCleanupJobPayloadV1 {
  version: 1;
  retentionDays: number;
  dryRun?: boolean;
  executedAt: string;
}

export type JobPayloadType =
  | LogJobPayloadV1
  | AiAnalysisJobPayloadV1
  | NotificationJobPayloadV1
  | HealthCheckJobPayloadV1
  | AnalyticsAggregationJobPayloadV1
  | LogCleanupJobPayloadV1;

/**
 * Payload validation result
 */
export interface PayloadValidationResult<T> {
  isValid: boolean;
  data?: T;
  errors?: string[];
}

/**
 * Validates incoming BullMQ log job payloads before processing.
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

/**
 * Validates AI Analysis payload
 */
export const validateAiAnalysisPayload = (payload: unknown): PayloadValidationResult<AiAnalysisJobPayloadV1> => {
  if (!payload || typeof payload !== 'object') {
    return { isValid: false, errors: ['Payload must be an object'] };
  }
  const p = payload as Record<string, unknown>;
  if (!p.projectId || typeof p.projectId !== 'string') {
    return { isValid: false, errors: ['projectId string required'] };
  }
  return { isValid: true, data: p as unknown as AiAnalysisJobPayloadV1 };
};

/**
 * Validates Notification payload
 */
export const validateNotificationPayload = (payload: unknown): PayloadValidationResult<NotificationJobPayloadV1> => {
  if (!payload || typeof payload !== 'object') {
    return { isValid: false, errors: ['Payload must be an object'] };
  }
  const p = payload as Record<string, unknown>;
  if (!p.projectId || !p.alertId) {
    return { isValid: false, errors: ['projectId and alertId required'] };
  }
  return { isValid: true, data: p as unknown as NotificationJobPayloadV1 };
};
