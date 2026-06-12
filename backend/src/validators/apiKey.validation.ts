import { AppError } from '../utils/AppError';
import mongoose from 'mongoose';

const MIN_NAME_LENGTH = 3;
const MAX_NAME_LENGTH = 100;

export const validateApiKeyName = (input: unknown): string => {
  const name = typeof input === 'string' ? input.trim() : '';
  if (!name) throw new AppError('API key name is required', 400, 'API_KEY_NAME_REQUIRED');
  if (name.length < MIN_NAME_LENGTH) throw new AppError('API key name too short', 400, 'API_KEY_NAME_TOO_SHORT');
  if (name.length > MAX_NAME_LENGTH) throw new AppError('API key name too long', 400, 'API_KEY_NAME_TOO_LONG');
  return name;
};

export const validateProjectId = (id: unknown): string => {
  const value = typeof id === 'string' ? id : '';
  if (!value || !mongoose.Types.ObjectId.isValid(value)) {
    throw new AppError('Invalid project id', 400, 'INVALID_PROJECT_ID');
  }
  return value;
};

export const validateApiKeyId = (id: unknown): string => {
  const value = typeof id === 'string' ? id : '';
  if (!value || !mongoose.Types.ObjectId.isValid(value)) {
    throw new AppError('Invalid api key id', 400, 'INVALID_API_KEY_ID');
  }
  return value;
};
