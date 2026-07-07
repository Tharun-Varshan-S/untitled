import { useEffect, useState } from 'react';
import { connectionService, ConnectionStatus } from '../services/socket';

/**
 * Custom hook to expose the Socket connection state cleanly.
 * Does not expose the raw Socket instance.
 */
export function useSocketConnection() {
  const [status, setStatus] = useState<ConnectionStatus>(connectionService.getStatus());

  useEffect(() => {
    // Subscribe to status changes from the centralized connection service
    const unsubscribe = connectionService.subscribeToStatus((newStatus) => {
      setStatus(newStatus);
    });

    return unsubscribe;
  }, []);

  return { 
    isConnected: status === 'connected',
    isReconnecting: status === 'reconnecting',
    status 
  };
}
