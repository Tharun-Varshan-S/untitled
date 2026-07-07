import { eventsService, connectionService } from './socket';

class RoomService {
  private joinedRooms = new Set<string>();

  public joinProject(projectId: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.joinedRooms.has(projectId)) {
        return resolve(true); // Already joined
      }

      const socket = connectionService.getSocket();
      if (!socket || !socket.connected) {
        return resolve(false);
      }

      eventsService.emit('join-project', { projectId }, (response) => {
        if (response.success) {
          this.joinedRooms.add(projectId);
        } else {
          console.warn(`[RoomService] Failed to join project ${projectId}:`, response.message);
        }
        resolve(response.success);
      });
    });
  }

  public leaveProject(projectId: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.joinedRooms.has(projectId)) {
        return resolve(true); // Already left or never joined
      }

      const socket = connectionService.getSocket();
      if (!socket || !socket.connected) {
        this.joinedRooms.delete(projectId); // Optimistic cleanup
        return resolve(true);
      }

      eventsService.emit('leave-project', { projectId }, (response) => {
        if (response.success) {
          this.joinedRooms.delete(projectId);
        }
        resolve(response.success);
      });
    });
  }

  public currentRooms(): string[] {
    return Array.from(this.joinedRooms);
  }

  public leaveAll(): void {
    // Make a copy to iterate safely
    const rooms = Array.from(this.joinedRooms);
    for (const projectId of rooms) {
      this.leaveProject(projectId);
    }
  }

  public onDisconnect(): void {
    // We retain the set if we want to auto-rejoin? 
    // Actually the prompt says: Disconnect -> leave all -> cleanup references
    this.joinedRooms.clear();
  }
}

export const roomService = new RoomService();
