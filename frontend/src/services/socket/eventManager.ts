import { connectionService } from './connection';
import { ServerToClientEvents } from './types';

type EventNames = keyof ServerToClientEvents;
type EventCallback<T extends EventNames> = ServerToClientEvents[T];

class EventManager {
  // We keep track of how many subscribers we have for each event
  // to avoid calling socket.on() multiple times for the same event
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private subscribers: Map<EventNames, Set<EventCallback<any>>> = new Map();

  /**
   * Subscribes to a socket event.
   * Handles preventing duplicate listeners on the raw socket.
   */
  public subscribe<T extends EventNames>(event: T, callback: EventCallback<T>): () => void {
    let eventSubscribers = this.subscribers.get(event);
    
    if (!eventSubscribers) {
      eventSubscribers = new Set();
      this.subscribers.set(event, eventSubscribers);
      
      // Register exactly one listener on the raw socket
      const socket = connectionService.getSocket();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      socket.on(event as any, (...args: any[]) => {
        // @ts-expect-error - TS cannot resolve dynamic event signatures here
        this.dispatch(event, ...args);
      });
    }

    eventSubscribers.add(callback);

    // Return a cleanup function
    return () => {
      this.unsubscribe(event, callback);
    };
  }

  /**
   * Unsubscribes from a socket event.
   * Cleans up the raw socket listener if no subscribers are left.
   */
  public unsubscribe<T extends EventNames>(event: T, callback: EventCallback<T>): void {
    const eventSubscribers = this.subscribers.get(event);
    if (eventSubscribers) {
      eventSubscribers.delete(callback);
      
      if (eventSubscribers.size === 0) {
        // No one is listening anymore, remove the raw socket listener
        const socket = connectionService.getSocket();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        socket.off(event as any);
        this.subscribers.delete(event);
      }
    }
  }

  /**
   * Dispatches the event to all registered subscribers.
   * Wraps calls in try/catch to ensure one failing callback doesn't crash others or React.
   */
  private dispatch<T extends EventNames>(event: T, ...args: Parameters<EventCallback<T>>): void {
    const eventSubscribers = this.subscribers.get(event);
    if (eventSubscribers) {
      eventSubscribers.forEach((callback) => {
        try {
          // TS has trouble with the spread args matching the exact callback signature dynamically, but we disabled this error
          callback(...args);
        } catch (error) {
          console.error(`[EventManager] Error in listener for event '${event}':`, error);
        }
      });
    }
  }
}

// Singleton event manager instance
export const eventManager = new EventManager();
