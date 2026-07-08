import { SafeUser } from '../../modules/auth/auth.types';
import { SharedClientToServerEvents, SharedServerToClientEvents } from '../../../../shared/socket/types';

export type ServerToClientEvents = SharedServerToClientEvents;
export type ClientToServerEvents = SharedClientToServerEvents;

export interface InterServerEvents {
  // For communication between servers if scaling
}

export interface SocketData {
  user?: SafeUser;
  connectedAt?: number;
}
