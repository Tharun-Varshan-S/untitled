import http from 'http';
import { Server } from 'socket.io';
import { logger } from '../utils/logger';
import { socketConfig } from './config';
import { registerSocketEvents } from './events';
import { socketAuthMiddleware } from './auth';
import { roomManager } from './rooms';
import { createRedisAdapter } from './services/redisAdapter';
import { socketMetrics } from './services/metrics';
import { socketRateLimiter } from './services/rateLimiter';
import { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from './types';
import { SocketEvents } from '@shared/socket/events';

let io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> | null = null;
let metricsInterval: NodeJS.Timeout | null = null;

/**
 * Initializes the Socket.IO singleton instance attached to the HTTP server.
 */
export async function initializeSocket(server: http.Server): Promise<void> {
  if (io) {
    logger.warn('Socket.io is already initialized.');
    return;
  }

  // Redis Adapter (Optional for horizontal scaling)
  const adapter = await createRedisAdapter();

  io = new Server(server, {
    cors: {
      origin: socketConfig.corsOrigins,
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling'], // graceful fallback
    pingInterval: socketConfig.pingInterval,
    pingTimeout: socketConfig.pingTimeout,
    maxHttpBufferSize: socketConfig.maxHttpBufferSize,
    connectionStateRecovery: socketConfig.connectionStateRecovery,
    ...(adapter ? { adapter } : {})
  });

  logger.info('Socket.IO initialized successfully');

  // Apply authentication middleware
  io.use(socketAuthMiddleware);

  io.on(SocketEvents.CONNECT, (socket) => {
    // Track Metrics
    socketMetrics.incrementActiveConnections();

    const clientIp = socket.handshake.headers['x-forwarded-for'] || socket.request.socket.remoteAddress;
    const user = socket.data.user;
    
    // Natively provided by connectionStateRecovery feature in Socket.io v4
    const recovered = socket.recovered ? ' (Recovered)' : '';
    if (socket.recovered) {
      socketMetrics.incrementReconnects();
    }

    logger.info(`Socket connected${recovered}: ${socket.id} | User: ${user?.email || 'Unknown'} | IP: ${clientIp}`);

    // Central Event Registration
    registerSocketEvents(socket);

    // Disconnect event
    socket.on(SocketEvents.DISCONNECT, (reason) => {
      socketMetrics.decrementActiveConnections();
      
      const durationMs = Date.now() - (socket.data.connectedAt || Date.now());
      socketMetrics.recordConnectionDuration(durationMs);
      socketRateLimiter.clear(socket.id);

      logger.info(`Socket disconnected: ${socket.id} | Reason: ${reason} | Duration: ${durationMs}ms`);
      
      // Cleanup references
      roomManager.leaveAllRooms(socket);
    });
  });

  // Dump metrics periodically (every 1 minute)
  metricsInterval = setInterval(() => {
    socketMetrics.dumpMetrics();
  }, 60000);
}

/**
 * Gets the initialized Socket.IO instance.
 * Throws an error if called before initialization.
 */
export function getIO(): Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> {
  if (!io) {
    throw new Error('Socket.io has not been initialized. Call initializeSocket(server) first.');
  }
  return io;
}

/**
 * Closes the socket server gracefully.
 */
export function closeSocket(callback?: (err?: Error) => void): void {
  if (metricsInterval) {
    clearInterval(metricsInterval);
  }
  
  if (io) {
    logger.info('Closing Socket.IO server...');
    io.close(callback);
    io = null;
  } else if (callback) {
    callback();
  }
}
