/**
 * Project types — aligned to backend ProjectResponse and PaginatedProjects contracts.
 */

export interface Project {
  id: string;
  name: string;
  description: string;
  workspaceId?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export type ProjectResponse = Project;

export interface PaginatedProjects {
  data: Project[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
  workspaceId?: string;
}

export interface UpdateProjectPayload {
  name?: string;
  description?: string;
}
