export interface LogResponse {
  _id: string;
  id?: string;
  projectId: string;
  level: string;
  message: string;
  service: string;
  environment: string;
  source: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface SearchResponse {
  logs: LogResponse[];
  nextCursor: string | null;
  totalStats?: {
    totalMatches?: number;
    hasMore?: boolean;
  };
}

export interface SearchParams {
  projectId: string;
  q?: string;
  level?: string;
  service?: string;
  environment?: string;
  source?: string;
  startDate?: string;
  endDate?: string;
  cursor?: string;
  limit?: number;
}
