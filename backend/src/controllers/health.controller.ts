import { Request, Response } from 'express';
import mongoose from 'mongoose';
import axios from 'axios';
import { redis } from '../config/redis';
import { config } from '../config/env';
import { logger } from '../utils/logger';

export const getHealth = async (_req: Request, res: Response) => {
  logger.info('Health check received');

  // ── MongoDB ──────────────────────────────────────────────────────────────
  const mongoConnected = mongoose.connection.readyState === 1;

  // ── Redis ────────────────────────────────────────────────────────────────
  let redisConnected = false;
  try {
    if (redis.isOpen) {
      await redis.ping();
      redisConnected = true;
    }
  } catch {
    redisConnected = false;
  }

  // ── AI Service ───────────────────────────────────────────────────────────
  let aiServiceConnected = false;
  try {
    const aiHealthUrl = config.aiServiceUrl.replace('/api/v1', '/health');
    const response = await axios.get(aiHealthUrl, { timeout: 3000 });
    aiServiceConnected = response.status === 200;
  } catch {
    aiServiceConnected = false;
  }

  const allHealthy = mongoConnected && redisConnected;
  const statusCode = allHealthy ? 200 : 503;

  res.status(statusCode).json({
    success: allHealthy,
    service: 'loglens',
    status: allHealthy ? 'ok' : 'degraded',
    version: '1.0.0',
    dependencies: {
      database: {
        status: mongoConnected ? 'connected' : 'disconnected',
        connected: mongoConnected,
      },
      redis: {
        status: redisConnected ? 'connected' : 'disconnected',
        connected: redisConnected,
      },
      aiService: {
        status: aiServiceConnected ? 'reachable' : 'unreachable',
        connected: aiServiceConnected,
        note: 'AI service is optional; core logging works without it.',
      },
    },
  });
};

