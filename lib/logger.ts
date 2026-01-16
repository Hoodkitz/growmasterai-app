/**
 * Centralized logging utility for GrowMaster AI
 * Only logs in development mode, silent in production
 */

const isDevelopment = process.env.NODE_ENV === 'development';

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

interface LogOptions {
  prefix?: string;
  data?: any;
}

function formatMessage(level: LogLevel, message: string, options?: LogOptions): string {
  const timestamp = new Date().toISOString();
  const prefix = options?.prefix || 'App';
  return `[${prefix}] ${timestamp} [${level.toUpperCase()}] ${message}`;
}

class Logger {
  private enabled: boolean;

  constructor() {
    this.enabled = isDevelopment;
  }

  /**
   * Enable or disable logging (useful for testing)
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  log(message: string, options?: LogOptions) {
    if (!this.enabled) return;
    console.log(formatMessage('log', message, options));
    if (options?.data) {
      console.log(options.data);
    }
  }

  info(message: string, options?: LogOptions) {
    if (!this.enabled) return;
    console.info(formatMessage('info', message, options));
    if (options?.data) {
      console.info(options.data);
    }
  }

  warn(message: string, options?: LogOptions) {
    if (!this.enabled) return;
    console.warn(formatMessage('warn', message, options));
    if (options?.data) {
      console.warn(options.data);
    }
  }

  error(message: string, error?: Error | unknown, options?: LogOptions) {
    // Always log errors, even in production
    console.error(formatMessage('error', message, options));
    if (error) {
      console.error(error);
    }
    if (options?.data) {
      console.error(options.data);
    }
  }

  debug(message: string, options?: LogOptions) {
    if (!this.enabled) return;
    console.debug(formatMessage('debug', message, options));
    if (options?.data) {
      console.debug(options.data);
    }
  }
}

export const logger = new Logger();

// Convenience exports for specific modules
export const createLogger = (prefix: string) => ({
  log: (message: string, data?: any) => logger.log(message, { prefix, data }),
  info: (message: string, data?: any) => logger.info(message, { prefix, data }),
  warn: (message: string, data?: any) => logger.warn(message, { prefix, data }),
  error: (message: string, error?: Error | unknown, data?: any) => logger.error(message, error, { prefix, data }),
  debug: (message: string, data?: any) => logger.debug(message, { prefix, data }),
});
