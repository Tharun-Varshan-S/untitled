import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Request/Response logging middleware.
 * - Generates a unique X-Request-ID for every request and sets it as a response header.
 * - Attaches `requestId` to `req` so it can be forwarded to BullMQ job payloads.
 * - Logs method, path, status, latency, userId, projectId, and requestId for full observability.
 */
export const requestLoggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  (req as any).requestId = requestId;
  res.setHeader('X-Request-ID', requestId);

  const start = Date.now();
  const originalSend = res.send;

  res.send = function (data: unknown) {
    const latency = Date.now() - start;
    const statusCode = res.statusCode;

    logger.info(`${req.method} ${req.originalUrl} ${statusCode} ${latency}ms [${requestId}]`, {
      method: req.method,
      path: req.originalUrl,
      statusCode,
      latency,
      requestId,
      userId: (req as any).user?.id,
      projectId: (req as any).project?.id,
    });

    return originalSend.call(this, data);
  };

  next();
};
