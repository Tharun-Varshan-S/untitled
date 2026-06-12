import { Types } from 'mongoose';
import { AppError } from '../utils/AppError';
import { auditLog } from '../utils/audit';
import { generateApiKey, hashApiKey, extractPrefixFromRaw } from '../utils/apiKey';
import * as repo from '../repositories/apiKey.repository';
import ProjectModel from '../models/Project';

type CreateResult = { id: string; name: string; prefix: string; rawKey: string };

const ensureValidObjectId = (value: string): Types.ObjectId => {
  if (!Types.ObjectId.isValid(value)) {
    throw new AppError('Invalid id', 400, 'INVALID_ID');
  }
  return new Types.ObjectId(value);
};

export const createApiKey = async (userId: string, projectId: string, name: string): Promise<CreateResult> => {
  const projectObjectId = ensureValidObjectId(projectId);

  // ensure project exists and owned by user
  const project = await ProjectModel.findOne({ _id: projectObjectId, ownerId: ensureValidObjectId(userId) }).lean().exec();
  if (!project) {
    throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
  }

  // unique name per project
  const existing = await repo.findByNameAndProject(projectId, name);
  if (existing) {
    throw new AppError('API key name already exists for this project', 409, 'API_KEY_NAME_EXISTS');
  }

  // generate and store hashed key
  let rawKey = generateApiKey();
  let hashed = hashApiKey(rawKey);

  // handle rare collision by retrying a few times
  let attempts = 0;
  while (attempts < 3) {
    try {
      const created = await repo.createApiKeyRecord({
        name,
        hashedKey: hashed,
        prefix: extractPrefixFromRaw(rawKey),
        projectId: projectObjectId,
        createdBy: ensureValidObjectId(userId),
      });

      auditLog('API_KEY_CREATED', { id: created._id.toString(), projectId, createdBy: userId, name });
      return { id: created._id.toString(), name: created.name, prefix: created.prefix, rawKey };
    } catch (err: any) {
      // if duplicate hashedKey, generate again
      if (err && err.code === 11000) {
        rawKey = generateApiKey();
        hashed = hashApiKey(rawKey);
        attempts += 1;
        continue;
      }
      throw err;
    }
  }

  throw new AppError('Failed to generate unique API key', 500, 'API_KEY_GENERATION_FAILED');
};

export const listApiKeys = async (userId: string, projectId: string) => {
  // ensure ownership
  const project = await ProjectModel.findOne({ _id: ensureValidObjectId(projectId), ownerId: ensureValidObjectId(userId) }).lean().exec();
  if (!project) throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');

  const rows = await repo.listByProject(projectId);
  return rows.map((r) => ({ id: r._id.toString(), name: r.name, prefix: r.prefix, revoked: r.revoked, createdAt: r.createdAt, lastUsedAt: r.lastUsedAt }));
};

export const getApiKeyById = async (userId: string, apiKeyId: string) => {
  const key = await repo.findById(apiKeyId);
  if (!key) throw new AppError('API key not found', 404, 'API_KEY_NOT_FOUND');

  // ensure ownership of the project
  const project = await ProjectModel.findOne({ _id: key.projectId, ownerId: ensureValidObjectId(userId) }).lean().exec();
  if (!project) throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');

  return { id: key._id.toString(), name: key.name, prefix: key.prefix, revoked: key.revoked, createdAt: key.createdAt, lastUsedAt: key.lastUsedAt };
};

export const revokeApiKey = async (userId: string, apiKeyId: string) => {
  const key = await repo.findById(apiKeyId);
  if (!key) throw new AppError('API key not found', 404, 'API_KEY_NOT_FOUND');

  // ensure ownership
  const project = await ProjectModel.findOne({ _id: key.projectId, ownerId: ensureValidObjectId(userId) }).lean().exec();
  if (!project) throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');

  if (key.revoked) return { id: key._id.toString(), revoked: true };

  const updated = await repo.revokeById(apiKeyId);
  auditLog('API_KEY_REVOKED', { id: apiKeyId, projectId: key.projectId.toString(), revokedBy: userId });
  return { id: updated?._id.toString(), revoked: updated?.revoked };
};

export const deleteApiKey = async (userId: string, apiKeyId: string) => {
  const key = await repo.findById(apiKeyId);
  if (!key) throw new AppError('API key not found', 404, 'API_KEY_NOT_FOUND');

  // ensure ownership
  const project = await ProjectModel.findOne({ _id: key.projectId, ownerId: ensureValidObjectId(userId) }).lean().exec();
  if (!project) throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');

  await repo.deleteById(apiKeyId);
  auditLog('API_KEY_DELETED', { id: apiKeyId, projectId: key.projectId.toString(), deletedBy: userId });
};
