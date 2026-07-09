import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiKeyApi } from '../api/api-key.api';
import { QUERY_KEYS } from '../lib/query-keys';
import { CreateApiKeyPayload } from '../types/api-key.types';

export function useApiKeys(projectId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.apiKeys.list(projectId),
    queryFn: () => apiKeyApi.getApiKeys(projectId),
    enabled: !!projectId,
  });
}

export function useCreateApiKey(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateApiKeyPayload) => apiKeyApi.createApiKey(projectId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.apiKeys.list(projectId) });
    },
  });
}
