import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../api/analytics.api';
import { QUERY_KEYS } from '../lib/query-keys';

export function useAnalyticsOverview(projectId: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.analytics.overview(projectId!),
    queryFn: () => analyticsApi.getOverview(projectId!),
    enabled: !!projectId,
  });
}

export function useAnalyticsLogLevels(projectId: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.analytics.logLevels(projectId!),
    queryFn: () => analyticsApi.getLogLevels(projectId!),
    enabled: !!projectId,
  });
}

export function useAnalyticsServices(projectId: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.analytics.services(projectId!),
    queryFn: () => analyticsApi.getServices(projectId!),
    enabled: !!projectId,
  });
}

export function useAnalyticsTrends(projectId: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.analytics.trends(projectId!),
    queryFn: () => analyticsApi.getTrends(projectId!),
    enabled: !!projectId,
  });
}
