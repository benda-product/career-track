import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/token';
import { env } from '../config/env';
import { logger } from '../utils/logger';

let io: Server;

export const initSocket = (server: HttpServer): Server => {
  const allowedOrigins = Array.from(
    new Set(
      [
        env.clientUrl,
        'http://localhost:3003',
        'http://127.0.0.1:3003',
      ].filter(Boolean)
    )
  );

  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string;
    if (!token) return next(new Error('Authentication required'));
    try {
      const payload = verifyAccessToken(token);
      socket.data.userId = payload.userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId as string;
    socket.join(`user:${userId}`);
    logger.debug('Socket connected', { userId });

    socket.on('disconnect', (reason) => {
      logger.debug('Socket disconnected', { userId, reason });
    });
  });

  return io;
};

export const emitNotification = (userId: string, notification: unknown): void => {
  if (io) {
    io.to(`user:${userId}`).emit('notification', notification);
  }
};

export const emitApplicationUpdate = (userId: string, payload: unknown): void => {
  if (io) {
    io.to(`user:${userId}`).emit('application_update', payload);
  }
};

export const getIO = (): Server | undefined => io;
