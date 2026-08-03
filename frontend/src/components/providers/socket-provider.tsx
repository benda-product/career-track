'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';
import { SOCKET_URL } from '@/constants';
import { useAuthStore } from '@/store/auth.store';

type SocketStatus = 'disconnected' | 'connecting' | 'connected';

type SocketContextValue = {
  status: SocketStatus;
};

const SocketContext = createContext<SocketContextValue>({ status: 'disconnected' });

let socket: Socket | null = null;

function disconnectSocket() {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
}

function connectSocket(
  accessToken: string,
  onStatus: (status: SocketStatus) => void,
  handlers: {
    onApplicationUpdate: () => void;
    onNotification: () => void;
  }
) {
  disconnectSocket();
  onStatus('connecting');

  socket = io(SOCKET_URL, {
    auth: { token: accessToken },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 800,
    reconnectionDelayMax: 5000,
    timeout: 12000,
    forceNew: true,
  });

  socket.on('connect', () => onStatus('connected'));
  socket.on('disconnect', () => onStatus('disconnected'));
  socket.on('connect_error', () => onStatus('disconnected'));
  socket.on('application_update', handlers.onApplicationUpdate);
  socket.on('notification', handlers.onNotification);

  return socket;
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const [status, setStatus] = useState<SocketStatus>('disconnected');

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated || !accessToken) {
      disconnectSocket();
      setStatus('disconnected');
      return;
    }

    const handlers = {
      onApplicationUpdate: () => {
        queryClient.invalidateQueries({ queryKey: ['applications'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      },
      onNotification: () => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      },
    };

    connectSocket(accessToken, setStatus, handlers);

    // Chrome BFCache freezes pages and kills WebSockets. Reconnect when restored.
    const reconnectIfNeeded = () => {
      if (socket?.connected) {
        setStatus('connected');
        return;
      }
      connectSocket(accessToken, setStatus, handlers);
    };

    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) reconnectIfNeeded();
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') reconnectIfNeeded();
    };

    window.addEventListener('pageshow', onPageShow);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('pageshow', onPageShow);
      document.removeEventListener('visibilitychange', onVisibility);
      disconnectSocket();
      setStatus('disconnected');
    };
  }, [hasHydrated, isAuthenticated, accessToken, queryClient]);

  const value = useMemo(() => ({ status }), [status]);

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocketStatus() {
  return useContext(SocketContext).status;
}
