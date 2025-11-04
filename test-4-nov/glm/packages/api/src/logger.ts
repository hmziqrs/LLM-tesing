import pino, { Logger } from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

// Base logger configuration
const baseConfig = {
  level: isDevelopment ? 'debug' : isTest ? 'silent' : 'info',
  formatters: {
    level: (label: string) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    pid: process.pid,
    hostname: process.env.HOSTNAME || 'unknown',
    service: 'glm-api',
    version: process.env.npm_package_version || '1.0.0',
  },
};

// Development logger with pretty printing
export const logger: Logger = isDevelopment
  ? pino({
      ...baseConfig,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
          customPrettifiers: {
            time: (timestamp: string) => {
              const date = new Date(timestamp);
              return date.toLocaleTimeString();
            },
          },
        },
      },
    })
  : pino(baseConfig);

// Create child logger with request context
export const createRequestLogger = (requestId: string, userId?: string) => {
  return logger.child({
    requestId,
    userId,
    service: 'glm-api-request',
  });
};

// Create child logger for specific modules
export const createModuleLogger = (module: string) => {
  return logger.child({
    module,
    service: 'glm-api',
  });
};

// Performance logging utilities
export const logPerformance = (operation: string, duration: number, metadata?: Record<string, any>) => {
  logger.info({
    operation,
    duration,
    metadata,
    service: 'glm-api-performance',
  }, `Performance: ${operation} completed in ${duration}ms`);
};

// Security event logging
export const logSecurityEvent = (event: string, userId?: string, metadata?: Record<string, any>) => {
  logger.warn({
    event,
    userId,
    metadata,
    service: 'glm-api-security',
  }, `Security event: ${event}`);
};

// Error logging with context
export const logError = (error: Error, context?: Record<string, any>) => {
  logger.error({
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    context,
    service: 'glm-api-error',
  }, `Application error: ${error.message}`);
};

// Database operation logging
export const logDatabaseOperation = (operation: string, table: string, duration?: number) => {
  const logData = {
    operation,
    table,
    service: 'glm-api-database',
  };

  if (duration) {
    (logData as any).duration = duration;
  }

  logger.info(logData, `Database operation: ${operation} on ${table}${duration ? ` (${duration}ms)` : ''}`);
};

export default logger;