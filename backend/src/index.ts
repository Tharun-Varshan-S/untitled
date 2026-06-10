import http from 'http';
import express, { Express } from 'express';
import cors from 'cors';
import { config } from './config/env';
import { logger } from './utils/logger';
import { registerRoutes } from './api';
import { errorMiddleware } from './middleware/error.middleware';
import { connectDB, disconnectDB } from './config/database';

const app: Express = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

registerRoutes(app);
app.use(errorMiddleware);

const startServer = async (): Promise<http.Server> => {
  await connectDB();

  const server = app.listen(config.port, () => {
    logger.info(`Server started on port ${config.port}`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`Shutdown initiated by ${signal}`);

    server.close(async (closeError) => {
      if (closeError) {
        logger.error(`Error closing HTTP server: ${closeError.message}`);
      }

      try {
        await disconnectDB();
      } catch (disconnectError) {
        logger.error(`Error disconnecting MongoDB: ${disconnectError instanceof Error ? disconnectError.message : String(disconnectError)}`);
      }

      process.exit(0);
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
