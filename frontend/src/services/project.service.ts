/**
 * Project service — used in Server Components only.
 * Uses fetchApiServer which reads the JWT from cookies server-side.
 *
 * DO NOT import this service into Client Components.
 * All responses are wrapped in { success: true, data: ... } — unwrapped here.
 *
 * GET  /projects      → { success: true, data: PaginatedProjects }
 * GET  /projects/:id  → { success: true, data: Project }
 * POST /projects      → { success: true, data: Project }
 * DELETE /projects/:id → { success: true, message: string }
 */

import { fetchApiServer } from '../lib/api.server';
import { Project, PaginatedProjects, CreateProjectPayload } from '../types/project.types';
import { ApiSuccess } from '../types/auth.types';

class ProjectService {
  async getProjects(): Promise<Project[]> {
    const res = await fetchApiServer<ApiSuccess<PaginatedProjects>>('/projects?limit=50');
    return res.data.data;
  }

  async getProjectById(projectId: string): Promise<Project> {
    const res = await fetchApiServer<ApiSuccess<Project>>(`/projects/${projectId}`);
    return res.data;
  }

  async createProject(payload: CreateProjectPayload): Promise<Project> {
    const res = await fetchApiServer<ApiSuccess<Project>>('/projects', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  }

  async deleteProject(projectId: string): Promise<void> {
    await fetchApiServer<{ success: true; message: string }>(`/projects/${projectId}`, {
      method: 'DELETE',
    });
  }
}

export const projectService = new ProjectService();
