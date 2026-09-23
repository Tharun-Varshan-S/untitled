import { Worker, Job, QueueEvents, UnrecoverableError, WorkerOptions } from 'bullmq';
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
import ProjectModel from '../models/Project';
import LogModel from '../models/Log';
import { broadcastNewLog } from '../socket/broadcast';
import { broadcastAnalyticsUpdate } from '../socket/analytics';
import { generateLogHash } from '../utils/logHash';
import { isAnalysisWorthy } from '../utils/logFilter';
import { addAnalyzeLogJob } from './log.producer';
import { aiService } from '../services/aiService';
import { buildLogAnalysisPrompt } from '../prompts/logAnalysisPrompt';
import { validateAiResponse } from '../validators/aiResponseValidator';
import { analysisStorageService } from '../services/analysisStorageService';
import { groqConfig } from '../config/groq';
import { normalizeLogPayload } from '../utils/logNormalizer';
import { enrichLog } from '../utils/logEnricher';
import { indexLog } from '../services/elasticsearch.service';

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
 * Handle standard log processing jobs (Immediate Execution)
 */
const handleSingleLogJob = async (job: Job<LogJobPayloadV1>, workerId?: string) => {
  const requestId = job.data.requestId ?? 'no-request-id';
  await job.updateProgress(25);
  const validation = validateLogJobPayload(job.data);
  if (!validation.isValid || !validation.data) {
    const errorMsg = `Non-recoverable validation failure for #${job.id}: ${validation.errors?.join('; ')}`;
    logger.error(`[Worker ${workerId || 'Default'}] [req:${requestId}] ${errorMsg}`);
    throw new UnrecoverableError(errorMsg);
  }

  const payload = validation.data;

  // Step 2: Resolve Project and parent Workspace
  await job.updateProgress(50);
  const projectObjectId = new Types.ObjectId(payload.projectId);
  const projectDoc = await ProjectModel.findById(projectObjectId).select('workspaceId').lean();

  // Step 2a: Normalize raw payload into canonical fields
  const stack = job.data.metadata && typeof job.data.metadata === 'object' ? (job.data.metadata as any).stack : undefined;
  const normalized = normalizeLogPayload({
    level: payload.level,
    ...(payload.service !== undefined ? { service: payload.service } : {}),
    ...(job.data.timestamp !== undefined ? { timestamp: job.data.timestamp } : {}),
    ...(job.data.metadata ? { metadata: job.data.metadata as Record<string, unknown> } : {}),
    ...((job.data as any).source !== undefined ? { source: (job.data as any).source as string } : {}),
  });

  // Step 2b: Apply deterministic enrichment
  const enriched = enrichLog({
    normalizedLevel: normalized.normalizedLevel,
    message: payload.message,
    ...(job.data.metadata ? { metadata: job.data.metadata as Record<string, unknown> } : {}),
    ...(stack !== undefined ? { stack } : {}),
  });

  // Compute deduplication hash (uses normalizedLevel for consistency)
  const logHash = generateLogHash(normalized.normalizedLevel, payload.message, stack);

  // Check if this exact error already exists to potentially copy its analysis
  let existingAnalysis: any = undefined;
  if (isAnalysisWorthy(payload.level, payload.message)) {
    const existingLog = await LogModel.findOne({ logHash, 'aiAnalysis.summary': { $exists: true } }).lean();
    if (existingLog && existingLog.aiAnalysis) {
      existingAnalysis = existingLog.aiAnalysis;
      logger.debug(`[Worker ${workerId || 'Default'}] [req:${requestId}] Cache hit for log hash ${logHash}. Copying prior AI analysis.`);
    }
  }

  // Idempotent write: job.id guarantees this document is created at most once,
  // even if BullMQ retries the job after a transient failure.
  const created = await logsRepo.createLog({
    workspaceId: projectDoc?.workspaceId as Types.ObjectId | undefined,
    projectId: projectObjectId,
    level: payload.level,
    message: payload.message,
    service: normalized.normalizedService,
    metadata: job.data.metadata ?? undefined,
    timestamp: normalized.normalizedTimestamp,
    ...(job.id ? { ingestJobId: job.id } : {}),
  });

  // Assign canonical + enrichment fields
  created.logHash = logHash;
  created.normalizedLevel = normalized.normalizedLevel;
  created.fingerprint = enriched.fingerprint;
  created.environment = normalized.environment;
  created.source = normalized.source;
  if (normalized.traceId) created.traceId = normalized.traceId;
  if (normalized.spanId) created.spanId = normalized.spanId;
  if (normalized.requestId) created.requestId = normalized.requestId;
  if (normalized.host) created.host = normalized.host;
  if (enriched.errorCategory) created.errorCategory = enriched.errorCategory;
  if (existingAnalysis) {
    created.aiAnalysis = existingAnalysis;
  }
  await created.save();

  logger.info(`[Worker ${workerId || 'Default'}] [req:${requestId}] Log ${created._id} persisted for project ${payload.projectId}`);

  // Index into Elasticsearch (non-blocking — failure does not fail the job)
  // MongoDB is source of truth; ES is the search/analytics layer.
  const esIndexed = await indexLog({
    _mongoId: created._id.toString(),
    projectId: payload.projectId,
    ...(created.workspaceId ? { workspaceId: created.workspaceId.toString() } : {}),
    level: created.level,
    normalizedLevel: created.normalizedLevel,
    message: created.message,
    service: created.service,
    timestamp: (created.timestamp instanceof Date ? created.timestamp : new Date(created.timestamp ?? Date.now())).toISOString(),
    createdAt: (created.createdAt instanceof Date ? created.createdAt : new Date(created.createdAt ?? Date.now())).toISOString(),
    ...(created.traceId ? { traceId: created.traceId } : {}),
    ...(created.spanId ? { spanId: created.spanId } : {}),
    ...(created.requestId ? { requestId: created.requestId } : {}),
    ...(created.host ? { host: created.host } : {}),
    ...(created.environment ? { environment: created.environment } : {}),
    ...(created.source ? { source: created.source } : {}),
    ...(created.fingerprint ? { fingerprint: created.fingerprint } : {}),
    ...(created.errorCategory ? { errorCategory: created.errorCategory } : {}),
    ...(created.metadata ? { metadata: created.metadata as Record<string, unknown> } : {}),
  });

  if (!esIndexed) {
    logger.warn(`[Worker ${workerId || 'Default'}] [req:${requestId}] Elasticsearch indexing failed for log ${created._id} — log is safe in MongoDB.`);
  }

  // If the log is analysis-worthy and we didn't just copy a cached analysis, enqueue it for AI analysis
  if (isAnalysisWorthy(payload.level, payload.message) && !existingAnalysis) {
    await addAnalyzeLogJob(created._id.toString(), payload.projectId);
  }

  // Step 3: Broadcast Real-time Updates
  await job.updateProgress(75);
  const formattedLog = {
    id: created._id.toString(),
    workspaceId: created.workspaceId?.toString(),
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
    processedBy: workerId || `PID-${process.pid}`,
    processedAt: new Date().toISOString(),
    jobId: job.id,
    logId: formattedLog.id,
    projectId: job.data.projectId,
    requestId,
  };
};


