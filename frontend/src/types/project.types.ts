export interface Project {
  _id: string;
  name: string;
  description?: string;
  apiKey: string;
  status: 'active' | 'archived';
  owner: string; // User ID
  createdAt: string;
  updatedAt: string;
  stats?: ProjectStats;
}

export interface ProjectStats {
  totalLogs: number;
  errorCount: number;
  warningCount: number;
  lastActivity: string;
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
}
