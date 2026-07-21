import { logQueue, LOG_QUEUE_NAME } from './log.queue';
import { logger } from '../utils/logger';
import { JobsOptions } from 'bullmq';
import { LogJobPayloadV1 } from './payloads/log-payload.dto';

export type LogIngestionJobData = Omit<LogJobPayloadV1, 'version'> & { version?: 1 };

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
