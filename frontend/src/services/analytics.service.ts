import { fetchApi } from '../lib/api';
import { AnalyticsSummary, ProjectAnalytics, LogEntry } from '../types/analytics.types';

class AnalyticsService {
  async getGlobalSummary(): Promise<AnalyticsSummary> {
    return fetchApi<AnalyticsSummary>('/analytics/summary');
  }

  async getProjectAnalytics(projectId: string): Promise<ProjectAnalytics> {
    return fetchApi<ProjectAnalytics>(`/analytics/projects/${projectId}`);
  }

  async getRecentLogs(projectId?: string): Promise<LogEntry[]> {
    const endpoint = projectId ? `/analytics/logs?projectId=${projectId}` : '/analytics/logs';
    return fetchApi<LogEntry[]>(endpoint);
  }
}

export const analyticsService = new AnalyticsService();
