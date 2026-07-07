"use strict";
// Centralized Event Definitions to avoid hardcoded strings
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketEvents = void 0;
exports.SocketEvents = {
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
};
//# sourceMappingURL=events.js.map