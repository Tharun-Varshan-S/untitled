/**
 * Analytics service — used in Server Components only.
 * Uses fetchApiServer which reads the JWT from cookies server-side.
 *
 * DO NOT import this service into Client Components.
 *
 * All analytics endpoints are scoped to a single projectId.
 * There is NO global/cross-project summary endpoint in the backend.
 *
 * GET /analytics/overview?projectId=   → OverviewData
 * GET /analytics/log-levels?projectId= → LogLevelsData
 * GET /analytics/services?projectId=   → ServiceStat[]
 * GET /analytics/trends?projectId=     → TrendPoint[]
 */

import { fetchApiServer } from '../lib/api.server';
import {
  OverviewData,
  LogLevelsData,
  ServiceStat,
  TrendPoint,
  ProjectAnalyticsData,
} from '../types/analytics.types';

class AnalyticsService {
  async getOverview(projectId: string): Promise<OverviewData> {
    return fetchApiServer<OverviewData>(
      `/analytics/overview?projectId=${encodeURIComponent(projectId)}`
    );
  }

  async getLogLevels(projectId: string): Promise<LogLevelsData> {
    return fetchApiServer<LogLevelsData>(
      `/analytics/log-levels?projectId=${encodeURIComponent(projectId)}`
    );
  }

  async getServices(projectId: string): Promise<ServiceStat[]> {
    return fetchApiServer<ServiceStat[]>(
      `/analytics/services?projectId=${encodeURIComponent(projectId)}`
    );
  }

  async getTrends(projectId: string): Promise<TrendPoint[]> {
    return fetchApiServer<TrendPoint[]>(
      `/analytics/trends?projectId=${encodeURIComponent(projectId)}`
    );
  }

  /**
   * Fetches all four analytics endpoints for one project in parallel.
   */
  async getProjectAnalytics(projectId: string): Promise<ProjectAnalyticsData> {
    const [overview, logLevels, services, trends] = await Promise.all([
      this.getOverview(projectId),
      this.getLogLevels(projectId),
      this.getServices(projectId),
      this.getTrends(projectId),
    ]);
    return { overview, logLevels, services, trends };
  }
}

export const analyticsService = new AnalyticsService();
