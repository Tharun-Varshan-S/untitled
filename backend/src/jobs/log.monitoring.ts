import { logQueue, LOG_QUEUE_NAME } from './log.queue';
import { logger } from '../utils/logger';

export interface QueueMetrics {
  queueName: string;
  timestamp: string;
  counts: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: number;
    total: number;
  };
  schedulersCount: number;
  failureRatePercentage: number;
  status: 'healthy' | 'degraded' | 'critical';
}

/**
 * Retrieves comprehensive queue metrics and state counts using BullMQ inspection APIs.
 */
export const getQueueMetrics = async (): Promise<QueueMetrics> => {
  const [rawCounts, schedulers] = await Promise.all([
    logQueue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed', 'paused'),
    logQueue.getJobSchedulers(),
  ]);

  const counts = {
    waiting: rawCounts.waiting ?? 0,
    active: rawCounts.active ?? 0,
    completed: rawCounts.completed ?? 0,
    failed: rawCounts.failed ?? 0,
    delayed: rawCounts.delayed ?? 0,
    paused: rawCounts.paused ?? 0,
  };

  const total = counts.waiting + counts.active + counts.completed + counts.failed + counts.delayed + counts.paused;
  const processedTotal = counts.completed + counts.failed;
  const failureRatePercentage = processedTotal > 0 ? Number(((counts.failed / processedTotal) * 100).toFixed(2)) : 0;

  // Determine Queue Health Status based on operational thresholds
  let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
  if (counts.failed > 100 || counts.waiting > 1000 || failureRatePercentage > 20) {
    status = 'critical';
  } else if (counts.failed > 20 || counts.waiting > 100 || failureRatePercentage > 5) {
    status = 'degraded';
  }

  return {
    queueName: LOG_QUEUE_NAME,
    timestamp: new Date().toISOString(),
    counts: {
      ...counts,
      total,
    },
    schedulersCount: schedulers.length,
    failureRatePercentage,
    status,
  };
};

/**
 * Inspection API: Retrieve detailed summary of failed jobs for root cause analysis.
 */
export const getFailedJobsSummary = async (limit = 10) => {
  const failedJobs = await logQueue.getFailed(0, limit - 1);
  return failedJobs.map((job) => ({
    id: job.id,
    name: job.name,
    data: job.data,
    failedReason: job.failedReason,
    stacktrace: job.stacktrace,
    attemptsMade: job.attemptsMade,
    timestamp: new Date(job.timestamp).toISOString(),
    failedAt: job.finishedOn ? new Date(job.finishedOn).toISOString() : null,
  }));
};

/**
 * Inspection API: Clear completed or failed jobs older than specified grace period (ms).
 */
export const cleanQueueHistory = async (gracePeriodMs = 3600000) => {
  const cleanedCompleted = await logQueue.clean(gracePeriodMs, 1000, 'completed');
  const cleanedFailed = await logQueue.clean(gracePeriodMs, 1000, 'failed');
  logger.info(`🧹 [Monitoring] Cleaned ${cleanedCompleted.length} completed jobs and ${cleanedFailed.length} failed jobs older than ${gracePeriodMs}ms.`);
  return { cleanedCompletedCount: cleanedCompleted.length, cleanedFailedCount: cleanedFailed.length };
};
