import { logQueue, LOG_QUEUE_NAME } from './log.queue';
import { logger } from '../utils/logger';
import { JobsOptions } from 'bullmq';
import { LogJobPayloadV1, AiAnalysisJobPayloadV1, NotificationJobPayloadV1 } from './payloads/log-payload.dto';
import { DELAY_PRESETS, createDelayedJobOptions, calculateDelayUntil } from './config/delay.config';

export type LogIngestionJobData = Omit<LogJobPayloadV1, 'version'> & { version?: 1 };

export const JOB_NAMES = {
  PROCESS_SINGLE_LOG: 'process-single-log',
  PROCESS_BATCH_LOGS: 'process-batch-logs',
  SCHEDULED_AI_ANALYSIS: 'scheduled-ai-analysis',
  DELAYED_NOTIFICATION: 'delayed-notification',
  COLLECTOR_HEALTH_CHECK: 'collector-health-check',
  ANALYTICS_AGGREGATION: 'analytics-aggregation',
  LOG_CLEANUP: 'log-cleanup',
} as const;

/**
 * Enqueue a standard log processing job (Immediate Execution).
 */
export const addLogJob = async (
  data: LogIngestionJobData,
  opts?: JobsOptions
) => {
  try {
    const payload: LogJobPayloadV1 = {
      version: 1,
      ...data,
    };

    const job = await logQueue.add(JOB_NAMES.PROCESS_SINGLE_LOG, payload, opts);
    logger.info(`[Producer] Enqueued job #${job.id} into queue '${LOG_QUEUE_NAME}'`);
    return job;
  } catch (error) {
    logger.error(`[Producer] Failed to enqueue log job: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};

/**
 * Enqueue a batch of log processing jobs atomically using BullMQ addBulk().
 */
export const addLogBatchJob = async (
  logs: LogIngestionJobData[],
  opts?: JobsOptions
) => {
  try {
    const bulkJobs = logs.map((data) => ({
      name: JOB_NAMES.PROCESS_SINGLE_LOG,
      data: {
        version: 1 as const,
        ...data,
      },
      ...(opts ? { opts } : {}),
    }));

    const enqueuedJobs = await logQueue.addBulk(bulkJobs);
    logger.info(`[Producer] Batch enqueued ${enqueuedJobs.length} log jobs into queue '${LOG_QUEUE_NAME}'`);
    return enqueuedJobs;
  } catch (error) {
    logger.error(`[Producer] Failed to bulk enqueue log jobs: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};

/**
 * Enqueue a generic delayed job with an explicit delay in milliseconds.
 */
export const addDelayedJob = async <T>(
  name: string,
  payload: T,
  delayMs: number,
  opts?: JobsOptions
) => {
  try {
    const jobOptions = createDelayedJobOptions(delayMs, opts);
    const job = await logQueue.add(name, payload, jobOptions);
    logger.info(`⏱️ [Producer] Enqueued DELAYED job #${job.id} ('${name}') with delay ${delayMs}ms into queue '${LOG_QUEUE_NAME}'`);
    return job;
  } catch (error) {
    logger.error(`[Producer] Failed to enqueue delayed job '${name}': ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};

/**
 * Enqueue a Delayed AI Root Cause Analysis job.
 */
export const addDelayedAiAnalysisJob = async (
  projectId: string,
  triggerReason: 'threshold_exceeded' | 'error_spike' | 'scheduled_summary',
  delayMs: number = DELAY_PRESETS.AI_ANALYSIS_DEBOUNCE_MS,
  opts?: JobsOptions
) => {
  const payload: AiAnalysisJobPayloadV1 = {
    version: 1,
    projectId,
    triggerReason,
    initiatedAt: new Date().toISOString(),
  };

  return addDelayedJob(JOB_NAMES.SCHEDULED_AI_ANALYSIS, payload, delayMs, opts);
};

/**
 * Enqueue a Delayed Alert Notification job.
 */
export const addDelayedNotificationJob = async (
  projectId: string,
  alertId: string,
  channel: 'email' | 'slack' | 'webhook',
  recipient: string,
  summary: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  delayMs: number = DELAY_PRESETS.ALERT_NOTIFICATION_COOLDOWN_MS,
  opts?: JobsOptions
) => {
  const payload: NotificationJobPayloadV1 = {
    version: 1,
    projectId,
    alertId,
    channel,
    recipient,
    summary,
    severity,
    dispatchAfterMs: delayMs,
  };

  return addDelayedJob(JOB_NAMES.DELAYED_NOTIFICATION, payload, delayMs, opts);
};

/**
 * Enqueue a delayed job scheduled at a specific future Date/Timestamp.
 */
export const addJobScheduledAt = async <T>(
  name: string,
  payload: T,
  scheduledTime: Date,
  opts?: JobsOptions
) => {
  const delayMs = calculateDelayUntil(scheduledTime.getTime());
  return addDelayedJob(name, payload, delayMs, opts);
};
