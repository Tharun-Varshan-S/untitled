import { SharedServerToClientEvents, SharedClientToServerEvents, SharedAnalyticsUpdatePayload, SharedLogResponse } from '@shared/socket/types';

export type ServerToClientEvents = SharedServerToClientEvents;
export type ClientToServerEvents = SharedClientToServerEvents;

export type AnalyticsUpdatePayload = SharedAnalyticsUpdatePayload;
export type LogEntry = SharedLogResponse;
