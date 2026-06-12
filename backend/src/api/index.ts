import { Express, Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import healthRoutes from './health.routes';
import logsRoutes from './logs.routes';
import projectRoutes from './project.routes';
import apiKeysRoutes from './api-keys.routes';

export const registerRoutes = (app: Express): void => {
  const apiRouter = Router();

  apiRouter.use('/auth', authRoutes);
  apiRouter.use('/health', healthRoutes);
  apiRouter.use('/projects', projectRoutes);
  apiRouter.use('/api-keys', apiKeysRoutes);
  apiRouter.use('/logs', logsRoutes);

  app.use('/api/v1', apiRouter);
};
