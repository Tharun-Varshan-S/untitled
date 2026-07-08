import { Request, Response } from 'express';
import { AppError } from '../utils/AppError';
import { performSearch } from '../services/search.service';
import { validateSearchQuery } from '../validators/search.validation';

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
