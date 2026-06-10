import http from 'http';
import app from './app';
import { env } from './config/env';
import { connectDatabase } from './config/database';
import { initSocket } from './sockets/notification.socket';
import { logger } from './utils/logger';

const start = async () => {
  await connectDatabase();

  const server = http.createServer(app);
  initSocket(server);

  server.listen(env.port, () => {
    logger.info(`CareerTrack API running on port ${env.port}`);
    logger.info(`Swagger docs: http://localhost:${env.port}/api-docs`);
  });
};

start().catch((error) => {
  logger.error('Failed to start server', { error });
  process.exit(1);
});
