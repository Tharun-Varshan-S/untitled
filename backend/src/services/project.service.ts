import { Types } from 'mongoose';
import { AppError } from '../utils/AppError';
import ProjectModel from '../models/Project';
import WorkspaceModel from '../models/Workspace';
import { createApiKey } from './apiKey.service';
import {
  CreateProjectDto,
  PaginatedProjects,
  ProjectListQuery,
  ProjectResponse,
  UpdateProjectDto,
} from '../types/project.types';

type ProjectRecord = {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  workspaceId?: Types.ObjectId;
  ownerId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

const mapProject = (project: ProjectRecord): ProjectResponse => ({
  id: project._id.toString(),
  name: project.name,
  description: project.description ?? '',
  workspaceId: project.workspaceId?.toString(),
  ownerId: project.ownerId.toString(),
  createdAt: project.createdAt,
  updatedAt: project.updatedAt,
});

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const ensureValidObjectId = (value: string): Types.ObjectId => {
  if (!Types.ObjectId.isValid(value)) {
    throw new AppError('Invalid ID format', 400, 'INVALID_ID');
  }
  return new Types.ObjectId(value);
};

export const createProject = async (
  ownerId: string,
  payload: CreateProjectDto
): Promise<ProjectResponse> => {
  const ownerObjectId = ensureValidObjectId(ownerId);
  let wsObjectId: Types.ObjectId;

  if (payload.workspaceId) {
    wsObjectId = ensureValidObjectId(payload.workspaceId);
    const ws = await WorkspaceModel.findOne({ _id: wsObjectId, ownerId: ownerObjectId });
    if (!ws) {
      throw new AppError('Workspace not found or unauthorized', 404, 'WORKSPACE_NOT_FOUND');
    }
  } else {
    // Find or create default workspace for user
    let defaultWs = await WorkspaceModel.findOne({ ownerId: ownerObjectId }).sort({ createdAt: 1 });
    if (!defaultWs) {
      const slug = payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'main';
      defaultWs = await WorkspaceModel.create({
        name: 'Main Workspace',
        slug: 'main-workspace',
        ownerId: ownerObjectId,
      });
    }
    wsObjectId = defaultWs._id as Types.ObjectId;
  }

  // Create Project
  const project = await ProjectModel.create({
    name: payload.name.trim(),
    description: payload.description ?? '',
    workspaceId: wsObjectId,
    ownerId: ownerObjectId,
  });

  // Auto-generate default API Key for project
  try {
    await createApiKey(ownerId, project._id.toString(), `${payload.name.trim()} Key`);
  } catch (err) {
    // Ignore API key creation error if one already exists
  }

  return mapProject(project.toObject());
};

export const getProjects = async (
  ownerId: string,
  query: ProjectListQuery
): Promise<PaginatedProjects> => {
  const ownerObjectId = ensureValidObjectId(ownerId);
  const { page, limit, search, workspaceId } = query;

  const filter: Record<string, unknown> = {
    ownerId: ownerObjectId,
  };

  if (workspaceId && Types.ObjectId.isValid(workspaceId)) {
    filter.workspaceId = new Types.ObjectId(workspaceId);
  }

  if (search) {
    filter.name = { $regex: escapeRegExp(search), $options: 'i' };
  }

  const [totalCount, projects] = await Promise.all([
    ProjectModel.countDocuments(filter).exec(),
    ProjectModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()
      .exec(),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  return {
    data: projects.map(mapProject),
    totalCount,
    totalPages,
    currentPage: page,
    pageSize: limit,
  };
};

export const getProjectById = async (
  ownerId: string,
  projectId: string
): Promise<ProjectResponse> => {
  const ownerObjectId = ensureValidObjectId(ownerId);
  const projectObjectId = ensureValidObjectId(projectId);

  const project = await ProjectModel.findOne({
    _id: projectObjectId,
    ownerId: ownerObjectId,
  })
    .lean()
    .exec();

  if (!project) {
    throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
  }

  return mapProject(project);
};

export const updateProject = async (
  ownerId: string,
  projectId: string,
  payload: UpdateProjectDto
): Promise<ProjectResponse> => {
  const ownerObjectId = ensureValidObjectId(ownerId);
  const projectObjectId = ensureValidObjectId(projectId);

  const updatePayload: Record<string, unknown> = {};
  if (payload.name !== undefined) {
    updatePayload.name = payload.name;
  }
  if (payload.description !== undefined) {
    updatePayload.description = payload.description;
  }

  const project = await ProjectModel.findOneAndUpdate(
    { _id: projectObjectId, ownerId: ownerObjectId },
    { $set: updatePayload },
    {
      new: true,
      runValidators: true,
      context: 'query',
      lean: true,
    }
  ).exec();

  if (!project) {
    throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
  }

  return mapProject(project);
};

export const deleteProject = async (
  ownerId: string,
  projectId: string
): Promise<void> => {
  const ownerObjectId = ensureValidObjectId(ownerId);
  const projectObjectId = ensureValidObjectId(projectId);

  const deleted = await ProjectModel.findOneAndDelete({
    _id: projectObjectId,
    ownerId: ownerObjectId,
  })
    .lean()
    .exec();

  if (!deleted) {
    throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
  }

  try {
    const ApiKeyModel = (await import('../models/ApiKey.js')).default as any;
    await ApiKeyModel.deleteMany({ projectId: projectObjectId }).exec();
  } catch (err) {
    // Ignore cleanup error
  }
};
