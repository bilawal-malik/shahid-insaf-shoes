import env from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { createApp } from './app.js';

async function main() {
  try {
    await connectDB();
  } catch (err) {
    if (env.isProd) {
      console.error('[db] connection failed — exiting (production)');
      process.exit(1);
    }
    console.warn('[db] connection failed — server will run WITHOUT database (dev only)');
    console.warn('[db]', err.message);
  }

  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`[api] listening on http://localhost:${env.port} (${env.nodeEnv})`);
  });

  const shutdown = async (signal) => {
    console.log(`\n[api] ${signal} received — shutting down`);
    server.close(async () => {
      await disconnectDB().catch(() => {});
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('unhandledRejection', (err) => {
    console.error('[api] unhandledRejection', err);
  });
}

main();
