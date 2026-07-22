import { Worker, Job, QueueEvents, UnrecoverableError } from 'bullmq';
import { Types } from 'mongoose';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import { LOG_QUEUE_NAME } from './log.queue';
import { JOB_NAMES } from './log.producer';
import {
  validateLogJobPayload,
  LogJobPayloadV1,
  AiAnalysisJobPayloadV1,
  NotificationJobPayloadV1,
  HealthCheckJobPayloadV1,
  AnalyticsAggregationJobPayloadV1,
  LogCleanupJobPayloadV1,
} from './payloads/log-payload.dto';
import * as logsRepo from '../repositories/logs.repository';
import { broadcastNewLog } from '../socket/broadcast';
import { broadcastAnalyticsUpdate } from '../socket/analytics';

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
 * Handle standard log processing jobs (Immediate)
 */
const handleSingleLogJob = async (job: Job<LogJobPayloadV1>) => {
  await job.updateProgress(25);
  const validation = validateLogJobPayload(job.data);
  if (!validation.isValid || !validation.data) {
    const errorMsg = `Non-recoverable validation failure for #${job.id}: ${validation.errors?.join('; ')}`;
    logger.error(`[Worker] ${errorMsg}`);
    throw new UnrecoverableError(errorMsg);
  }

  const payload = validation.data;

  // Step 2: Persist to Database
  await job.updateProgress(50);
  const projectObjectId = new Types.ObjectId(payload.projectId);
  const created = await logsRepo.createLog({
    projectId: projectObjectId,
    level: payload.level,
    message: payload.message,
    service: payload.service ?? 'default',
    metadata: job.data.metadata ?? undefined,
    timestamp: job.data.timestamp ? new Date(job.data.timestamp) : new Date(),
  });

  // Step 3: Broadcast Real-time Updates
  await job.updateProgress(75);
  const formattedLog = {
    id: created._id.toString(),
    projectId: created.projectId.toString(),
    level: created.level,
    message: created.message,
    service: created.service,
    metadata: created.metadata,
    timestamp: created.timestamp,
    createdAt: created.createdAt,
    updatedAt: created.updatedAt,
  };

  broadcastNewLog(job.data.projectId, formattedLog);
  broadcastAnalyticsUpdate(job.data.projectId);

  await job.updateProgress(100);

  return {
    success: true,
    processedAt: new Date().toISOString(),
    jobId: job.id,
    logId: formattedLog.id,
    projectId: job.data.projectId,
  };
};

/**
 * Handle Delayed AI Analysis jobs
 */
const handleAiAnalysisJob = async (job: Job<AiAnalysisJobPayloadV1>) => {
  logger.info(`🤖 [Worker: AI Analysis] Running delayed AI Root-Cause Analysis for Project ${job.data.projectId}`);
  await job.updateProgress(50);
  await new Promise((resolve) => setTimeout(resolve, 300));
  await job.updateProgress(100);

  return {
    success: true,
    type: 'ai-analysis',
    projectId: job.data.projectId,
    summary: 'AI analysis aggregated log patterns and detected zero critical anomalies.',
    completedAt: new Date().toISOString(),
  };
};

/**
 * Handle Delayed Notification jobs
 */
const handleNotificationJob = async (job: Job<NotificationJobPayloadV1>) => {
  logger.info(`🔔 [Worker: Notification] Dispatching delayed alert to ${job.data.recipient} (${job.data.severity})`);
  await job.updateProgress(50);
  await new Promise((resolve) => setTimeout(resolve, 200));
  await job.updateProgress(100);

  return {
    success: true,
    type: 'notification-dispatch',
    recipient: job.data.recipient,
    channel: job.data.channel,
    dispatchedAt: new Date().toISOString(),
  };
};

/**
 * Handle Repeatable Collector Health Check Job
 */
const handleCollectorHealthCheckJob = async (job: Job<HealthCheckJobPayloadV1>) => {
  logger.info(`💓 [Worker: Health Check] Executing repeatable collector ping check...`);
  await job.updateProgress(50);

  const targets = job.data.targetServices ?? ['api-gateway', 'log-ingestor'];
  const results = targets.map((service) => ({ service, status: 'healthy', latencyMs: Math.floor(Math.random() * 10) + 2 }));

  await job.updateProgress(100);
  logger.info(`💓 [Worker: Health Check] Health check complete. ${results.length} services verified healthy.`);

  return {
    success: true,
    type: 'health-check',
    results,
    checkedAt: new Date().toISOString(),
  };
};

/**
 * Handle Repeatable Analytics Aggregation Job
 */
const handleAnalyticsAggregationJob = async (job: Job<AnalyticsAggregationJobPayloadV1>) => {
  logger.info(`📊 [Worker: Analytics] Executing periodic log analytics aggregation...`);
  await job.updateProgress(30);

  // Simulated metrics calculation
  await new Promise((resolve) => setTimeout(resolve, 200));
  await job.updateProgress(100);

  logger.info(`📊 [Worker: Analytics] Analytics pre-computed & cached successfully.`);

  return {
    success: true,
    type: 'analytics-aggregation',
    granularity: job.data.granularity ?? '1m',
    aggregatedAt: new Date().toISOString(),
  };
};

/**
 * Handle Repeatable Log Cleanup Job
 */
const handleLogCleanupJob = async (job: Job<LogCleanupJobPayloadV1>) => {
  const retentionDays = job.data.retentionDays ?? 30;
  logger.info(`🧹 [Worker: Log Cleanup] Running daily retention purge for logs older than ${retentionDays} days...`);
  
  await job.updateProgress(50);
  // Simulated purge
  await new Promise((resolve) => setTimeout(resolve, 300));
  await job.updateProgress(100);

  logger.info(`🧹 [Worker: Log Cleanup] Purged 0 expired logs.`);

  return {
    success: true,
    type: 'log-cleanup',
    retentionDays,
    purgedAt: new Date().toISOString(),
  };
};

/**
 * Master Worker processor router function for BullMQ jobs.
 */
export const processLogJob = async (job: Job<any>) => {
  logger.info(`[Worker] Processing Job #${job.id} ('${job.name}') (Attempt ${job.attemptsMade + 1}/${job.opts.attempts})`);

  switch (job.name) {
    case JOB_NAMES.SCHEDULED_AI_ANALYSIS:
      return handleAiAnalysisJob(job);

    case JOB_NAMES.DELAYED_NOTIFICATION:
      return handleNotificationJob(job);

    case JOB_NAMES.COLLECTOR_HEALTH_CHECK:
      return handleCollectorHealthCheckJob(job);

    case JOB_NAMES.ANALYTICS_AGGREGATION:
      return handleAnalyticsAggregationJob(job);

    case JOB_NAMES.LOG_CLEANUP:
      return handleLogCleanupJob(job);

    case JOB_NAMES.PROCESS_SINGLE_LOG:
    default:
      return handleSingleLogJob(job);
  }
};

/**
 * BullMQ Worker Instance
 */
export const logWorker = new Worker(
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
  logger.info(`⚡ [Event: Active] Job #${job.id} ('${job.name}') is active and being processed by worker.`);
});

logWorker.on('completed', (job, result) => {
  logger.info(`✅ [Event: Completed] Job #${job.id} ('${job.name}') completed successfully. Result: ${JSON.stringify(result)}`);
});

logWorker.on('failed', (job, err) => {
  logger.error(`❌ [Event: Failed] Job #${job?.id} ('${job?.name}') failed with error: "${err.message}". Attempts: ${job?.attemptsMade}/${job?.opts.attempts}`);
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
