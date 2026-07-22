import { JobsOptions } from 'bullmq';

/**
 * Standard Delayed Job Presets for LogLens.
 */
export const DELAY_PRESETS = {
  /**
   * Short debounce window (e.g. 5 seconds) to aggregate rapid incoming error logs
   * before triggering AI root-cause analysis.
   */
  AI_ANALYSIS_DEBOUNCE_MS: 5000,

  /**
   * Alert Notification Cooldown / Batching (e.g. 10 seconds) to avoid spamming
   * developers with instant individual notification emails/Slack messages.
   */
  ALERT_NOTIFICATION_COOLDOWN_MS: 10000,

  /**
   * Delayed retry cooldown for rate-limited external webhooks (e.g. 15 seconds).
   */
  EXTERNAL_WEBHOOK_RETRY_MS: 15000,
};

/**
 * Helper utility to convert a future target timestamp (in Epoch MS) into a BullMQ delay duration.
 *
 * @param targetTimestampMs - Target execution time in milliseconds since epoch
 * @returns Delay duration in milliseconds (clamped to 0 if time is in the past)
 */
export const calculateDelayUntil = (targetTimestampMs: number): number => {
  const now = Date.now();
  const delay = targetTimestampMs - now;
  return delay > 0 ? delay : 0;
};

/**
 * Helper to construct JobsOptions with delay and retry policies merged.
 */
export const createDelayedJobOptions = (delayMs: number, customOpts?: Partial<JobsOptions>): JobsOptions => {
  return {
    delay: Math.max(0, delayMs),
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: { age: 3600, count: 1000 },
    removeOnFail: { age: 86400, count: 5000 },
    ...customOpts,
  };
};
