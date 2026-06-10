export type CreateProjectDto = {
  name: string;
  description?: string;
};

export type UpdateProjectDto = {
  name?: string;
  description?: string;
};

export type ProjectResponse = {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ProjectListQuery = {
  page: number;
  limit: number;
  search?: string | undefined;
};

export type PaginatedProjects = {
  data: ProjectResponse[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
};
