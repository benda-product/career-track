import http from 'http';
import app from './app';
import { env } from './config/env';
import { connectDatabase } from './config/database';
import { initSocket } from './sockets/notification.socket';
import { logger } from './utils/logger';
import { atsApiBases, probeAtsConnectivity } from './services/ats.service';
import { assertSecurityEnv } from './utils/assertSecurityEnv';

assertSecurityEnv({ requireTurnstile: true });

const start = async () => {
  await connectDatabase();

  const atsBases = atsApiBases();
  logger.info('Talent by Benda Infotech API bases configured', { bases: atsBases });
  probeAtsConnectivity()
    .then((result) => {
      if (result.ok) {
        logger.info('Talent by Benda Infotech connectivity OK', { base: result.base });
      } else {
        logger.warn('Talent by Benda Infotech connectivity check failed on startup', { bases: result.bases });
      }
    })
    .catch((error) => {
      logger.warn('Talent by Benda Infotech connectivity check errored', { error });
    });

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
