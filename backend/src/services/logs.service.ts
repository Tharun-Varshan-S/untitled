import { Types } from 'mongoose';
import { AppError } from '../utils/AppError';
import { LogLevel } from '../models/Log';
import { LogRequest, LogResponse, PaginatedLogs } from '../types/logs.types';
import * as logsRepo from '../repositories/logs.repository';

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

export const ingestLog = async (projectId: string, payload: LogRequest): Promise<LogResponse> => {
  const projectObjectId = new Types.ObjectId(projectId);

  const created = await logsRepo.createLog({
    projectId: projectObjectId,
    level: payload.level,
    message: payload.message,
    service: payload.service,
    metadata: payload.metadata ?? undefined,
    timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
  });

  return mapLog(created);
};

export const bulkIngestLogs = async (projectId: string, payload: LogRequest[]): Promise<{ totalReceived: number; totalInserted: number }> => {
  const projectObjectId = new Types.ObjectId(projectId);
  if (payload.length === 0) {
    throw new AppError('No logs to insert', 400, 'LOG_BULK_EMPTY');
  }

  const documents = payload.map((item) => ({
    projectId: projectObjectId,
    level: item.level,
    message: item.message,
    service: item.service,
    metadata: item.metadata ?? undefined,
    timestamp: item.timestamp ? new Date(item.timestamp) : new Date(),
  }));

  const inserted = await logsRepo.insertLogs(documents);

  return {
    totalReceived: payload.length,
    totalInserted: inserted.length,
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
