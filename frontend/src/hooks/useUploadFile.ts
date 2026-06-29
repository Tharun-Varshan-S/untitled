import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadApi } from '../api/upload.api';
import { QUERY_KEYS } from '../lib/query-keys';

export function useUploadFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, projectId }: { file: File; projectId: string }) => 
      uploadApi.uploadFile(file, projectId),
    onSuccess: (_, { projectId }) => {
      // Invalidate analytics queries to reflect the new uploaded data
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.analytics.overview(projectId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.analytics.logLevels(projectId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.analytics.services(projectId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.uploads.list(projectId) });
    },
  });
}
