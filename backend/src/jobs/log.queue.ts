import { Queue } from 'bullmq';
import { config } from '../config/env';
import { logger } from '../utils/logger';

export const LOG_QUEUE_NAME = 'log-ingestion';

/**
 * Helper to parse Redis connection options for BullMQ (ioredis compatibility)
 */
const parseRedisConnection = () => {
  try {
    const url = new URL(config.redisUrl);
    return {
      host: url.hostname || 'localhost',
      port: Number(url.port) || 6379,
    };
  } catch {
    return {
      host: 'localhost',
      port: 6379,
    };
  }
};

/**
 * Production-grade BullMQ Queue instance for log ingestion and processing tasks.
 */
export const logQueue = new Queue(LOG_QUEUE_NAME, {
  connection: parseRedisConnection(),
  defaultJobOptions: {
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
  },
});

logger.info(`BullMQ Queue '${LOG_QUEUE_NAME}' initialized.`);
