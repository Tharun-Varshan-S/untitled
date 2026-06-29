import { fetchApi } from '../lib/api';
import { Project, PaginatedProjects, CreateProjectPayload } from '../types/project.types';
import { ApiSuccess } from '../types/auth.types';

export const projectApi = {
  getProjects: async (): Promise<Project[]> => {
    const res = await fetchApi<ApiSuccess<PaginatedProjects>>('/projects?limit=50');
    return res.data.data;
  },

  getProjectById: async (projectId: string): Promise<Project> => {
    const res = await fetchApi<ApiSuccess<Project>>(`/projects/${projectId}`);
    return res.data;
  },

  createProject: async (payload: CreateProjectPayload): Promise<Project> => {
    const res = await fetchApi<ApiSuccess<Project>>('/projects', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  deleteProject: async (projectId: string): Promise<void> => {
    await fetchApi<{ success: true; message: string }>(`/projects/${projectId}`, {
      method: 'DELETE',
    });
  },
};
