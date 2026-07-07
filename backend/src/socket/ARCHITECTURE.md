# Socket.io Architecture

This document provides a high-level overview of the Socket.io infrastructure in LogLens, designed for scalability, maintainability, and production readiness.

## Directory Structure

The socket subsystem is located in `backend/src/socket/` and organized by concern:

- `index.ts`: The central entry point. Initializes the `Server`, attaches middlewares, sets up connection handling, and delegates event registration.
- `config/`: Contains socket-specific configurations (ping intervals, connection recovery settings).
- `auth/`: Handles secure JWT authentication middleware.
- `rooms/`: Manages multi-tenant project isolation using `RoomManager`. Validates ownership before joining.
- `broadcast/`: Functions to safely emit data to specific rooms (e.g., `broadcastNewLog`).
- `analytics/`: Analytics broadcast logic with debounce mechanisms to prevent socket broadcast storms.
- `events/`: Centralized event registry mapping incoming client events to handlers.
- `types/`: Strongly typed definitions, pointing to shared contracts.
- `services/`: Production-hardening services including `metrics`, `rateLimiter`, `errorHandler`, and `redisAdapter`.

## Shared Contracts

To ensure the client and server agree on event names and payload shapes, the types and event names have been moved to `@shared/socket/` (in the project root):
- `events.ts`: Contains the `SocketEvents` enum defining all possible event names.
- `types.ts`: Contains `SharedServerToClientEvents` and `SharedClientToServerEvents` which enforce payload schemas on both ends.

## Production Hardening Features

1. **Redis Adapter (Optional)**: If `REDIS_URL` is set, the system uses `@socket.io/redis-adapter` for horizontal scalability across multiple Node.js instances.
2. **Rate Limiting**: `socketRateLimiter` restricts the number of events a client can emit per second, dropping excess messages to protect backend resources.
3. **Metrics Tracking**: `socketMetrics` continuously monitors active connections, connection durations, reconnections, auth failures, and message throughput. These metrics are periodically dumped to the logger.
4. **Error Handling**: Every event handler is wrapped in `withErrorHandler`, which acts as a safety net catching asynchronous errors, preventing server crashes, and safely propagating bounded error messages back to the client.
5. **Connection State Recovery**: Enabled in Socket.io v4 to temporarily buffer events if a client drops off momentarily, seamlessly recovering without needing full reconnections.
6. **Authentication & Multi-Tenant Isolation**: Only valid JWTs can connect. Further, joining a room requires explicit authorization checks via `RoomManager`, ensuring users only receive data for projects they have permission to access.

## Frontend Integration

The frontend abstracts Socket.io interactions using the `ConnectionService` and `EventManager`. 
React components *never* interact with `socket.emit` or `socket.on` directly. Instead, they use `eventManager.subscribe(SocketEvents.NEW_LOG, handler)`.
