import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Request/Response logging middleware
 * Logs all incoming requests with method, path, status, and latency
 */
export const requestLoggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const originalSend = res.send;

  // Override res.send to log response details
  res.send = function (data: unknown) {
    const latency = Date.now() - start;
    const statusCode = res.statusCode;

    logger.info(`${req.method} ${req.originalUrl} ${statusCode} ${latency}ms`, {
      method: req.method,
      path: req.originalUrl,
      statusCode,
      latency,
      userId: (req as any).user?.id,
      projectId: (req as any).project?.id,
    });

    // Call the original send method
    return originalSend.call(this, data);
  };

  next();
};
