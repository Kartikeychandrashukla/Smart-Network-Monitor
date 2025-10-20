import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const socketRef = useRef(null);
  const listenersRef = useRef({});

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    const socket = socketRef.current;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const on = (event, callback) => {
    if (!socketRef.current) return;

    // Remove existing listener if any
    if (listenersRef.current[event]) {
      socketRef.current.off(event, listenersRef.current[event]);
    }

    // Add new listener
    listenersRef.current[event] = callback;
    socketRef.current.on(event, (data) => {
      setLastUpdate({ event, data, timestamp: Date.now() });
      callback(data);
    });
  };

  const off = (event) => {
    if (!socketRef.current || !listenersRef.current[event]) return;

    socketRef.current.off(event, listenersRef.current[event]);
    delete listenersRef.current[event];
  };

  const emit = (event, data) => {
    if (!socketRef.current) return;
    socketRef.current.emit(event, data);
  };

  return {
    isConnected,
    lastUpdate,
    on,
    off,
    emit,
  };
};
