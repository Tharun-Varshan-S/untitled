import { connectionService } from './connection';
import { ClientToServerEvents } from './types';

type ClientEventNames = keyof ClientToServerEvents;
type ClientEventCallback<T extends ClientEventNames> = ClientToServerEvents[T];

class EventsService {
  /**
   * Emits an event to the server.
   * Centralized here so no UI component calls socket.emit directly.
   */
  public emit<T extends ClientEventNames>(event: T, ...args: Parameters<ClientEventCallback<T>>): void {
    const socket = connectionService.getSocket();
    if (socket.connected) {
      // TS has trouble with spread args matching dynamically, but we disabled the error
      socket.emit(event, ...args);
    } else {
      console.warn(`[EventsService] Attempted to emit '${event}' while socket is disconnected.`);
    }
  }
}

export const eventsService = new EventsService();
