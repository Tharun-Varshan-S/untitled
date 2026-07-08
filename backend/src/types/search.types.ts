import { LogResponse } from './logs.types';
import { Types } from 'mongoose';

export interface SearchQuery {
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

export interface SearchFilters {
  projectId: Types.ObjectId;
  level?: string;
  service?: string;
  'metadata.environment'?: string;
  'metadata.source'?: string;
  timestamp?: {
    $gte?: Date;
    $lte?: Date;
  };
  $text?: {
    $search: string;
  };
  [key: string]: any;
}

export interface PaginatedSearchResponse {
  results: LogResponse[];
  nextCursor: string | null;
  hasMore: boolean;
  limit: number;
}
