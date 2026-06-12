import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';

export const getHealth = (_req: Request, res: Response) => {
  logger.info('Health check received');

  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  res.status(mongoose.connection.readyState === 1 ? 200 : 503).json({
    success: true,
    service: 'loglens',
    status: 'ok',
    version: '1.0.0',
    database: {
      status: mongoStatus,
      connected: mongoose.connection.readyState === 1,
    },
  });
};
