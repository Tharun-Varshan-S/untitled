import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError';
import { hashApiKey, API_KEY_PREFIX } from '../utils/apiKey';
import { findByHashedKey, updateLastUsedAt } from '../repositories/apiKey.repository';
import ProjectModel from '../models/Project';
import { auditLog } from '../utils/audit';

export const authenticateApiKey = async (req: Request, res: Response, next: NextFunction) => {
  const header = (req.headers['x-api-key'] as string) || '';
  const raw = typeof header === 'string' ? header.trim() : '';

  if (!raw) return next(new AppError('API key is required', 401, 'API_KEY_REQUIRED'));
  if (!raw.startsWith(API_KEY_PREFIX)) return next(new AppError('Malformed API key', 401, 'API_KEY_MALFORMED'));

  let hashed: string;
  try {
    hashed = hashApiKey(raw);
  } catch {
    return next(new AppError('Malformed API key', 401, 'API_KEY_MALFORMED'));
  }

  try {
    const record = await findByHashedKey(hashed);
    if (!record) {
      auditLog('AUTHENTICATION_FAILURE', { reason: 'UNKNOWN_KEY' });
      return next(new AppError('Unauthorized', 401, 'API_KEY_INVALID'));
    }

    if (record.revoked) {
      auditLog('REVOKED_KEY_USAGE', { keyId: record._id.toString(), projectId: record.projectId.toString() });
      return next(new AppError('API key revoked', 401, 'API_KEY_REVOKED'));
    }

    // fetch project once and attach
    const project = await ProjectModel.findById(record.projectId).lean().exec();
    if (!project) {
      auditLog('AUTHENTICATION_FAILURE', { reason: 'PROJECT_NOT_FOUND', keyId: record._id.toString() });
      return next(new AppError('Project not found', 401, 'PROJECT_NOT_FOUND'));
    }

    // update lastUsedAt asynchronously (don't await to keep latency low)
    updateLastUsedAt(record._id.toString()).catch((err) => {
      // log but don't block
      // eslint-disable-next-line no-console
      console.error('Failed to update api key lastUsedAt', err);
    });

    // attach to request
    req.apiKey = {
      id: record._id.toString(),
      name: record.name,
      prefix: record.prefix,
      projectId: record.projectId.toString(),
      revoked: record.revoked,
    } as any;

    req.project = {
      id: project._id.toString(),
      name: project.name,
      description: project.description ?? '',
      ownerId: project.ownerId?.toString(),
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    } as any;

    return next();
  } catch (err) {
    return next(err);
  }
};
