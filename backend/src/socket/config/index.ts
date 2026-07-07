import { config as envConfig } from '../../config/env';

export const socketConfig = {
  // Connection and Ping Configuration
  pingInterval: Number(process.env.SOCKET_PING_INTERVAL || 25000),
  pingTimeout: Number(process.env.SOCKET_PING_TIMEOUT || 20000),
  
  // Transport Configuration
  maxHttpBufferSize: Number(process.env.SOCKET_MAX_HTTP_BUFFER_SIZE || 1e6), // default 1MB
  
  // Allowed Origins
  corsOrigins: envConfig.isProduction 
    ? (process.env.FRONTEND_URL || 'https://your-production-url.com')
    : (process.env.FRONTEND_URL || 'http://localhost:3000'),

  // Redis Adapter Settings
  redisUrl: process.env.REDIS_URL || '',
  
  // Connection limits
  maxConnections: Number(process.env.SOCKET_MAX_CONNECTIONS || 5000),
  
  // Rate Limiting (events per second per socket)
  rateLimit: Number(process.env.SOCKET_RATE_LIMIT || 50),

  // Connection State Recovery (Socket.io v4 feature)
  connectionStateRecovery: {
    maxDisconnectionDuration: Number(process.env.SOCKET_MAX_DISCONNECT_DURATION || 2 * 60 * 1000), // 2 minutes
    skipMiddlewares: true
  }
};
