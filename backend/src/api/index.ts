import { Express, Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import healthRoutes from './health.routes';
import projectRoutes from './project.routes';

export const registerRoutes = (app: Express): void => {
  const apiRouter = Router();

  apiRouter.use('/auth', authRoutes);
  apiRouter.use('/health', healthRoutes);
  apiRouter.use('/projects', projectRoutes);

  app.use('/api/v1', apiRouter);
};
