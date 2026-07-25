export type CreateProjectDto = {
  name: string;
  description?: string | undefined;
  workspaceId?: string | undefined;
};

export type UpdateProjectDto = {
  name?: string | undefined;
  description?: string | undefined;
};

export type ProjectResponse = {
  id: string;
  name: string;
  description: string;
  workspaceId?: string | undefined;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ProjectListQuery = {
  page: number;
  limit: number;
  search?: string | undefined;
  workspaceId?: string | undefined;
};

export type PaginatedProjects = {
  data: ProjectResponse[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
};
