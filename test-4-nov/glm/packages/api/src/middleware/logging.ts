import type { MiddlewareHandler } from 'hono';
import { v4 as uuidv4 } from 'uuid';
import { createRequestLogger, logPerformance, logSecurityEvent } from '../logger';

// Request logging middleware
export const requestLogger = (): MiddlewareHandler => {
  return async (c, next) => {
    const requestId = uuidv4();
    const startTime = Date.now();
    const method = c.req.method;
    const path = c.req.path;
    const userAgent = c.req.header('user-agent') || 'unknown';
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';

    // Create request-specific logger
    const requestLogger = createRequestLogger(requestId);

    // Log request start
    requestLogger.info({
      method,
      path,
      userAgent,
      ip,
      query: c.req.query(),
    }, `${method} ${path} - Request started`);

    try {
      // Continue with request processing
      await next();

      // Calculate duration
      const duration = Date.now() - startTime;
      const status = c.res.status;

      // Log request completion
      requestLogger.info({
        method,
        path,
        status,
        duration,
        userAgent,
        ip,
      }, `${method} ${path} - ${status} (${duration}ms)`);

      // Log performance for slow requests
      if (duration > 1000) {
        logPerformance(`${method} ${path}`, duration, { status, userAgent });
      }

    } catch (error) {
      // Log request error
      const duration = Date.now() - startTime;
      const status = c.res.status || 500;

      requestLogger.error({
        method,
        path,
        status,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
        userAgent,
        ip,
      }, `${method} ${path} - Error (${duration}ms)`);

      throw error;
    }
  };
};

// Authentication logging middleware
export const authLogger = (): MiddlewareHandler => {
  return async (c, next) => {
    const requestLogger = createRequestLogger(c.get('requestId') || 'unknown');
    const authHeader = c.req.header('authorization');
    const session = c.get('session');

    // Log authentication attempt
    if (authHeader || session) {
      requestLogger.debug({
        userId: session?.user?.id,
        hasAuth: !!authHeader,
        hasSession: !!session,
      }, 'Authentication context');
    }

    await next();
  };
};

// Security event logging middleware
export const securityLogger = (): MiddlewareHandler => {
  return async (c, next) => {
    const _requestLogger = createRequestLogger(c.get('requestId') || 'unknown');
    const method = c.req.method;
    const path = c.req.path;
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';

    // Log suspicious activities
    if (path.includes('/auth/') && method === 'POST') {
      logSecurityEvent('auth_attempt', undefined, {
        path,
        ip,
        userAgent: c.req.header('user-agent'),
      });
    }

    // Log rate limit events (if rate limiting is implemented)
    if (c.res.status === 429) {
      logSecurityEvent('rate_limit_exceeded', c.get('session')?.user?.id, {
        path,
        method,
        ip,
      });
    }

    await next();
  };
};

// Database operation logging middleware
export const databaseLogger = (): MiddlewareHandler => {
  return async (c, next) => {
    const db = c.get('db');
    if (db) {
      // Override database methods to add logging
      const originalQuery = db.query;
      db.query = function(...args: any[]) {
        const result = originalQuery.apply(this, args);

        if (result && typeof result === 'object') {
          // For async operations
          if (result instanceof Promise) {
            return result.then((res) => {
              // Log database operation
              return res;
            });
          }
        }

        return result;
      };
    }

    await next();
  };
};