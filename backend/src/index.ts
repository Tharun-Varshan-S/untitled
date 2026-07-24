import http from 'http';
import { config } from './config/env';
import { logger } from './utils/logger';
import app from './app';
import { connectDB, disconnectDB } from './config/database';
import { connectRedis, disconnectRedis } from './config/redis';
import { initializeSocket, closeSocket } from './socket';
import { createLogWorker } from './jobs/log.worker';

const startServer = async (): Promise<http.Server> => {
  try {
    await connectDB();
  } catch (error) {
    logger.error(`MongoDB connection failed: ${error instanceof Error ? error.message : String(error)}`);
    logger.warn('Server starting in degraded mode (Database offline).');
  }

  await connectRedis();

  // Instantiate embedded worker for zero-config queue processing
  const logWorker = createLogWorker('embedded-worker');
  logger.info('✅ Embedded BullMQ Log Worker initialized & listening for jobs.');

  const server = http.createServer(app);
  await initializeSocket(server);
  
  server.listen(config.port, () => {
    logger.info(`Server started on port ${config.port}`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`Shutdown initiated by ${signal}`);

    closeSocket((socketCloseError) => {
      if (socketCloseError) {
        logger.error(`Error closing Socket.IO server: ${socketCloseError.message}`);
      }
      
      server.close(async (closeError) => {
        if (closeError) {
          logger.error(`Error closing HTTP server: ${closeError.message}`);
        }

        try {
          await disconnectDB();
        } catch (disconnectError) {
          logger.error(`Error disconnecting MongoDB: ${disconnectError instanceof Error ? disconnectError.message : String(disconnectError)}`);
        }

        try {
          await disconnectRedis();
        } catch (redisError) {
          logger.error(`Error disconnecting Redis: ${redisError instanceof Error ? redisError.message : String(redisError)}`);
        }

        process.exit(0);
      });
    });

    setTimeout(() => {
      logger.error('Force exiting process after timeout');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('unhandledRejection', (reason) => {
    logger.error(`Unhandled promise rejection: ${reason instanceof Error ? reason.message : String(reason)}`);
  });
  process.on('uncaughtException', (uncaughtError) => {
    logger.error(`Uncaught exception: ${uncaughtError instanceof Error ? uncaughtError.message : String(uncaughtError)}`);
    void shutdown('uncaughtException');
  });

  return server;
};

startServer().catch((error) => {
  logger.error(`Startup failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
