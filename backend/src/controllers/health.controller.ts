import { Request, Response } from 'express';
import { logger } from '../utils/logger';

export const getHealth = (_req: Request, res: Response) => {
  logger.info('Health check received');

  res.status(200).json({
    success: true,
    service: 'loglens',
    status: 'ok',
    version: '1.0.0',
  });
};
