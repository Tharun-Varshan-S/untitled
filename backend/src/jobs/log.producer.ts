import { logQueue, LOG_QUEUE_NAME } from './log.queue';
import { logger } from '../utils/logger';
import { JobsOptions } from 'bullmq';

export interface LogIngestionJobData {
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

export const JOB_NAMES = {
  PROCESS_SINGLE_LOG: 'process-single-log',
  PROCESS_BATCH_LOGS: 'process-batch-logs',
} as const;

/**
 * Enqueue a single log processing job into BullMQ queue.
 */
export const addLogJob = async (
  data: LogIngestionJobData,
  opts?: JobsOptions
) => {
  try {
    const job = await logQueue.add(JOB_NAMES.PROCESS_SINGLE_LOG, data, opts);
    logger.info(`[Producer] Enqueued job #${job.id} into queue '${LOG_QUEUE_NAME}'`);
    return job;
  } catch (error) {
    logger.error(`[Producer] Failed to enqueue log job: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};
