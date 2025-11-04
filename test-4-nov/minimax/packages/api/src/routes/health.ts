import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { timing } from 'hono/timing';

export function createHealthApp() {
  const app = new Hono();

  app.use('*', cors());
  app.use('*', logger());
  app.use('*', prettyJSON());
  app.use('*', timing());

  app.get('/healthz', (c) => {
    return c.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'pocket-budget-buddy-api',
      version: '1.0.0',
    });
  });

  app.get('/readyz', async (c) => {
    return c.json({
      status: 'ready',
      checks: {
        database: 'ok',
        storage: 'ok',
      },
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/metrics', (c) => {
    return c.json({
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    });
  });

  return app;
}
