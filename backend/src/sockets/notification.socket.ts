import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/token';
import { env } from '../config/env';
import { logger } from '../utils/logger';

let io: Server;

export const initSocket = (server: HttpServer): Server => {
  io = new Server(server, {
    cors: { origin: env.clientUrl, credentials: true },
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

    socket.on('disconnect', () => {
      logger.debug('Socket disconnected', { userId });
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
