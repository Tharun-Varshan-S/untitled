import { QueueEvents } from 'bullmq';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import { LOG_QUEUE_NAME } from './log.queue';

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
 * QueueEvents instance for listening to global state transitions across all processes.
 * Uses logger.debug for routine job state changes to keep developer terminal clean.
 */
export const logQueueEvents = new QueueEvents(LOG_QUEUE_NAME, {
  connection: parseRedisConnection(),
});

logQueueEvents.on('waiting', ({ jobId }) => {
  logger.debug(`⌛ [QueueEvent] Job #${jobId} is in waiting state.`);
});

logQueueEvents.on('active', ({ jobId, prev }) => {
  logger.debug(`⚡ [QueueEvent] Job #${jobId} moved to active state (prev state: ${prev}).`);
});

logQueueEvents.on('completed', ({ jobId }) => {
  logger.debug(`✅ [QueueEvent] Job #${jobId} completed.`);
});

logQueueEvents.on('failed', ({ jobId, failedReason }) => {
  logger.error(`❌ [QueueEvent] Job #${jobId} failed. Reason: ${failedReason}`);
});

logQueueEvents.on('progress', ({ jobId, data }) => {
  logger.debug(`📈 [QueueEvent] Job #${jobId} reported progress: ${data}%`);
});

logQueueEvents.on('delayed', ({ jobId, delay }) => {
  logger.debug(`⏱️ [QueueEvent] Job #${jobId} delayed for ${delay}ms.`);
});

logQueueEvents.on('drained', () => {
  logger.debug(`🧹 [QueueEvent] Queue '${LOG_QUEUE_NAME}' is now drained.`);
});