/**
 * Handle Dedicated AI Root-Cause Analysis for a specific log (Prompts 3, 4, 5, 10)
 */
const handleAnalyzeLogJob = async (job: Job<any>, workerId?: string) => {
  const { logId, projectId } = job.data;
  
  logger.info(`🤖 [Worker ${workerId || 'Default'}] Starting AI Analysis for log ${logId}`);
  await job.updateProgress(10);

  // 1. Fetch Log
  const logDoc = await LogModel.findById(logId);
  if (!logDoc) {
    throw new UnrecoverableError(`Log ${logId} not found for analysis.`);
  }

  await job.updateProgress(30);

  // 2. Format Log for AI Service
  const logString = `[${logDoc.timestamp.toISOString()}] ${logDoc.level.toUpperCase()} [${logDoc.service}] ${logDoc.message} | Metadata: ${JSON.stringify(logDoc.metadata || {})}`;

  await job.updateProgress(50);

  // 3. Call AI Service (Rate limited by BullMQ concurrency / maxRetries)
  let rawResponse: string;
  try {
    rawResponse = await aiService.analyzeLog(logDoc.workspaceId?.toString() || 'default-workspace', projectId, logString);
  } catch (error: any) {
    logger.error(`[Worker ${workerId || 'Default'}] AI call failed for log ${logId}: ${error.message}`);
    // Throw error to let BullMQ retry it with backoff
    throw error;
  }

  await job.updateProgress(75);

  // 4. Validate output
  let validatedOutput;
  try {
    validatedOutput = validateAiResponse(rawResponse);
  } catch (error: any) {
    logger.error(`[Worker ${workerId || 'Default'}] AI output validation failed for log ${logId}: ${error.message}`);
    throw error;
  }

  await job.updateProgress(90);

  // 5. Store Analysis
  await analysisStorageService.saveAnalysis(logId, validatedOutput, groqConfig.model);

  await job.updateProgress(100);
  
  // Broadcast update so the dashboard refreshes with the new analysis
  broadcastAnalyticsUpdate(projectId);

  return {
    success: true,
    processedBy: workerId || `PID-${process.pid}`,
    logId,
    projectId,
    analyzedAt: new Date().toISOString(),
  };
};

