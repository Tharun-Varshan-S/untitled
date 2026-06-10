import { AppError } from '../utils/AppError';
import { CreateProjectDto, ProjectListQuery, UpdateProjectDto } from '../types/project.types';

const MAX_NAME_LENGTH = 100;
const MIN_NAME_LENGTH = 3;
const MAX_DESCRIPTION_LENGTH = 500;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

export const validateCreateProjectInput = (payload: unknown): CreateProjectDto => {
  const data = payload as Record<string, unknown>;

  const name = typeof data.name === 'string' ? data.name.trim() : '';
  const description = typeof data.description === 'string' ? data.description.trim() : '';

  if (!name) {
    throw new AppError('Project name is required', 400, 'PROJECT_NAME_REQUIRED');
  }

  if (name.length < MIN_NAME_LENGTH) {
    throw new AppError('Project name must be at least 3 characters', 400, 'PROJECT_NAME_TOO_SHORT');
  }

  if (name.length > MAX_NAME_LENGTH) {
    throw new AppError('Project name must be at most 100 characters', 400, 'PROJECT_NAME_TOO_LONG');
  }

  if (description.length > MAX_DESCRIPTION_LENGTH) {
    throw new AppError('Project description must be at most 500 characters', 400, 'PROJECT_DESCRIPTION_TOO_LONG');
  }

  return {
    name,
    description: description || '',
  };
};

export const validateUpdateProjectInput = (payload: unknown): UpdateProjectDto => {
  const data = payload as Record<string, unknown>;
  const update: UpdateProjectDto = {};

  if ('name' in data) {
    const name = typeof data.name === 'string' ? data.name.trim() : '';
    if (!name) {
      throw new AppError('Project name cannot be empty', 400, 'PROJECT_NAME_REQUIRED');
    }
    if (name.length < MIN_NAME_LENGTH) {
      throw new AppError('Project name must be at least 3 characters', 400, 'PROJECT_NAME_TOO_SHORT');
    }
    if (name.length > MAX_NAME_LENGTH) {
      throw new AppError('Project name must be at most 100 characters', 400, 'PROJECT_NAME_TOO_LONG');
    }
    update.name = name;
  }

  if ('description' in data) {
    const description = typeof data.description === 'string' ? data.description.trim() : '';
    if (description.length > MAX_DESCRIPTION_LENGTH) {
      throw new AppError('Project description must be at most 500 characters', 400, 'PROJECT_DESCRIPTION_TOO_LONG');
    }
    update.description = description;
  }

  if (Object.keys(update).length === 0) {
    throw new AppError('No valid update fields provided', 400, 'PROJECT_UPDATE_EMPTY');
  }

  return update;
};

export const parseProjectListQuery = (query: unknown): ProjectListQuery => {
  const data = query as Record<string, unknown>;
  const page = Number(data.page ?? 1);
  const limit = Number(data.limit ?? 10);
  const rawSearch = typeof data.search === 'string' ? data.search.trim() : '';

  if (Number.isNaN(page) || page < 1) {
    throw new AppError('Page must be a positive integer', 400, 'INVALID_PAGE');
  }

  if (Number.isNaN(limit) || limit < 1 || limit > 100) {
    throw new AppError('Limit must be between 1 and 100', 400, 'INVALID_LIMIT');
  }

  return {
    page,
    limit,
    search: rawSearch || undefined,
  };
};
