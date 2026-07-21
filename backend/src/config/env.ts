import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

type NodeEnv = 'development' | 'production' | 'test';

const nodeEnv = (process.env.NODE_ENV ?? 'development') as NodeEnv;
const mongoUri = process.env.MONGODB_URI?.trim() ?? '';
const jwtSecret = process.env.JWT_SECRET?.trim() ?? '';

if (!mongoUri) {
  throw new Error('MONGODB_URI environment variable is required');
}

if (nodeEnv === 'production' && !jwtSecret) {
  throw new Error('JWT_SECRET environment variable is required in production');
}

const maxUploadSizeMb = Number(process.env.MAX_UPLOAD_SIZE_MB ?? 10);
const uploadDirectory = process.env.UPLOAD_DIRECTORY ?? path.join(process.cwd(), 'uploads');

export const config = {
  port: Number(process.env.PORT ?? 5000),
  nodeEnv,
  isProduction: nodeEnv === 'production',
  isDevelopment: nodeEnv === 'development',
  jwtSecret: jwtSecret || 'change_me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  mongoUri,
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  upload: {
    maxSizeMb: maxUploadSizeMb,
    maxSizeBytes: maxUploadSizeMb * 1024 * 1024,
    directory: uploadDirectory,
    allowedExtensions: ['.csv', '.json', '.ndjson'],
    allowedMimeTypes: ['text/csv', 'application/json', 'application/x-ndjson', 'text/plain'],
  },
};
