import WorkspaceModel from '../models/Workspace';
import ProjectModel from '../models/Project';
import { createApiKey } from './apiKey.service';
import { AppError } from '../utils/AppError';
import { Types } from 'mongoose';

export const createWorkspace = async (userId: string, name: string) => {
  const cleanName = name.trim();
  if (!cleanName || cleanName.length < 2) {
    throw new AppError('Workspace name must be at least 2 characters', 400, 'INVALID_WORKSPACE_NAME');
  }

  const userObjId = new Types.ObjectId(userId);
  const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const existing = await WorkspaceModel.findOne({ ownerId: userObjId, name: cleanName });
  if (existing) {
    throw new AppError(`Workspace "${cleanName}" already exists for your account`, 400, 'WORKSPACE_EXISTS');
  }

  // 1. Create Workspace
  const workspace = await WorkspaceModel.create({
    name: cleanName,
    slug: slug || 'workspace',
    ownerId: userObjId,
  });

  // 2. Auto-create default Project inside workspace with the same name
  const defaultProject = await ProjectModel.create({
    name: cleanName,
    description: `Default project for workspace ${cleanName}`,
    workspaceId: workspace._id,
    ownerId: userObjId,
  });

  // 3. Auto-generate default API Key for default Project
  const defaultApiKey = await createApiKey(userId, defaultProject._id.toString(), 'Default API Key');

  return {
    workspace,
    defaultProject,
    defaultApiKey,
  };
};

export const getUserWorkspaces = async (userId: string) => {
  const userObjId = new Types.ObjectId(userId);
  let workspaces = await WorkspaceModel.find({ ownerId: userObjId }).sort({ createdAt: -1 });

  // If user has no workspaces (new or legacy user), automatically bootstrap a default workspace
  if (workspaces.length === 0) {
    const defaultWs = await createWorkspace(userId, 'Main Workspace');
    workspaces = [defaultWs.workspace];
  }

  return workspaces;
};

export const getWorkspaceById = async (userId: string, workspaceId: string) => {
  if (!Types.ObjectId.isValid(workspaceId)) {
    throw new AppError('Invalid workspace ID', 400, 'INVALID_WORKSPACE_ID');
  }

  const workspace = await WorkspaceModel.findOne({
    _id: new Types.ObjectId(workspaceId),
    ownerId: new Types.ObjectId(userId),
  });

  if (!workspace) {
    throw new AppError('Workspace not found or unauthorized', 404, 'WORKSPACE_NOT_FOUND');
  }

  return workspace;
};

export const getWorkspaceProjects = async (userId: string, workspaceId: string) => {
  await getWorkspaceById(userId, workspaceId);
  const projects = await ProjectModel.find({
    workspaceId: new Types.ObjectId(workspaceId),
    ownerId: new Types.ObjectId(userId),
  }).sort({ createdAt: -1 });

  return projects;
};
