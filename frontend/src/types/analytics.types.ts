/**
 * Analytics types — aligned to backend analytics service contracts.
 *
 * Backend source of truth (all endpoints require ?projectId=):
 *   GET /analytics/overview    → OverviewData
 *   GET /analytics/log-levels  → LogLevelsData
 *   GET /analytics/services    → ServiceStat[]
 *   GET /analytics/trends      → TrendPoint[]
 *
 * IMPORTANT: There is NO global/cross-project summary endpoint.
 * All analytics are scoped to a single projectId.
 */

/** GET /analytics/overview?projectId= */
export interface OverviewData {
  totalLogs: number;
  totalErrors: number;
  totalWarnings: number;
  services: number; // count of unique services
}

/** GET /analytics/log-levels?projectId= */
export interface LogLevelsData {
  info: number;
  warn: number;
  error: number;
}

/** GET /analytics/services?projectId= — array item */
export interface ServiceStat {
  service: string;
  count: number;
}

/** GET /analytics/trends?projectId= — array item */
export interface TrendPoint {
  date: string; // 'YYYY-MM-DD'
  count: number;
}

/**
 * Composite type used by the frontend to aggregate all four
 * analytics calls for a single project into one object.
 */
export interface ProjectAnalyticsData {
  overview: OverviewData;
  logLevels: LogLevelsData;
  services: ServiceStat[];
  trends: TrendPoint[];
}
