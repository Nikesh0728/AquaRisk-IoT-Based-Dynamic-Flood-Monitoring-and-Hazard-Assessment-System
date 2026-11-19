/**
 * AquaRisk server entry point.
 * Express API + Vite dev middleware (or the built ./dist folder in production).
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './src/server/api.ts';
import { startDemoSimulator } from './src/server/demo.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '100kb' }));
  app.use('/api', apiRouter);

  // Generates a reading every few seconds while Demo Mode is on.
  startDemoSimulator();

  const distDir = path.resolve(__dirname, 'dist');
  const isProd = process.env.NODE_ENV === 'production';

  if (isProd && fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    if (isProd) console.warn('[AquaRisk] No ./dist folder found - run "npm run build" first. Falling back to dev mode.');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('  AquaRisk is running');
    console.log(`  Dashboard:  http://localhost:${PORT}`);
    console.log(`  ESP32 POST: http://<this-computer-LAN-IP>:${PORT}/api/telemetry`);
    console.log('');
  });
}

startServer().catch((err) => {
  console.error('[AquaRisk Server] Failed to start:', err);
  process.exit(1);
});
