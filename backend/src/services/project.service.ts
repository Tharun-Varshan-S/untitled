import { Types } from 'mongoose';
import { AppError } from '../utils/AppError';
import ProjectModel, { ProjectDocument } from '../models/Project';
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
  ownerId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

const mapProject = (project: ProjectRecord): ProjectResponse => ({
  id: project._id.toString(),
  name: project.name,
  description: project.description ?? '',
  ownerId: project.ownerId.toString(),
  createdAt: project.createdAt,
  updatedAt: project.updatedAt,
});

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');

const ensureValidObjectId = (value: string): Types.ObjectId => {
  if (!Types.ObjectId.isValid(value)) {
    throw new AppError('Invalid project id', 400, 'INVALID_PROJECT_ID');
  }

  return new Types.ObjectId(value);
};

export const createProject = async (
  ownerId: string,
  payload: CreateProjectDto
): Promise<ProjectResponse> => {
  const ownerObjectId = ensureValidObjectId(ownerId);

  const project = await ProjectModel.create({
    ownerId: ownerObjectId,
    name: payload.name,
    description: payload.description ?? '',
  });

  return mapProject(project.toObject());
};

export const getProjects = async (
  ownerId: string,
  query: ProjectListQuery
): Promise<PaginatedProjects> => {
  const ownerObjectId = ensureValidObjectId(ownerId);
  const { page, limit, search } = query;

  const filter: Record<string, unknown> = {
    ownerId: ownerObjectId,
  };

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
  // cascade delete related API keys
  try {
    // lazy-load to avoid circular imports at module load time
    const ApiKeyModel = (await import('../models/ApiKey.js')).default as any;
    await ApiKeyModel.deleteMany({ projectId: projectObjectId }).exec();
  } catch (err) {
    // log and continue; project deletion should not fail due to cleanup issues
  }
};
