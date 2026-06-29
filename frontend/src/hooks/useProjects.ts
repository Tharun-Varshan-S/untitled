import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectApi } from '../api/project.api';
import { QUERY_KEYS } from '../lib/query-keys';
import { CreateProjectPayload } from '../types/project.types';

export function useProjects() {
  return useQuery({
    queryKey: QUERY_KEYS.projects.all,
    queryFn: projectApi.getProjects,
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.projects.detail(id),
    queryFn: () => projectApi.getProjectById(id),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateProjectPayload) => projectApi.createProject(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects.all });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => projectApi.deleteProject(id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects.all });
      queryClient.removeQueries({ queryKey: QUERY_KEYS.projects.detail(deletedId) });
    },
  });
}
