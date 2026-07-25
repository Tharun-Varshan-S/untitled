import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workspaceApi, Workspace, CreateWorkspaceResult } from '@/api/workspace.api';
import { ProjectResponse } from '@/types/project.types';
import { useWorkspaceStore, useProjectStore } from '@/store';
import { useEffect } from 'react';

export const WORKSPACE_KEYS = {
  all: ['workspaces'] as const,
  list: () => [...WORKSPACE_KEYS.all, 'list'] as const,
  projects: (workspaceId: string) => [...WORKSPACE_KEYS.all, workspaceId, 'projects'] as const,
};

export const useWorkspaces = () => {
  const { selectedWorkspaceId, setSelectedWorkspace } = useWorkspaceStore();

  const query = useQuery<Workspace[]>({
    queryKey: WORKSPACE_KEYS.list(),
    queryFn: workspaceApi.getWorkspaces,
  });

  // Auto-select first workspace if none selected or invalid
  useEffect(() => {
    if (query.data && query.data.length > 0) {
      const exists = query.data.some((w) => w.id === selectedWorkspaceId);
      if (!selectedWorkspaceId || !exists) {
        setSelectedWorkspace(query.data[0].id, query.data[0].name);
      }
    }
  }, [query.data, selectedWorkspaceId, setSelectedWorkspace]);

  return query;
};

export const useWorkspaceProjects = (workspaceId: string | null) => {
  const { selectedProjectId, setSelectedProject } = useProjectStore();

  const query = useQuery<ProjectResponse[]>({
    queryKey: WORKSPACE_KEYS.projects(workspaceId || ''),
    queryFn: () => workspaceApi.getWorkspaceProjects(workspaceId!),
    enabled: !!workspaceId,
  });

  // Auto-select first project in current workspace if none selected or invalid
  useEffect(() => {
    if (query.data && query.data.length > 0) {
      const exists = query.data.some((p) => p.id === selectedProjectId);
      if (!selectedProjectId || !exists) {
        setSelectedProject(query.data[0].id, query.data[0].name);
      }
    }
  }, [query.data, selectedProjectId, setSelectedProject]);

  return query;
};

export const useCreateWorkspace = () => {
  const queryClient = useQueryClient();
  const { setSelectedWorkspace } = useWorkspaceStore();
  const { setSelectedProject } = useProjectStore();

  return useMutation<CreateWorkspaceResult, Error, string>({
    mutationFn: (name: string) => workspaceApi.createWorkspace(name),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: WORKSPACE_KEYS.list() });
      setSelectedWorkspace(data.workspace.id, data.workspace.name);
      setSelectedProject(data.defaultProject.id, data.defaultProject.name);
    },
  });
};

export const useCreateWorkspaceProject = () => {
  const queryClient = useQueryClient();
  const { setSelectedProject } = useProjectStore();

  return useMutation<ProjectResponse, Error, { workspaceId: string; name: string; description?: string }>({
    mutationFn: ({ workspaceId, name, description }) =>
      workspaceApi.createWorkspaceProject(workspaceId, { name, description }),
    onSuccess: (newProject, variables) => {
      queryClient.invalidateQueries({ queryKey: WORKSPACE_KEYS.projects(variables.workspaceId) });
      setSelectedProject(newProject.id, newProject.name);
    },
  });
};
