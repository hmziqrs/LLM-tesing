import { publicProcedure } from '../index';
import { logger } from '../logger';
import type { DatabaseClient } from '@glm/db';

export const healthRouter = {
  // Basic health check
  check: publicProcedure.handler(async ({ context }) => {
    const startTime = Date.now();

    try {
      // Basic health check
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'unknown',
        service: 'glm-api',
      };

      logger.debug('Health check completed', { responseTime: Date.now() - startTime });

      return health;
    } catch (error) {
      logger.error('Health check failed', { error, responseTime: Date.now() - startTime });

      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }),

  // Detailed health check with dependencies
  detailed: publicProcedure.handler(async ({ context }) => {
    const startTime = Date.now();
    const checks: Record<string, any> = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'unknown',
      service: 'glm-api',
      checks: {},
    };

    try {
      // Database health check
      if (context.db) {
        try {
          const dbStartTime = Date.now();
          await context.db.select({ count: 1 }).from('user').limit(1);
          checks.checks.database = {
            status: 'healthy',
            responseTime: Date.now() - dbStartTime,
          };
        } catch (dbError) {
          checks.checks.database = {
            status: 'unhealthy',
            error: dbError instanceof Error ? dbError.message : 'Database connection failed',
          };
          checks.status = 'degraded';
        }
      } else {
        checks.checks.database = {
          status: 'unknown',
          error: 'Database not configured',
        };
      }

      // Memory usage check
      const memUsage = process.memoryUsage();
      const totalMemory = memUsage.heapTotal;
      const usedMemory = memUsage.heapUsed;
      const memoryUtilization = (usedMemory / totalMemory) * 100;

      checks.checks.memory = {
        status: memoryUtilization > 90 ? 'warning' : 'healthy',
        utilization: `${memoryUtilization.toFixed(2)}%`,
        used: `${(usedMemory / 1024 / 1024).toFixed(2)}MB`,
        total: `${(totalMemory / 1024 / 1024).toFixed(2)}MB`,
      };

      // CPU load check (simplified)
      const loadAverage = require('os').loadavg();
      checks.checks.cpu = {
        status: loadAverage[0] > 2 ? 'warning' : 'healthy',
        load1m: loadAverage[0].toFixed(2),
        load5m: loadAverage[1].toFixed(2),
        load15m: loadAverage[2].toFixed(2),
      };

      logger.info('Detailed health check completed', {
        status: checks.status,
        responseTime: Date.now() - startTime
      });

      return checks;
    } catch (error) {
      logger.error('Detailed health check failed', { error, responseTime: Date.now() - startTime });

      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Health check failed',
        responseTime: Date.now() - startTime,
      };
    }
  }),

  // Readiness check (for Kubernetes)
  ready: publicProcedure.handler(async ({ context }) => {
    const startTime = Date.now();

    try {
      // Check if database is ready
      if (context.db) {
        await context.db.select({ count: 1 }).from('user').limit(1);
      }

      // Check if essential services are ready
      const isReady = true; // Add more readiness checks as needed

      logger.debug('Readiness check completed', { ready: isReady, responseTime: Date.now() - startTime });

      return {
        status: isReady ? 'ready' : 'not ready',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Readiness check failed', { error, responseTime: Date.now() - startTime });

      return {
        status: 'not ready',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Readiness check failed',
      };
    }
  }),

  // Liveness check (for Kubernetes)
  alive: publicProcedure.handler(async ({ context }) => {
    const startTime = Date.now();

    try {
      // Basic liveness check - just ensure the process is running
      const isAlive = process.uptime() > 0;

      logger.debug('Liveness check completed', { alive: isAlive, responseTime: Date.now() - startTime });

      return {
        status: isAlive ? 'alive' : 'dead',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      };
    } catch (error) {
      logger.error('Liveness check failed', { error, responseTime: Date.now() - startTime });

      return {
        status: 'dead',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Liveness check failed',
      };
    }
  }),
};