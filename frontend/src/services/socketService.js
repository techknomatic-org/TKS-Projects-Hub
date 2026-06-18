import { io } from 'socket.io-client';
import { authService } from './authService.js';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;
const listeners = new Set();

export const socketService = {
  async connect() {
    if (socket?.connected) return;

    let token = authService.getToken();
    if (!token) return;

    // Pre-flight check: if token is expired, attempt silent refresh before connecting
    if (authService.isTokenExpired(token)) {
      console.log('[SOCKET] Token is expired or expiring. Refreshing silently before connecting...');
      try {
        token = await authService.refreshSessionSilently();
      } catch (err) {
        console.error('[SOCKET] Failed to refresh token for socket connection:', err);
        return;
      }
    }

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

    socket.on('connect_error', async (error) => {
      console.error('[SOCKET] Connection Error:', error.message);
      
      // Post-flight check: If rejected due to token expiry, silently refresh and reconnect
      if (error.message && (error.message.includes('expired') || error.message.includes('Authentication error'))) {
        console.log('[SOCKET] Auth error detected on socket. Attempting silent token refresh...');
        try {
          const newToken = await authService.refreshSessionSilently();
          if (socket) {
            socket.auth.token = newToken;
            socket.connect();
          }
        } catch (err) {
          console.error('[SOCKET] Failed to refresh token for socket reconnection:', err);
        }
      }
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
