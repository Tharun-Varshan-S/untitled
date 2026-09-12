import mongoose from 'mongoose';
import os from 'os';
import { config } from './env';
import { logger } from '../utils/logger';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 2000;

// Provide the os module explicitly via runtimeAdapters to work around a
// mongodb@7.x driver issue where makeClientMetadata() uses dynamic import('os'),
// which fails in Jest + ts-jest CommonJS environments on GitHub Actions CI.
// Without this, the handshake omits the 'driver' sub-document and the server
// rejects the connection with "Missing required sub-document 'driver'".
const connectOptions: mongoose.ConnectOptions = {
  autoIndex: false,
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  runtimeAdapters: { os } as any,
};

const delay = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export const connectDB = async (): Promise<void> => {
  if (!config.mongoUri) {
    throw new Error('MONGODB_URI environment variable is required');
  }

  if (mongoose.connection.readyState === 1) {
    logger.info('MongoDB already connected');
    return;
  }

  mongoose.set('strictQuery', true);

  mongoose.connection.on('connected', () => logger.info('Database connected'));
  mongoose.connection.on('disconnected', () => logger.info('Database disconnected'));
  mongoose.connection.on('reconnected', () => logger.info('Database reconnected'));
  mongoose.connection.on('error', (error) => logger.error(`MongoDB connection error: ${error instanceof Error ? error.message : String(error)}`));

  let attempt = 0;
  while (attempt < MAX_RETRIES) {
    attempt += 1;

    try {
      await mongoose.connect(config.mongoUri, connectOptions);
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed: ${message}`);

      if (attempt >= MAX_RETRIES) {
        throw new Error('Unable to connect to MongoDB after multiple attempts');
      }

      await delay(RETRY_DELAY_MS);
    }
  }
};

export const disconnectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  await mongoose.disconnect();
  logger.info('Database disconnected');
};
