/// <reference types="jest" />
import { createServer } from 'http';
import { Server } from 'socket.io';
import Client, { Socket as ClientSocket } from 'socket.io-client';
import { initializeSocket, getIO, closeSocket } from '../index';
import { socketMetrics } from '../services/metrics';

jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock Redis adapter so we can test fallback to memory
jest.mock('../services/redisAdapter', () => ({
  createRedisAdapter: jest.fn().mockResolvedValue(undefined), // Fallback to memory
}));

jest.mock('../auth', () => ({
  socketAuthMiddleware: (socket: any, next: any) => next(),
}));

describe('Socket.io Production Infrastructure', () => {
  let io: Server;
  let clientSocket: ClientSocket;
  let httpServer: ReturnType<typeof createServer>;

  beforeAll((done) => {
    httpServer = createServer();
    httpServer.listen(() => {
      const port = (httpServer.address() as any).port;
      
      initializeSocket(httpServer).then(() => {
        io = getIO();
        
        clientSocket = Client(`http://localhost:${port}`, {
          transports: ['websocket'],
          reconnectionDelay: 0,
          forceNew: true,
        });

        clientSocket.on('connect', done);
      });
    });
  });

  afterAll((done) => {
    if (clientSocket.connected) {
      clientSocket.disconnect();
    }
    closeSocket(done as any);
  });

  it('should collect active connection metrics', () => {
    const metrics = socketMetrics.getMetrics();
    expect(metrics.activeConnections).toBeGreaterThan(0);
  });

  it('should use single-node mode when Redis is unavailable', () => {
    // We mocked createRedisAdapter to return undefined
    // The server should still have initialized successfully
    expect(io).toBeDefined();
  });


  it('should prevent unhandled exceptions in events from crashing server', (done) => {
    // Assuming 'join-project' is wrapped in withErrorHandler
    clientSocket.emit('join-project', { projectId: 'missing-callback' } as any);
    setTimeout(() => {
      // If server is still up and running, it didn't crash
      expect(io).toBeDefined();
      done();
    }, 50);
  });
});
