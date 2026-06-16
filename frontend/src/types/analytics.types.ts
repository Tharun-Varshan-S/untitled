export interface LogEntry {
  _id: string;
  projectId: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  meta?: Record<string, any>;
  timestamp: string;
}

export interface AnalyticsSummary {
  totalLogs: number;
  errorLogs: number;
  warningLogs: number;
  activeProjects: number;
}

export interface LogDistribution {
  date: string;
  info: number;
  warn: number;
  error: number;
}

export interface ProjectAnalytics {
  projectId: string;
  summary: AnalyticsSummary;
  recentLogs: LogEntry[];
  distribution: LogDistribution[];
}
