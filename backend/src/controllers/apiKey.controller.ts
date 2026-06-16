import { Request, Response } from 'express';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';
import {
  createApiKey,
  listApiKeys,
  getApiKeyById,
  revokeApiKey,
  deleteApiKey,
} from '../services/apiKey.service';
import { validateApiKeyName, validateApiKeyId, validateProjectId } from '../validators/apiKey.validation';

const requireUser = (req: Request) => {
  const user = (req as any).user;
  if (!user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  return user;
};

export const createApiKeyController = async (req: Request, res: Response) => {
  const user = requireUser(req);
  const projectId = validateProjectId(req.params.id);
  const name = validateApiKeyName((req.body as Record<string, unknown>).name);

  const result = await createApiKey(user.id, projectId, name);

  logger.info(`API key created ${result.id} for project ${projectId} by user ${user.id}`);

  res.status(201).json({ success: true, data: { id: result.id, name: result.name, prefix: result.prefix, rawKey: result.rawKey } });
};

export const listApiKeysController = async (req: Request, res: Response) => {
  const user = requireUser(req);
  const projectId = validateProjectId(req.params.id);
  const data = await listApiKeys(user.id, projectId);
  res.status(200).json({ success: true, data });
};

export const getApiKeyController = async (req: Request, res: Response) => {
  const user = requireUser(req);
  const apiKeyId = validateApiKeyId(req.params.id);
  const data = await getApiKeyById(user.id, apiKeyId);
  res.status(200).json({ success: true, data });
};

export const revokeApiKeyController = async (req: Request, res: Response) => {
  const user = requireUser(req);
  const apiKeyId = validateApiKeyId(req.params.id);
  const result = await revokeApiKey(user.id, apiKeyId);
  res.status(200).json({ success: true, data: result });
};

export const deleteApiKeyController = async (req: Request, res: Response) => {
  const user = requireUser(req);
  const apiKeyId = validateApiKeyId(req.params.id);
  await deleteApiKey(user.id, apiKeyId);
  res.status(200).json({ success: true, message: 'API key deleted' });
};
