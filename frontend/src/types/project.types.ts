/**
 * Project types — aligned to backend ProjectResponse and PaginatedProjects contracts.
 *
 * Backend source of truth:
 *   GET  /projects      → { success: true, data: PaginatedProjects }
 *   GET  /projects/:id  → { success: true, data: ProjectResponse }
 *   POST /projects      → { success: true, data: ProjectResponse }
 *   DELETE /projects/:id → { success: true, message: string }
 *
 * ProjectResponse (backend) = { id, name, description, ownerId, createdAt, updatedAt }
 *   NOTE: uses `id` (string) not `_id`. No apiKey, no status, no stats fields.
 *
 * PaginatedProjects (backend) = { data: ProjectResponse[], totalCount, totalPages, currentPage, pageSize }
 */

export interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

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
}

export interface UpdateProjectPayload {
  name?: string;
  description?: string;
}
