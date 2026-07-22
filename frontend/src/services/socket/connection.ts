import { io, Socket } from 'socket.io-client';
import { AUTH_TOKEN_KEY } from '@/lib/constants';
import { ClientToServerEvents, ServerToClientEvents } from './types';

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

class ConnectionService {
  private socket: AppSocket;
  private backendUrl: string;
  private status: ConnectionStatus = 'disconnected';
  private statusListeners: Set<(status: ConnectionStatus) => void> = new Set();

  constructor() {
    const rawUrl = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    
    // Extract the origin to avoid connecting to the '/api' namespace
    try {
      this.backendUrl = new URL(rawUrl).origin;
    } catch {
      this.backendUrl = rawUrl.replace(/\/api$/, '');
    }
    
    this.socket = io(this.backendUrl, {
      autoConnect: false,
      withCredentials: true,
      transports: ['websocket', 'polling'], // Prefer WebSocket transport first
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.setupInternalListeners();
  }

  private setupInternalListeners() {
    this.socket.on('connect', () => {
      this.updateStatus('connected');
    });

    this.socket.on('disconnect', (reason) => {
      if (reason === 'io server disconnect' || reason === 'io client disconnect') {
        this.updateStatus('disconnected');
      } else {
        this.updateStatus('reconnecting');
      }
    });

    this.socket.on('connect_error', (error) => {
      const isAuthError = error.message.includes('Authentication error') || error.message.includes('Token');
      if (isAuthError) {
        // Disconnect immediately on auth rejection to avoid polling error loop
        this.socket.disconnect();
        this.updateStatus('disconnected');
      } else {
        this.updateStatus('error');
      }
    });
  }

  private updateStatus(newStatus: ConnectionStatus) {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.statusListeners.forEach(listener => listener(newStatus));
    }
  }

  public connect(): void {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    
    // Do not attempt connection if unauthenticated
    if (!token) {
      this.updateStatus('disconnected');
      return;
    }

    this.socket.auth = { token };

    if (!this.socket.connected) {
      this.updateStatus('connecting');
      this.socket.connect();
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.updateStatus('disconnected');
    }
  }

  public getSocket(): AppSocket {
    return this.socket;
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public subscribeToStatus(listener: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(listener);
    // Emit immediate current state
    listener(this.status);
    return () => {
      this.statusListeners.delete(listener);
    };
  }
}

// Singleton connection service instance
export const connectionService = new ConnectionService();
