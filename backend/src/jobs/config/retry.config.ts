import { JobsOptions } from 'bullmq';

/**
 * Standard Retry Policies for LogLens Background Jobs.
 */
export const RETRY_POLICIES = {
  /**
   * Exponential Backoff Strategy for Database I/O & Network tasks.
   * Attempt 1: Wait 1 second
   * Attempt 2: Wait 2 seconds
   * Attempt 3: Wait 4 seconds
   */
  EXPONENTIAL_BACKOFF: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: {
      age: 3600,
      count: 1000,
    },
    removeOnFail: {
      age: 86400,
      count: 5000,
    },
  } as JobsOptions,

  /**
   * Linear/Fixed Backoff Strategy for Rate-Limited Third-Party Services.
   */
  FIXED_BACKOFF: {
    attempts: 5,
    backoff: {
      type: 'fixed',
      delay: 2000,
    },
  } as JobsOptions,
};
