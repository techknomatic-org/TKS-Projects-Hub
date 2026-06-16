import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from './logger.js';

let io;

export const initSocket = (server) => {
  const allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'];
  if (process.env.ALLOWED_ORIGINS) {
    allowedOrigins.push(...process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()));
  }

  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true
    }
  });

  // Middleware for JWT authorization handshake
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!token) {
      logger.error('[SOCKET] Connection rejected: No authorization token provided.');
      return next(new Error('Authentication error: Token required.'));
    }

    try {
      const jwtSecret = process.env.JWT_SECRET || 'tks_jwt_secret_key_change_me_in_prod';
      const decoded = jwt.verify(token, jwtSecret);
      socket.user = decoded;
      next();
    } catch (err) {
      logger.error(`[SOCKET] Connection rejected: Invalid authorization token. Error: ${err.message}`);
      return next(new Error('Authentication error: Invalid token.'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    logger.info(`[SOCKET] User connected: ${socket.user.name} (${userId}) - Socket: ${socket.id}`);

    // Join room for user specific alerts
    socket.join(userId);

    socket.on('disconnect', () => {
      logger.info(`[SOCKET] User disconnected: ${socket.user.name} (${userId}) - Socket: ${socket.id}`);
    });
  });

  return io;
};

// Send message to specific user
export const emitToUser = (userId, event, data) => {
  if (io) {
    logger.info(`[SOCKET] Emitting event "${event}" to user room ${userId}`);
    io.to(userId).emit(event, data);
  } else {
    logger.warn('[SOCKET] Emit failed: Socket.IO not initialized.');
  }
};

// Broadcast message to all connected clients
export const broadcast = (event, data) => {
  if (io) {
    logger.info(`[SOCKET] Broadcasting event "${event}" to all connected users`);
    io.emit(event, data);
  } else {
    logger.warn('[SOCKET] Broadcast failed: Socket.IO not initialized.');
  }
};

export default {
  initSocket,
  emitToUser,
  broadcast
};
