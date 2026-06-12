import { LogLevel } from '../models/Log';

export type LogRequest = {
  level: LogLevel;
  message: string;
  service: string;
  metadata?: Record<string, unknown> | undefined;
  timestamp?: string | Date | undefined;
};

export type LogResponse = {
  id: string;
  projectId: string;
  level: LogLevel;
  message: string;
  service: string;
  metadata?: Record<string, unknown> | undefined;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type PaginatedLogs = {
  data: LogResponse[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
};
