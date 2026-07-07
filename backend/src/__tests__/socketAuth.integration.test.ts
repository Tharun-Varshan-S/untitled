import { Server } from 'socket.io';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import http from 'http';
import { socketAuthMiddleware } from '../socket/auth/index';
import { signJwt } from '../utils/jwt';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/database';
import User from '../models/User';

describe('Socket.IO Authentication', () => {
  let io: Server;
  let serverSocket: any;
  let clientSocket: ClientSocket;
  let httpServer: http.Server;
  let validUser: any;
  let validToken: string;
  let port: number;

  beforeAll(async () => {
    await connectDB();
    
    // Create a mock user for testing
    validUser = await User.create({
      email: 'socketest@example.com',
      passwordHash: 'password123',
      name: 'Socket Tester'
    });
    
    validToken = signJwt({ userId: validUser._id.toString() });
  });

  afterAll(async () => {
    await User.deleteMany({ email: 'socketest@example.com' });
    await disconnectDB();
  });

  beforeEach((done) => {
    httpServer = http.createServer();
    io = new Server(httpServer);
    io.use(socketAuthMiddleware);
    
    httpServer.listen(() => {
      port = (httpServer.address() as any).port;
      done();
    });
  });

  afterEach(() => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
    io.close();
    httpServer.close();
  });

  it('should successfully connect with a valid JWT', (done) => {
    clientSocket = Client(`http://localhost:${port}`, {
      auth: { token: validToken }
    });

    clientSocket.on('connect', () => {
      expect(clientSocket.connected).toBe(true);
      done();
    });

    clientSocket.on('connect_error', (err) => {
      done(err);
    });
  });

  it('should reject connection with missing token', (done) => {
    clientSocket = Client(`http://localhost:${port}`);

    clientSocket.on('connect_error', (err) => {
      expect(err.message).toContain('Token missing');
      done();
    });
  });

  it('should reject connection with invalid token', (done) => {
    clientSocket = Client(`http://localhost:${port}`, {
      auth: { token: 'invalid.token.here' }
    });

    clientSocket.on('connect_error', (err) => {
      expect(err.message).toContain('Invalid or expired token');
      done();
    });
  });
});