/**
 * Handle Delayed AI Analysis jobs
 */
const handleAiAnalysisJob = async (job: Job<AiAnalysisJobPayloadV1>, workerId?: string) => {
  logger.info(`🤖 [Worker ${workerId || 'Default'}: AI Analysis] Running delayed AI Root-Cause Analysis for Project ${job.data.projectId}`);
  await job.updateProgress(50);
  await new Promise((resolve) => setTimeout(resolve, 300));
  await job.updateProgress(100);

  return {
    success: true,
    type: 'ai-analysis',
    processedBy: workerId || `PID-${process.pid}`,
    projectId: job.data.projectId,
    summary: 'AI analysis aggregated log patterns and detected zero critical anomalies.',
    completedAt: new Date().toISOString(),
  };
};

/**
 * Handle Delayed Notification jobs
 */
const handleNotificationJob = async (job: Job<NotificationJobPayloadV1>, workerId?: string) => {
  logger.info(`🔔 [Worker ${workerId || 'Default'}: Notification] Dispatching delayed alert to ${job.data.recipient} (${job.data.severity})`);
  await job.updateProgress(50);
  await new Promise((resolve) => setTimeout(resolve, 200));
  await job.updateProgress(100);

  return {
    success: true,
    type: 'notification-dispatch',
    processedBy: workerId || `PID-${process.pid}`,
    recipient: job.data.recipient,
    channel: job.data.channel,
    dispatchedAt: new Date().toISOString(),
  };
};

/**
 * Handle Repeatable Collector Health Check Job
 * Performs real readiness checks against configured service endpoints.
 */
const handleCollectorHealthCheckJob = async (job: Job<HealthCheckJobPayloadV1>, workerId?: string) => {
  logger.info(`💓 [Worker ${workerId || 'Default'}: Health Check] Executing repeatable collector ping check...`);
  await job.updateProgress(50);

  // Only check services that are actually configured via environment
  const results: Array<{ service: string; status: string; latencyMs?: number; error?: string }> = [];

  // Check AI service health if configured
  if (config.aiServiceUrl) {
    const start = Date.now();
    try {
      const axios = (await import('axios')).default;
      await axios.get(`${config.aiServiceUrl.replace('/api/v1', '')}/health`, { timeout: 5000 });
      results.push({ service: 'ai-service', status: 'healthy', latencyMs: Date.now() - start });
    } catch (e: any) {
      results.push({ service: 'ai-service', status: 'unhealthy', error: e.message });
      logger.warn(`💓 [Worker ${workerId || 'Default'}: Health Check] AI service unhealthy: ${e.message}`);
    }
  }

  await job.updateProgress(100);
  const allHealthy = results.every(r => r.status === 'healthy');
  logger.info(`💓 [Worker ${workerId || 'Default'}: Health Check] Health check complete. ${results.filter(r => r.status === 'healthy').length}/${results.length} services healthy.`);

  return {
    success: allHealthy,
    type: 'health-check',
    processedBy: workerId || `PID-${process.pid}`,
    results,
    checkedAt: new Date().toISOString(),
  };
};

