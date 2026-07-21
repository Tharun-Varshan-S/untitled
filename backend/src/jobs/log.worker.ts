import { Worker, Job, QueueEvents } from 'bullmq';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import { LOG_QUEUE_NAME } from './log.queue';
import { LogIngestionJobData } from './log.producer';

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
 * Worker processor function for log ingestion jobs.
 */
export const processLogJob = async (job: Job<LogIngestionJobData>) => {
  logger.info(`[Worker] Starting Job #${job.id} (Attempt ${job.attemptsMade + 1}/${job.opts.attempts})`);

  // Step 1: Validate payload
  await job.updateProgress(25);
  if (!job.data.projectId || !job.data.message) {
    throw new Error(`Invalid log payload for job #${job.id}: missing projectId or message`);
  }

  // Step 2: Simulate Failure for testing lifecycle if requested
  if (job.data.simulateFailure && job.attemptsMade < 2) {
    await job.updateProgress(50);
    throw new Error(`Simulated transient error for job #${job.id} (Attempt ${job.attemptsMade + 1})`);
  }

  // Step 3: Processing & Persistence Simulation
  await job.updateProgress(75);
  await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate DB I/O delay

  // Step 4: Complete Job
  await job.updateProgress(100);

  return {
    success: true,
    processedAt: new Date().toISOString(),
    jobId: job.id,
    projectId: job.data.projectId,
  };
};

/**
 * BullMQ Worker Instance
 */
export const logWorker = new Worker<LogIngestionJobData>(
  LOG_QUEUE_NAME,
  processLogJob,
  {
    connection: parseRedisConnection(),
    concurrency: 5,
  }
);

/**
 * QueueEvents instance to observe real-time queue events globally.
 */
export const logQueueEvents = new QueueEvents(LOG_QUEUE_NAME, {
  connection: parseRedisConnection(),
});

// ── Worker & Queue Event Listeners for Lifecycle Monitoring ──

logWorker.on('active', (job) => {
  logger.info(`⚡ [Event: Active] Job #${job.id} is now active and being processed by worker.`);
});

logWorker.on('completed', (job, result) => {
  logger.info(`✅ [Event: Completed] Job #${job.id} completed successfully. Result: ${JSON.stringify(result)}`);
});

logWorker.on('failed', (job, err) => {
  logger.error(`❌ [Event: Failed] Job #${job?.id} failed with error: "${err.message}". Attempts made: ${job?.attemptsMade}/${job?.opts.attempts}`);
});

logWorker.on('progress', (job, progress) => {
  logger.info(`📈 [Event: Progress] Job #${job.id} progress updated: ${progress}%`);
});

logQueueEvents.on('waiting', ({ jobId }) => {
  logger.info(`⌛ [Event: Waiting] Job #${jobId} entered the waiting state in Redis.`);
});

logQueueEvents.on('delayed', ({ jobId, delay }) => {
  logger.info(`⏱️ [Event: Delayed] Job #${jobId} is delayed by ${delay}ms.`);
});

logQueueEvents.on('drained', () => {
  logger.info(`🧹 [Event: Drained] All jobs in queue '${LOG_QUEUE_NAME}' have been processed.`);
});

logQueueEvents.on('removed', ({ jobId }) => {
  logger.info(`🗑️ [Event: Removed] Job #${jobId} was removed from the queue.`);
});
