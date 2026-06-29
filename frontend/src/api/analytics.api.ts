import { fetchApi } from '../lib/api';
import {
  OverviewData,
  LogLevelsData,
  ServiceStat,
  TrendPoint,
} from '../types/analytics.types';

export const analyticsApi = {
  getOverview: async (projectId: string): Promise<OverviewData> => {
    return fetchApi<OverviewData>(
      `/analytics/overview?projectId=${encodeURIComponent(projectId)}`
    );
  },

  getLogLevels: async (projectId: string): Promise<LogLevelsData> => {
    return fetchApi<LogLevelsData>(
      `/analytics/log-levels?projectId=${encodeURIComponent(projectId)}`
    );
  },

  getServices: async (projectId: string): Promise<ServiceStat[]> => {
    return fetchApi<ServiceStat[]>(
      `/analytics/services?projectId=${encodeURIComponent(projectId)}`
    );
  },

  getTrends: async (projectId: string): Promise<TrendPoint[]> => {
    return fetchApi<TrendPoint[]>(
      `/analytics/trends?projectId=${encodeURIComponent(projectId)}`
    );
  },
};
