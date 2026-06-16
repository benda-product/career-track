'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';
import { SOCKET_URL } from '@/constants';
import { useAuthStore } from '@/store/auth.store';

let socket: Socket | null = null;

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated || !accessToken) {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
      return;
    }

    socket = io(SOCKET_URL, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
    });

    const onApplicationUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    const onNotification = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    socket.on('application_update', onApplicationUpdate);
    socket.on('notification', onNotification);

    return () => {
      socket?.off('application_update', onApplicationUpdate);
      socket?.off('notification', onNotification);
      socket?.disconnect();
      socket = null;
    };
  }, [hasHydrated, isAuthenticated, accessToken, queryClient]);

  return <>{children}</>;
}
