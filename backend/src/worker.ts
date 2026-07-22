import { connectDB, disconnectDB } from './config/database';
import { connectRedis, disconnectRedis } from './config/redis';
import { createLogWorker } from './jobs/log.worker';
import { logger } from './utils/logger';

/**
 * Standalone Worker Process Entrypoint for LogLens Background Job Processing.
 * Designed for process isolation (separating HTTP Web API from heavy Worker processing).
 */
const startStandaloneWorkerProcess = async () => {
  const instanceId = process.env.WORKER_ID || `Worker-PID-${process.pid}`;
  const concurrency = Number(process.env.WORKER_CONCURRENCY) || 10;

  logger.info(`=============================================================`);
  logger.info(`🚀 [Worker Process] Starting Standalone Worker Instance '${instanceId}'`);
  logger.info(`   Concurrency: ${concurrency} parallel job processing slots`);
  logger.info(`=============================================================`);

  // Connect Database & Redis
  try {
    await connectDB();
  } catch (error) {
    logger.error(`MongoDB connection failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  await connectRedis();

  // Instantiate Standalone Worker
  const worker = createLogWorker(instanceId);

  logger.info(`✅ [Worker Process] Worker '${instanceId}' connected to Redis and listening for jobs...`);

  // Graceful Shutdown Handler
  let isShuttingDown = false;

  const shutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    logger.info(`🛑 [Worker Process] Received ${signal}. Initiating Graceful Shutdown for '${instanceId}'...`);
    logger.info(`   ➔ Stopping new job pickup and waiting for active jobs to finish (Max 15s grace period)...`);

    try {
      // Worker.close() waits for active jobs to complete or timeout
      await worker.close();
      logger.info(`   ✔ Worker '${instanceId}' closed cleanly.`);
    } catch (err) {
      logger.error(`❌ Error closing worker: ${err}`);
    }

    try {
      await disconnectDB();
      await disconnectRedis();
    } catch (err) {
      logger.error(`Error disconnecting database/Redis: ${err}`);
    }

    logger.info(`👋 [Worker Process] Standalone Worker process exited cleanly.`);
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  process.on('unhandledRejection', (reason) => {
    logger.error(`Unhandled Rejection in Worker process: ${reason}`);
  });

  process.on('uncaughtException', (err) => {
    logger.error(`Uncaught Exception in Worker process: ${err.message}`);
    void shutdown('uncaughtException');
  });
};

startStandaloneWorkerProcess().catch((err) => {
  logger.error(`❌ Standalone Worker Process startup failed: ${err}`);
  process.exit(1);
});
