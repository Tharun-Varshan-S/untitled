import { fetchApi } from '../lib/api';
import { Project, CreateProjectPayload } from '../types/project.types';

class ProjectService {
  async getProjects(): Promise<Project[]> {
    return fetchApi<Project[]>('/projects');
  }

  async getProjectById(projectId: string): Promise<Project> {
    return fetchApi<Project>(`/projects/${projectId}`);
  }

  async createProject(payload: CreateProjectPayload): Promise<Project> {
    return fetchApi<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async deleteProject(projectId: string): Promise<{ success: boolean }> {
    return fetchApi<{ success: boolean }>(`/projects/${projectId}`, {
      method: 'DELETE',
    });
  }
}

export const projectService = new ProjectService();
