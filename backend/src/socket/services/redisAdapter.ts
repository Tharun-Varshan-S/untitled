import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { logger } from '../../utils/logger';
import { socketConfig } from '../config';

/**
 * Initializes the Redis Adapter for Socket.io if REDIS_URL is provided.
 * Falls back to single-node (in-memory) mode otherwise.
 */
export async function createRedisAdapter() {
  if (!socketConfig.redisUrl) {
    logger.info('[Socket.io] REDIS_URL not set. Running in single-node mode.');
    return undefined; // undefined allows Socket.io to default to in-memory adapter
  }

  try {
    const pubClient = createClient({ url: socketConfig.redisUrl });
    const subClient = pubClient.duplicate();

    pubClient.on('error', (err) => logger.error('[Redis PubClient Error]', err));
    subClient.on('error', (err) => logger.error('[Redis SubClient Error]', err));

    await Promise.all([pubClient.connect(), subClient.connect()]);

    logger.info('[Socket.io] Redis adapter connected successfully. Ready for horizontal scaling.');
    
    return createAdapter(pubClient, subClient);
  } catch (error) {
    logger.error(`[Socket.io] Failed to connect to Redis Adapter. Falling back to single-node mode. Error:`, error);
    return undefined;
  }
}
