import { app } from './app';
import { connectDatabase, disconnectDatabase } from './config/db';
import { env } from './config/env';

async function main() {
  await connectDatabase();
  const server = app.listen(env.PORT, () => {
    console.info(`API ready: http://localhost:${env.PORT}`);
    console.info(`Swagger: http://localhost:${env.PORT}/api/docs`);
  });
  async function shutdown() {
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  }
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
main().catch(error => {
  console.error('Failed to start', error);
  process.exit(1);
});
