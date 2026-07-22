import { Types } from 'mongoose';
import { AppError } from '../utils/AppError';
import { LogLevel } from '../models/Log';
import { LogRequest, LogResponse, PaginatedLogs } from '../types/logs.types';
import * as logsRepo from '../repositories/logs.repository';
import { addLogJob, addLogBatchJob, LogIngestionJobData } from '../jobs/log.producer';

const mapLog = (doc: { _id: any; projectId: any; level: LogLevel; message: string; service: string; metadata?: Record<string, unknown> | undefined; timestamp: Date; createdAt: Date; updatedAt: Date }): LogResponse => ({
  id: doc._id.toString(),
  projectId: doc.projectId.toString(),
  level: doc.level,
  message: doc.message,
  service: doc.service,
  metadata: doc.metadata,
  timestamp: doc.timestamp,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

/**
 * Ingest a single log entry into LogLens by enqueuing into BullMQ.
 * Returns an asynchronous acknowledgment payload with Job ID.
 */
export const ingestLog = async (projectId: string, payload: LogRequest): Promise<{ status: string; jobId: string; projectId: string }> => {
  const jobData: LogIngestionJobData = {
    projectId,
    level: payload.level,
    message: payload.message,
    service: payload.service ?? 'default',
    timestamp: payload.timestamp ? new Date(payload.timestamp).toISOString() : new Date().toISOString(),
    ...(payload.metadata ? { metadata: payload.metadata } : {}),
  };

  const job = await addLogJob(jobData);

  return {
    status: 'queued',
    jobId: job.id ?? 'unknown',
    projectId,
  };
};

/**
 * Bulk ingest log entries into LogLens by enqueuing batch into BullMQ via addBulk().
 */
export const bulkIngestLogs = async (projectId: string, payload: LogRequest[]): Promise<{ status: string; enqueuedCount: number; projectId: string }> => {
  if (payload.length === 0) {
    throw new AppError('No logs to insert', 400, 'LOG_BULK_EMPTY');
  }

  const jobItems: LogIngestionJobData[] = payload.map((item) => ({
    projectId,
    level: item.level,
    message: item.message,
    service: item.service ?? 'default',
    timestamp: item.timestamp ? new Date(item.timestamp).toISOString() : new Date().toISOString(),
    ...(item.metadata ? { metadata: item.metadata } : {}),
  }));

  const enqueuedJobs = await addLogBatchJob(jobItems);

  return {
    status: 'queued',
    enqueuedCount: enqueuedJobs.length,
    projectId,
  };
};

export const listLogs = async (
  projectId: string,
  query: { page: number; limit: number; level?: string | undefined; service?: string | undefined }
): Promise<PaginatedLogs> => {
  const projectObjectId = new Types.ObjectId(projectId);
  const { page, limit, level, service } = query;

  const filter: Record<string, unknown> = { projectId: projectObjectId };
  if (level) filter.level = level;
  if (service) filter.service = service;

  const [totalCount, logs] = await Promise.all([
    logsRepo.countLogs(filter),
    logsRepo.findLogs(filter, page, limit),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  return {
    data: logs.map(mapLog),
    totalCount,
    totalPages,
    currentPage: page,
    pageSize: limit,
  };
};
