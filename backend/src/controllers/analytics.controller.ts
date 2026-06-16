import { Request, Response } from 'express';
import { AppError } from '../utils/AppError';
import { getOverview, getLogLevels, getServices, getTrends } from '../services/analytics.service';
import { getProjectById } from '../services/project.service';

const requireUser = (req: Request) => {
  const user = (req as any).user;
  if (!user) {
    throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  }
  return user;
};

const getValidatedProjectId = async (req: Request): Promise<string> => {
  const user = requireUser(req);
  const projectId = req.query.projectId as string;
  
  if (!projectId) {
    throw new AppError('projectId query parameter is required', 400, 'PROJECT_ID_REQUIRED');
  }
  
  // Validates existence and ownership (throws if not found or not owned)
  await getProjectById(user.id, projectId);
  
  return projectId;
};

export const getOverviewController = async (req: Request, res: Response) => {
  const projectId = await getValidatedProjectId(req);
  const data = await getOverview(projectId);
  res.status(200).json(data);
};

export const getLogLevelsController = async (req: Request, res: Response) => {
  const projectId = await getValidatedProjectId(req);
  const data = await getLogLevels(projectId);
  res.status(200).json(data);
};

export const getServicesController = async (req: Request, res: Response) => {
  const projectId = await getValidatedProjectId(req);
  const data = await getServices(projectId);
  res.status(200).json(data);
};

export const getTrendsController = async (req: Request, res: Response) => {
  const projectId = await getValidatedProjectId(req);
  const data = await getTrends(projectId);
  res.status(200).json(data);
};
