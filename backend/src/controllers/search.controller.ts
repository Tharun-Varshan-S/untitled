import { Request, Response } from 'express';
import { AppError } from '../utils/AppError';
import { performSearch } from '../services/search.service';
import { validateSearchQuery } from '../validators/search.validation';
import { getProjectById } from '../services/project.service';

const getProjectIdFromRequest = (req: Request): string => {
  const project = (req as any).project;
  if (!project?.id) {
    throw new AppError('Project context missing', 401, 'PROJECT_CONTEXT_MISSING');
  }
  return project.id;
};

export const searchLogsController = async (req: Request, res: Response) => {
  const projectId = getProjectIdFromRequest(req);
  
  // Validation layer
  const query = validateSearchQuery(req.query);
  
  // Service layer (business logic orchestration)
  const result = await performSearch(projectId, query);

  res.status(200).json({ success: true, data: result });
};

export const searchLogsUserContextController = async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user) {
    throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  }

  const rawProjectId = req.params.id;
  const projectId = Array.isArray(rawProjectId) ? rawProjectId[0] : rawProjectId;

  if (!projectId) {
    throw new AppError('Project ID is required', 400, 'PROJECT_ID_REQUIRED');
  }

  // verify the user actually owns/has access to this project
  await getProjectById(user.id, projectId); // throws if unauthorized or not found

  const query = validateSearchQuery(req.query);
  const result = await performSearch(projectId, query);

  res.status(200).json({ success: true, data: result });
};
