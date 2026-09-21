import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const connectDatabase = async ({
  retries = Number(process.env.MONGODB_CONNECT_RETRIES || 8),
  delayMs = Number(process.env.MONGODB_CONNECT_RETRY_MS || 3000),
} = {}): Promise<void> => {
  let lastError: unknown;

  for (let attempt = 1; attempt <= Math.max(1, retries); attempt += 1) {
    try {
      await mongoose.connect(env.mongoUri, {
        serverSelectionTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_MS || 10000),
      });
      logger.info(
        attempt > 1
          ? `MongoDB connected successfully (attempt ${attempt})`
          : 'MongoDB connected successfully'
      );
      break;
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      if (attempt >= retries) {
        logger.error('MongoDB connection failed after retries', { error: message });
        throw lastError instanceof Error ? lastError : new Error(message);
      }
      logger.warn(`MongoDB connection failed (attempt ${attempt}/${retries}): ${message}. Retrying…`);
      await sleep(delayMs);
    }
  }

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  mongoose.connection.on('reconnected', () => {
    logger.info('MongoDB reconnected');
  });
};
