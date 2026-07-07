import { Socket } from 'socket.io';
import { getProjectById } from '../../services/project.service';
import { logger } from '../../utils/logger';
import { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from '../types';

type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

class RoomManager {
  // Track sockets and the rooms they are in to handle duplicate joins and fast cleanup
  private socketRooms = new Map<string, Set<string>>();

  private getRoomName(projectId: string): string {
    return `project_${projectId}`;
  }

  public async joinProject(socket: AppSocket, projectId: string): Promise<boolean> {
    try {
      const user = socket.data.user;
      if (!user) {
        logger.warn(`[Socket] Unauthorized join attempt: No user on socket ${socket.id}`);
        return false;
      }

      // Check if already in room
      const roomName = this.getRoomName(projectId);
      const currentRooms = this.socketRooms.get(socket.id) || new Set();
      
      if (currentRooms.has(roomName)) {
        return true; // Already joined
      }

      // Validate project access securely using existing project service
      await getProjectById(user.id, projectId);

      // Join the socket.io room
      await socket.join(roomName);

      // Track internally
      currentRooms.add(roomName);
      this.socketRooms.set(socket.id, currentRooms);

      logger.info(`[Socket] User ${user.id} joined room ${roomName} via socket ${socket.id}`);
      return true;

    } catch (error) {
      // getProjectById throws if unauthorized/not found
      logger.warn(`[Socket] Unauthorized room join rejected: User ${socket.data.user?.id} attempted to join ${projectId}. Reason: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  public async leaveProject(socket: AppSocket, projectId: string): Promise<void> {
    const roomName = this.getRoomName(projectId);
    
    // Leave socket.io room
    await socket.leave(roomName);

    // Update internal tracking
    const currentRooms = this.socketRooms.get(socket.id);
    if (currentRooms) {
      currentRooms.delete(roomName);
      if (currentRooms.size === 0) {
        this.socketRooms.delete(socket.id);
      }
    }

    logger.info(`[Socket] User ${socket.data.user?.id} left room ${roomName} via socket ${socket.id}`);
  }

  public leaveAllRooms(socket: AppSocket): void {
    const currentRooms = this.socketRooms.get(socket.id);
    if (currentRooms) {
      // Sockets automatically leave rooms on disconnect natively, 
      // but we need to clear our registry explicitly to prevent memory leaks
      for (const roomName of currentRooms) {
        socket.leave(roomName);
        logger.debug(`[Socket] Cleanup: socket ${socket.id} left room ${roomName}`);
      }
      this.socketRooms.delete(socket.id);
    }
  }

  public getCurrentRooms(socket: AppSocket): string[] {
    const currentRooms = this.socketRooms.get(socket.id);
    return currentRooms ? Array.from(currentRooms) : [];
  }
}

export const roomManager = new RoomManager();
