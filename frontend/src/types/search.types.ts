export interface LogResponse {
  _id: string;
  id?: string;
  projectId: string;
  level: string;
  message: string;
  service: string;
  environment: string;
  source: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
  aiAnalysis?: {
    summary: string;
    severity: string;
    rootCause: string;
    suggestedFix: string;
    confidence: number;
  };
}

export interface SearchResponse {
  results?: LogResponse[];
  logs?: LogResponse[];
  nextCursor: string | null;
  hasMore?: boolean;
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
