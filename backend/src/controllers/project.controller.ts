import { Request, Response } from 'express';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';
import {
  createProject,
  deleteProject,
  getProjectById,
  getProjects,
  updateProject,
} from '../services/project.service';
import {
  parseProjectListQuery,
  validateCreateProjectInput,
  validateUpdateProjectInput,
} from '../validators/project.validation';

const requireUser = (req: Request) => {
  const user = (req as any).user;
  if (!user) {
    throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  }

  return user;
};

export const createProjectController = async (req: Request, res: Response) => {
  const user = requireUser(req);
  const payload = validateCreateProjectInput(req.body);
  const project = await createProject(user.id, payload);

  logger.info(`Project created: ${project.id} by user ${user.id}`);

  res.status(201).json({
    success: true,
    data: project,
  });
};

export const listProjectsController = async (req: Request, res: Response) => {
  const user = requireUser(req);
  const query = parseProjectListQuery(req.query);
  const projects = await getProjects(user.id, query);

  res.status(200).json({
    success: true,
    data: projects,
  });
};

const getProjectId = (id: string | string[] | undefined): string => {
  const value = Array.isArray(id) ? id[0] : id;

  if (!value) {
    throw new AppError('Project id is required', 400, 'PROJECT_ID_REQUIRED');
  }

  return value;
};

export const getProjectController = async (req: Request, res: Response) => {
  const user = requireUser(req);
  const projectId = getProjectId(req.params.id);
  const project = await getProjectById(user.id, projectId);

  res.status(200).json({
    success: true,
    data: project,
  });
};

export const updateProjectController = async (req: Request, res: Response) => {
  const user = requireUser(req);
  const payload = validateUpdateProjectInput(req.body);
  const projectId = getProjectId(req.params.id);
  const project = await updateProject(user.id, projectId, payload);

  res.status(200).json({
    success: true,
    data: project,
  });
};

export const deleteProjectController = async (req: Request, res: Response) => {
  const user = requireUser(req);
  const projectId = getProjectId(req.params.id);
  await deleteProject(user.id, projectId);

  res.status(200).json({
    success: true,
    message: 'Project deleted successfully',
  });
};
