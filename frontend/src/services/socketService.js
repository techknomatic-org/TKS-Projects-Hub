import { io } from 'socket.io-client';
import { authService } from './authService.js';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;
const listeners = new Set();

export const socketService = {
  connect() {
    if (socket?.connected) return;

    const token = authService.getToken();
    if (!token) return;

    console.log('[SOCKET] Connecting to server at:', SOCKET_URL);
    socket = io(SOCKET_URL, {
      auth: { token },
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      autoConnect: true
    });

    socket.on('connect', () => {
      console.log('[SOCKET] Connected to real-time notification gateway.');
    });

    socket.on('disconnect', (reason) => {
      console.warn('[SOCKET] Disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('[SOCKET] Connection Error:', error.message);
    });

    socket.on('notification', (newNotification) => {
      console.log('[SOCKET] New notification received:', newNotification);
      listeners.forEach(cb => cb(newNotification));
    });
  },

  disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  addListener(callback) {
    listeners.add(callback);
    return () => {
      listeners.delete(callback);
    };
  },

  removeListener(callback) {
    listeners.delete(callback);
  }
};

export default socketService;
