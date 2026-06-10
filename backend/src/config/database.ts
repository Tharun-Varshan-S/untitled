import mongoose from 'mongoose';
import { config } from './env';
import { logger } from '../utils/logger';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 2000;

const connectOptions: mongoose.ConnectOptions = {
  autoIndex: false,
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  family: 4,
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
