'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { connectionService } from '@/services/socket';
import { useSocketConnection } from '@/hooks/useSocketConnection';
import { AUTH_TOKEN_KEY } from '@/lib/constants';

interface SocketContextValue {
  isConnected: boolean;
  isReconnecting: boolean;
  status: string;
}

const SocketContext = createContext<SocketContextValue>({
  isConnected: false,
  isReconnecting: false,
  status: 'disconnected',
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { isConnected, isReconnecting, status } = useSocketConnection();

  useEffect(() => {
    // If we have a token (user is likely logged in), ensure we connect.
    // This catches page reloads inside protected routes.
    const hasToken = typeof window !== 'undefined' && localStorage.getItem(AUTH_TOKEN_KEY);
    if (hasToken) {
      connectionService.connect();
    }

    // Note: Disconnect logic on unmount is tricky because the user might just navigate
    // to another protected page. Socket disconnection will be explicitly handled in authService.logout().
    // We intentionally omit disconnect() in the cleanup here to keep the connection alive across page transitions.
  }, []);

  return (
    <SocketContext.Provider value={{ isConnected, isReconnecting, status }}>
      {children}
    </SocketContext.Provider>
  );
}

// Hook to consume the context
export const useSocketContext = () => useContext(SocketContext);