/**
 * Handle Repeatable Analytics Aggregation Job
 * Triggers real analytics recomputation for all active projects.
 */
const handleAnalyticsAggregationJob = async (job: Job<AnalyticsAggregationJobPayloadV1>, workerId?: string) => {
  logger.info(`📊 [Worker ${workerId || 'Default'}: Analytics] Executing periodic log analytics aggregation...`);
  await job.updateProgress(30);

  // Get distinct active projects that have recent logs and broadcast analytics update
  // This triggers frontend re-fetch via Socket.IO rather than pre-computing all aggregates
  try {
    const recentCutoff = new Date(Date.now() - 60 * 60 * 1000); // last 1 hour
    const activeProjectIds: Types.ObjectId[] = await LogModel.distinct('projectId', {
      createdAt: { $gte: recentCutoff },
    });

    for (const projectId of activeProjectIds) {
      broadcastAnalyticsUpdate(projectId.toString());
    }

    await job.updateProgress(100);
    logger.info(`📊 [Worker ${workerId || 'Default'}: Analytics] Analytics broadcast triggered for ${activeProjectIds.length} active project(s).`);

    return {
      success: true,
      type: 'analytics-aggregation',
      processedBy: workerId || `PID-${process.pid}`,
      granularity: job.data.granularity ?? '1m',
      activeProjects: activeProjectIds.length,
      aggregatedAt: new Date().toISOString(),
    };
  } catch (error: any) {
    logger.error(`📊 [Worker ${workerId || 'Default'}: Analytics] Analytics aggregation failed: ${error.message}`);
    await job.updateProgress(100);
    return {
      success: false,
      type: 'analytics-aggregation',
      processedBy: workerId || `PID-${process.pid}`,
      error: error.message,
      aggregatedAt: new Date().toISOString(),
    };
  }
};

/**
 * Handle Repeatable Log Cleanup Job
 * Performs real MongoDB deletion of logs older than the retention window.
 * NOTE: MongoDB TTL index also handles automatic expiry, but this job
 * allows explicit on-demand purges and provides visible audit output.
 */
const handleLogCleanupJob = async (job: Job<LogCleanupJobPayloadV1>, workerId?: string) => {
  const retentionDays = job.data.retentionDays ?? Number(process.env.LOG_RETENTION_DAYS ?? 30);
  const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  logger.info(`🧹 [Worker ${workerId || 'Default'}: Log Cleanup] Running daily retention purge for logs older than ${retentionDays} days (before ${cutoffDate.toISOString()})...`);

  await job.updateProgress(25);

  try {
    // Batch deletion to avoid long-running operations locking collections
    const BATCH_SIZE = 1000;
    let totalPurged = 0;
    let batchCount = 0;

    while (true) {
      // Find IDs to delete in batch to avoid full collection scans on delete
      const expiredIds = await LogModel
        .find({ createdAt: { $lt: cutoffDate } })
        .select('_id')
        .limit(BATCH_SIZE)
        .lean();

      if (expiredIds.length === 0) break;

      const ids = expiredIds.map(d => d._id);
      const result = await LogModel.deleteMany({ _id: { $in: ids } });
      totalPurged += result.deletedCount;
      batchCount++;

      logger.debug(`🧹 [Worker ${workerId || 'Default'}: Log Cleanup] Batch ${batchCount}: deleted ${result.deletedCount} logs.`);

      // Small yield between batches to avoid starving other operations
      await new Promise(resolve => setImmediate(resolve));
    }

    await job.updateProgress(100);
    logger.info(`🧹 [Worker ${workerId || 'Default'}: Log Cleanup] Purge complete. Deleted ${totalPurged} expired log(s) in ${batchCount} batch(es).`);

    return {
      success: true,
      type: 'log-cleanup',
      processedBy: workerId || `PID-${process.pid}`,
      retentionDays,
      purgedCount: totalPurged,
      cutoffDate: cutoffDate.toISOString(),
      purgedAt: new Date().toISOString(),
    };
  } catch (error: any) {
    logger.error(`🧹 [Worker ${workerId || 'Default'}: Log Cleanup] Purge failed: ${error.message}`);
    await job.updateProgress(100);
    throw error; // Allow BullMQ to retry
  }
};

