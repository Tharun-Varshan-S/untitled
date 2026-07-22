import { logQueue, LOG_QUEUE_NAME } from './log.queue';
import { logger } from '../utils/logger';
import { JOB_NAMES } from './log.producer';
import { SCHEDULER_PRESETS, SCHEDULER_IDS } from './config/scheduler.config';
import {
  HealthCheckJobPayloadV1,
  AnalyticsAggregationJobPayloadV1,
  LogCleanupJobPayloadV1,
} from './payloads/log-payload.dto';

/**
 * Initialize and register all repeatable/scheduled background jobs for LogLens.
 * Uses BullMQ v5 `upsertJobScheduler` to guarantee idempotent, persistent registration in Redis.
 */
export const initLogLensSchedulers = async () => {
  try {
    logger.info(`⏰ [Scheduler] Registering repeatable jobs in Queue '${LOG_QUEUE_NAME}'...`);

    // 1. Collector Health Check (Every 10 seconds)
    const healthCheckPayload: HealthCheckJobPayloadV1 = {
      version: 1,
      checkType: 'collector_ping',
      targetServices: ['api-gateway', 'log-ingestor', 'analytics-engine'],
      executedAt: new Date().toISOString(),
    };

    await logQueue.upsertJobScheduler(
      SCHEDULER_IDS.COLLECTOR_HEALTH_CHECK,
      SCHEDULER_PRESETS.COLLECTOR_HEALTH_CHECK,
      {
        name: JOB_NAMES.COLLECTOR_HEALTH_CHECK,
        data: healthCheckPayload,
        opts: {
          attempts: 2,
          backoff: { type: 'fixed', delay: 1000 },
        },
      }
    );
    logger.info(`   ✔ Registered '${JOB_NAMES.COLLECTOR_HEALTH_CHECK}' (Interval: 10s)`);

    // 2. Analytics Aggregation (Every 30 seconds)
    const analyticsPayload: AnalyticsAggregationJobPayloadV1 = {
      version: 1,
      granularity: '1m',
      executedAt: new Date().toISOString(),
    };

    await logQueue.upsertJobScheduler(
      SCHEDULER_IDS.ANALYTICS_AGGREGATION,
      SCHEDULER_PRESETS.ANALYTICS_AGGREGATION,
      {
        name: JOB_NAMES.ANALYTICS_AGGREGATION,
        data: analyticsPayload,
        opts: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
        },
      }
    );
    logger.info(`   ✔ Registered '${JOB_NAMES.ANALYTICS_AGGREGATION}' (Interval: 30s)`);

    // 3. Log Retention Cleanup (Daily at 00:00 UTC)
    const cleanupPayload: LogCleanupJobPayloadV1 = {
      version: 1,
      retentionDays: 30,
      dryRun: false,
      executedAt: new Date().toISOString(),
    };

    await logQueue.upsertJobScheduler(
      SCHEDULER_IDS.DAILY_LOG_CLEANUP,
      SCHEDULER_PRESETS.DAILY_LOG_CLEANUP,
      {
        name: JOB_NAMES.LOG_CLEANUP,
        data: cleanupPayload,
        opts: {
          attempts: 3,
        },
      }
    );
    logger.info(`   ✔ Registered '${JOB_NAMES.LOG_CLEANUP}' (Cron: '0 0 * * *')`);

    logger.info(`⏰ [Scheduler] All repeatable jobs successfully registered in Redis.`);
  } catch (error) {
    logger.error(`❌ [Scheduler] Failed to register job schedulers: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};

/**
 * Remove a specific registered scheduler by ID.
 */
export const removeLogLensScheduler = async (schedulerId: string) => {
  try {
    await logQueue.removeJobScheduler(schedulerId);
    logger.info(`🗑️ [Scheduler] Removed job scheduler '${schedulerId}' from Redis.`);
  } catch (error) {
    logger.error(`[Scheduler] Failed to remove scheduler '${schedulerId}': ${error}`);
    throw error;
  }
};

/**
 * Utility to inspect all currently registered Job Schedulers in Redis.
 */
export const listActiveSchedulers = async () => {
  return logQueue.getJobSchedulers();
};
