import { fetchApi } from '../lib/api';
import { ApiSuccess } from '../types/auth.types';
import { ProjectResponse } from '../types/project.types';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkspaceResult {
  workspace: Workspace;
  defaultProject: ProjectResponse;
  defaultApiKey: unknown;
}

export const workspaceApi = {
  getWorkspaces: async (): Promise<Workspace[]> => {
    const response = await fetchApi<ApiSuccess<Workspace[]>>('/workspaces', {
      method: 'GET',
    });
    return response.data;
  },

  createWorkspace: async (name: string): Promise<CreateWorkspaceResult> => {
    const response = await fetchApi<ApiSuccess<CreateWorkspaceResult>>('/workspaces', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    return response.data;
  },

  getWorkspaceProjects: async (workspaceId: string): Promise<ProjectResponse[]> => {
    const response = await fetchApi<ApiSuccess<ProjectResponse[]>>(`/workspaces/${workspaceId}/projects`, {
      method: 'GET',
    });
    return response.data;
  },

  createWorkspaceProject: async (workspaceId: string, payload: { name: string; description?: string }): Promise<ProjectResponse> => {
    const response = await fetchApi<ApiSuccess<ProjectResponse>>(`/workspaces/${workspaceId}/projects`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return response.data;
  },
};
