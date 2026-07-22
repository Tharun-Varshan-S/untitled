import { RepeatOptions } from 'bullmq';

/**
 * Repeatable Job Scheduling Configuration & Cron Presets for LogLens.
 */
export const SCHEDULER_PRESETS = {
  /**
   * Collector Health Check: Runs every 10 seconds for real-time heartbeat monitoring.
   */
  COLLECTOR_HEALTH_CHECK: {
    every: 10000, // 10,000 milliseconds = 10s
  } as RepeatOptions,

  /**
   * Analytics Aggregation: Runs every 30 seconds to recalculate project error rates & metrics.
   */
  ANALYTICS_AGGREGATION: {
    every: 30000, // 30,000 milliseconds = 30s
  } as RepeatOptions,

  /**
   * Daily Log Retention Cleanup: Standard Cron pattern running at 00:00 UTC daily (`0 0 * * *`).
   */
  DAILY_LOG_CLEANUP: {
    pattern: '0 0 * * *', // Standard 5-part cron syntax (Midnight daily)
  } as RepeatOptions,

  /**
   * Weekly Extended Report Generation: Standard Cron pattern running every Sunday at 02:00 UTC (`0 2 * * 0`).
   */
  WEEKLY_SYSTEM_REPORT: {
    pattern: '0 2 * * 0',
  } as RepeatOptions,
};

/**
 * Scheduler Identifiers for tracking and managing job schedulers in BullMQ v5.
 */
export const SCHEDULER_IDS = {
  COLLECTOR_HEALTH_CHECK: 'scheduler:collector-health-check',
  ANALYTICS_AGGREGATION: 'scheduler:analytics-aggregation',
  DAILY_LOG_CLEANUP: 'scheduler:daily-log-cleanup',
} as const;
