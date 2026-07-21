import { SocketEvents } from './events';

// Data shapes matching our backend models
export interface SharedSafeUser {
  id: string;
  email: string;
}

export interface SharedLogResponse {
  id: string;
  projectId: string;
  level: string;
  message: string;
  service?: string;
  environment?: string;
  source?: string;
  metadata?: Record<string, unknown> | undefined;
  createdAt: string | Date;
  timestamp?: string | Date;
}

export interface SharedAnalyticsUpdatePayload {
  overview: {
    totalLogs: number;
    totalErrors: number;
    totalWarnings: number;
    services: number;
  };
  logLevels: {
    info: number;
    warn: number;
    error: number;
  };
  services: Array<{ service: string; count: number }>;
  trends: Array<{ date: string; count: number }>;
}

export interface SharedServerToClientEvents {
  [SocketEvents.NEW_LOG]: (log: SharedLogResponse) => void;
  [SocketEvents.ANALYTICS_UPDATE]: (payload: SharedAnalyticsUpdatePayload) => void;
}

export interface SharedClientToServerEvents {
  [SocketEvents.JOIN_PROJECT]: (payload: { projectId: string }, callback?: (response: { success: boolean; message?: string }) => void) => void;
  [SocketEvents.LEAVE_PROJECT]: (payload: { projectId: string }, callback?: (response: { success: boolean; message?: string }) => void) => void;
}
