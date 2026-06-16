import { Express, Router } from 'express';
import mongoose from 'mongoose';
import authRoutes from '../modules/auth/auth.routes';
import healthRoutes from './health.routes';
import projectRoutes from './project.routes';
import apiKeysRoutes from './api-keys.routes';
import logsRoutes from './logs.routes';
import analyticsRoutes from './analytics.routes';
import { AppError } from '../utils/AppError';

export const registerRoutes = (app: Express): void => {
  const apiRouter = Router();

  apiRouter.use('/health', healthRoutes);

  // Suspected firewall/network check middleware
  apiRouter.use((req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
      return next(new AppError('Database is not connected. If you are on a restricted network (like college Wi-Fi), a firewall may be blocking MongoDB Atlas (port 27017). Try connecting to a mobile hotspot, configuring a proxy, or using a VPN.', 503, 'DATABASE_DISCONNECTED'));
    }
    next();
  });

  apiRouter.use('/auth', authRoutes);
  apiRouter.use('/projects', projectRoutes);
  apiRouter.use('/api-keys', apiKeysRoutes);
  apiRouter.use('/logs', logsRoutes);
  apiRouter.use('/analytics', analyticsRoutes);

  app.use('/api/v1', apiRouter);
  app.use('/api', apiRouter);
};
