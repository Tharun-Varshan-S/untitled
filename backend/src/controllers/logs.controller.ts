import { Request, Response } from 'express';
import { ingestLog, bulkIngestLogs, listLogs } from '../services/logs.service';
import { validateBulkLogPayload, validateLogPayload } from '../validators/logs.validation';

const getProjectIdFromRequest = (req: Request): string => {
  const project = req.project;
  if (!project?.id) {
    throw new Error('Project context missing');
  }
  return project.id;
};

const parsePagination = (query: unknown): { page: number; limit: number; level?: string | undefined; service?: string | undefined } => {
  const data = query as Record<string, unknown>;
  const page = Number(data.page ?? 1);
  const limit = Number(data.limit ?? 20);
  const level = typeof data.level === 'string' && data.level.trim() ? data.level.trim() : undefined;
  const service = typeof data.service === 'string' && data.service.trim() ? data.service.trim() : undefined;

  if (Number.isNaN(page) || page < 1) {
    throw new Error('Page must be a positive integer');
  }
  if (Number.isNaN(limit) || limit < 1 || limit > 100) {
    throw new Error('Limit must be between 1 and 100');
  }

  return { page, limit, level, service };
};

export const ingestLogController = async (req: Request, res: Response) => {
  const projectId = getProjectIdFromRequest(req);
  const payload = validateLogPayload(req.body);
  const result = await ingestLog(projectId, payload);

  res.status(201).json({ success: true, data: result });
};

export const bulkIngestLogsController = async (req: Request, res: Response) => {
  const projectId = getProjectIdFromRequest(req);
  const payload = validateBulkLogPayload(req.body);
  const result = await bulkIngestLogs(projectId, payload);

  res.status(201).json({ success: true, data: result });
};

export const listLogsController = async (req: Request, res: Response) => {
  const projectId = getProjectIdFromRequest(req);
  const query = parsePagination(req.query);
  const result = await listLogs(projectId, query);

  res.status(200).json({ success: true, data: result });
};
