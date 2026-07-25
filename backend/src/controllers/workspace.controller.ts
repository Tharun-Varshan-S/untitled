import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import {
  createWorkspace,
  getUserWorkspaces,
  getWorkspaceById,
  getWorkspaceProjects,
} from '../services/workspace.service';
import { createProject } from '../services/project.service';

export const createWorkspaceController = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user?.id) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');

  const { name } = req.body;
  if (!name) throw new AppError('Workspace name is required', 400, 'NAME_REQUIRED');

  const result = await createWorkspace(user.id, name);
  res.status(201).json({ success: true, data: result });
});

export const getUserWorkspacesController = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user?.id) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');

  const workspaces = await getUserWorkspaces(user.id);
  res.status(200).json({ success: true, data: workspaces });
});

export const getWorkspaceByIdController = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user?.id) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');

  const workspaceId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!workspaceId) throw new AppError('Workspace ID is required', 400, 'ID_REQUIRED');

  const workspace = await getWorkspaceById(user.id, workspaceId);
  res.status(200).json({ success: true, data: workspace });
});

export const getWorkspaceProjectsController = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user?.id) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');

  const workspaceId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!workspaceId) throw new AppError('Workspace ID is required', 400, 'ID_REQUIRED');

  const projects = await getWorkspaceProjects(user.id, workspaceId);
  res.status(200).json({ success: true, data: projects });
});

export const createWorkspaceProjectController = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user?.id) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');

  const workspaceId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!workspaceId) throw new AppError('Workspace ID is required', 400, 'ID_REQUIRED');

  const { name, description } = req.body;
  if (!name) throw new AppError('Project name is required', 400, 'NAME_REQUIRED');

  // Verify workspace ownership first
  await getWorkspaceById(user.id, workspaceId);

  const project = await createProject(user.id, {
    name,
    description,
    workspaceId,
  });

  res.status(201).json({ success: true, data: project });
});
