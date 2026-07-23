import { createCompanionServer } from './app.js';

const port = Number(process.env.COMPANION_PORT) || 8787;
const host = process.env.COMPANION_HOST || '127.0.0.1';

const server = await createCompanionServer();
server.listen(port, host, () => {
  console.info(`Kafkaland companion API listening on http://${host}:${port}`);
});

function shutdown(signal) {
  console.info(`Companion API received ${signal}; closing.`);
  server.close((error) => {
    if (error) {
      console.error('Companion API shutdown failed');
      process.exitCode = 1;
    }
  });
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
