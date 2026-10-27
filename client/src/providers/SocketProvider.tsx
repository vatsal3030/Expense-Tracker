'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthProvider';
import { triggerDataRefresh } from '@/lib/events';
import { Snackbar, Alert } from '@mui/material';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinGroup: (groupId: string) => void;
  leaveGroup: (groupId: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  joinGroup: () => {},
  leaveGroup: () => {},
});

export function useSocket() {
  return useContext(SocketContext);
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // Live Toast for incoming notifications
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'info' | 'success' | 'warning' }>({
    open: false,
    message: '',
    severity: 'info',
  });

  const activeUserId = user?.id || profile?.id;

  useEffect(() => {
    // Only connect when user is authenticated
    if (!activeUserId) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    let socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    if (typeof window !== 'undefined') {
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (isLocal && window.location.port === '3000') {
        socketUrl = socketUrl || 'http://localhost:5000';
      } else {
        // On remote hosts or behind gateway, connect through current origin /socket.io
        socketUrl = window.location.origin;
      }
    } else if (!socketUrl) {
      socketUrl = 'http://localhost:5000';
    }

    const s = io(socketUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    s.on('connect', () => {
      setIsConnected(true);
      s.emit('join:user', activeUserId);
    });

    s.on('disconnect', () => {
      setIsConnected(false);
    });

    // Real-time notification handler
    s.on('notification', (data: any) => {
      triggerDataRefresh({ type: 'notification', data });
      if (data?.title || data?.message) {
        setToast({
          open: true,
          message: `${data.title ? `🔔 ${data.title}: ` : ''}${data.message || 'New update'}`,
          severity: data?.type?.includes('CONFIRMED') ? 'success' : 'info',
        });
      }
    });

    // Real-time expense updates
    s.on('expense:created', (data: any) => {
      triggerDataRefresh({ type: 'expense', data });
    });

    s.on('expense:updated', (data: any) => {
      triggerDataRefresh({ type: 'expense', data });
    });

    s.on('expense:deleted', (data: any) => {
      triggerDataRefresh({ type: 'expense', data });
    });

    // Real-time settlement updates
    s.on('settlement:created', (data: any) => {
      triggerDataRefresh({ type: 'settlement', data });
    });

    s.on('settlement:confirmed', (data: any) => {
      triggerDataRefresh({ type: 'settlement', data });
      setToast({
        open: true,
        message: '✅ Payment settlement confirmed and balance reconciled!',
        severity: 'success',
      });
    });

    // Real-time group updates
    s.on('group:updated', (data: any) => {
      triggerDataRefresh({ type: 'group', data });
    });

    socketRef.current = s;
    setSocket(s);

    return () => {
      s.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    };
  }, [activeUserId]);

  const joinGroup = useCallback((groupId: string) => {
    if (socketRef.current?.connected && groupId) {
      socketRef.current.emit('join:group', groupId);
    }
  }, []);

  const leaveGroup = useCallback((groupId: string) => {
    if (socketRef.current?.connected && groupId) {
      socketRef.current.emit('leave:group', groupId);
    }
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected, joinGroup, leaveGroup }}>
      {children}
      <Snackbar
        open={toast.open}
        autoHideDuration={4500}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          severity={toast.severity}
          variant="filled"
          sx={{
            fontWeight: 600,
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </SocketContext.Provider>
  );
}
