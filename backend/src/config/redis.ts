import { createClient } from 'redis';
import { config } from './env';
import { logger } from '../utils/logger';

export const redis = createClient({
  url: config.redisUrl,
});

redis.on('connect', () => {
  logger.info('✅ Redis Connected');
});

redis.on('error', (err) => {
  logger.error(`Redis Error: ${err instanceof Error ? err.message : String(err)}`);
});

export const connectRedis = async (): Promise<void> => {
  try {
    if (!redis.isOpen) {
      await redis.connect();
    }
  } catch (error) {
    logger.error(`Failed to connect to Redis: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const disconnectRedis = async (): Promise<void> => {
  try {
    if (redis.isOpen) {
      await redis.disconnect();
    }
  } catch (error) {
    logger.error(`Failed to disconnect from Redis: ${error instanceof Error ? error.message : String(error)}`);
  }
};
