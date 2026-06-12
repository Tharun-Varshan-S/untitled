import { Types } from 'mongoose';
import ApiKeyModel, { ApiKeyDocument } from '../models/ApiKey';

export const createApiKeyRecord = async (payload: {
  name: string;
  hashedKey: string;
  prefix: string;
  projectId: Types.ObjectId;
  createdBy: Types.ObjectId;
}): Promise<ApiKeyDocument> => {
  return ApiKeyModel.create(payload);
};

export const findByHashedKey = async (hashedKey: string): Promise<ApiKeyDocument | null> => {
  return ApiKeyModel.findOne({ hashedKey }).exec();
};

export const findById = async (id: string) => {
  if (!Types.ObjectId.isValid(id)) return null;
  return ApiKeyModel.findById(id).exec();
};

export const listByProject = async (projectId: string) => {
  return ApiKeyModel.find({ projectId }).select('name prefix revoked createdAt lastUsedAt').sort({ createdAt: -1 }).lean().exec();
};

export const findByNameAndProject = async (projectId: string, name: string) => {
  return ApiKeyModel.findOne({ projectId, name }).lean().exec();
};

export const revokeById = async (id: string) => {
  return ApiKeyModel.findByIdAndUpdate(
    id,
    { $set: { revoked: true, revokedAt: new Date() } },
    { new: true }
  ).exec();
};

export const deleteById = async (id: string) => {
  return ApiKeyModel.findByIdAndDelete(id).exec();
};

export const updateLastUsedAt = async (id: string) => {
  return ApiKeyModel.findByIdAndUpdate(id, { $set: { lastUsedAt: new Date() } }).exec();
};