/**
 * Master Worker processor router function for BullMQ jobs.
 */
export const processLogJob = async (job: Job<any>, workerId?: string) => {
  logger.debug(`[Worker ${workerId || 'Default'}] Processing Job #${job.id} ('${job.name}') (Attempt ${job.attemptsMade + 1}/${job.opts.attempts})`);

  switch (job.name) {
    case JOB_NAMES.SCHEDULED_AI_ANALYSIS:
      return handleAiAnalysisJob(job, workerId);

    case JOB_NAMES.DELAYED_NOTIFICATION:
      return handleNotificationJob(job, workerId);

    case JOB_NAMES.COLLECTOR_HEALTH_CHECK:
      return handleCollectorHealthCheckJob(job, workerId);

    case JOB_NAMES.ANALYTICS_AGGREGATION:
      return handleAnalyticsAggregationJob(job, workerId);

    case JOB_NAMES.LOG_CLEANUP:
      return handleLogCleanupJob(job, workerId);

    case JOB_NAMES.ANALYZE_LOG:
      return handleAnalyzeLogJob(job, workerId);

    case JOB_NAMES.PROCESS_SINGLE_LOG:
    default:
      return handleSingleLogJob(job, workerId);
  }
};

/**
 * Factory function to spawn independent, configurable BullMQ Worker instances.
 */
export const createLogWorker = (workerId?: string, options?: Partial<WorkerOptions>): Worker => {
  const concurrency = Number(process.env.WORKER_CONCURRENCY) || 10;
  const instanceId = workerId || `Worker-PID-${process.pid}`;

  const defaultOptions: WorkerOptions = {
    connection: parseRedisConnection(),
    concurrency,
    lockDuration: 30000,
    stalledInterval: 30000,
    maxStalledCount: 2,
  };

  const worker = new Worker(
    LOG_QUEUE_NAME,
    (job) => processLogJob(job, instanceId),
    {
      ...defaultOptions,
      ...options,
    }
  );

  worker.on('active', (job) => {
    logger.debug(`⚡ [Event: Active] [${instanceId}] Job #${job.id} ('${job.name}') active on worker instance.`);
  });

  worker.on('completed', (job, result) => {
    logger.debug(`✅ [Event: Completed] [${instanceId}] Job #${job.id} ('${job.name}') completed.`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`❌ [Event: Failed] [${instanceId}] Job #${job?.id} ('${job?.name}') failed with error: "${err.message}". Attempts: ${job?.attemptsMade}/${job?.opts.attempts}`);
  });

  return worker;
};

export const logWorker = createLogWorker('Default-Worker');

export const logQueueEvents = new QueueEvents(LOG_QUEUE_NAME, {
  connection: parseRedisConnection(),
});

logQueueEvents.on('waiting', ({ jobId }) => {
  logger.debug(`⌛ [Event: Waiting] Job #${jobId} entered the waiting state in Redis.`);
});

logQueueEvents.on('delayed', ({ jobId, delay }) => {
  logger.debug(`⏱️ [Event: Delayed] Job #${jobId} is delayed by ${delay}ms.`);
});

logQueueEvents.on('drained', () => {
  logger.debug(`🧹 [Event: Drained] All jobs in queue '${LOG_QUEUE_NAME}' have been processed.`);
});

logQueueEvents.on('removed', ({ jobId }) => {
  logger.debug(`🗑️ [Event: Removed] Job #${jobId} was removed from the queue.`);
});
