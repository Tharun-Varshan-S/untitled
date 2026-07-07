// Centralized Event Definitions to avoid hardcoded strings

export const SocketEvents = {
  // Client to Server
  JOIN_PROJECT: 'join-project',
  LEAVE_PROJECT: 'leave-project',

  // Server to Client
  NEW_LOG: 'new-log',
  ANALYTICS_UPDATE: 'analytics-update',

  // Standard Connection Events
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
} as const;

export type SocketEventName = typeof SocketEvents[keyof typeof SocketEvents];
