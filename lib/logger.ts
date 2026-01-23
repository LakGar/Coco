import pino from 'pino'

/**
 * Log levels
 */
export enum LogLevel {
  TRACE = 10,
  DEBUG = 20,
  INFO = 30,
  WARN = 40,
  ERROR = 50,
  FATAL = 60,
}

/**
 * Logger configuration
 */
const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'

/**
 * Create base logger configuration
 */
const createLoggerConfig = () => {
  // Get timestamp function - handle both real pino and mocked pino
  const getTimestamp = () => {
    try {
      return pino.stdTimeFunctions?.isoTime || (() => `,"time":"${new Date().toISOString()}"`)
    } catch {
      return () => `,"time":"${new Date().toISOString()}"`
    }
  }

  const baseConfig: pino.LoggerOptions = {
    level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
    timestamp: getTimestamp(),
    formatters: {
      level: (label) => {
        return { level: label.toUpperCase() }
      },
    },
    base: {
      env: process.env.NODE_ENV,
      service: 'coco-api',
    },
  }

  // In development, use pretty printing
  if (isDevelopment && typeof window === 'undefined') {
    // Only use pino-pretty in Node.js environment (not in browser)
    try {
      return {
        ...baseConfig,
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
            singleLine: false,
          },
        },
      }
    } catch (e) {
      // Fallback if pino-pretty is not available
      return baseConfig
    }
  }

  // In production, use JSON output
  return baseConfig
}

/**
 * Create the logger instance
 */
const logger = pino(createLoggerConfig())

/**
 * Logger interface for type safety
 */
export interface Logger {
  trace: (obj: object, msg?: string, ...args: any[]) => void
  debug: (obj: object, msg?: string, ...args: any[]) => void
  info: (obj: object, msg?: string, ...args: any[]) => void
  warn: (obj: object, msg?: string, ...args: any[]) => void
  error: (obj: object, msg?: string, ...args: any[]) => void
  fatal: (obj: object, msg?: string, ...args: any[]) => void
  child: (bindings: pino.Bindings) => Logger
}

/**
 * Create a child logger with additional context
 */
export function createChildLogger(bindings: pino.Bindings): Logger {
  return logger.child(bindings) as Logger
}

/**
 * Create a logger with context (helper function)
 */
export function createContextLogger(context: {
  userId?: string
  teamId?: string
  endpoint?: string
  method?: string
  [key: string]: any
}): Logger {
  return logger.child(context) as Logger
}

/**
 * Default logger instance
 */
export const log: Logger = logger

/**
 * Convenience functions for common logging patterns
 */
export const loggerUtils = {
  /**
   * Log API request
   */
  logRequest: (context: {
    method: string
    url: string
    userId?: string
    teamId?: string
    [key: string]: any
  }) => {
    log.info(context, `[${context.method}] ${context.url}`)
  },

  /**
   * Log API response
   */
  logResponse: (context: {
    method: string
    url: string
    status: number
    duration?: number
    userId?: string
    [key: string]: any
  }) => {
    const level = context.status >= 500 ? 'error' : context.status >= 400 ? 'warn' : 'info'
    log[level](context, `[${context.method}] ${context.url} - ${context.status}`)
  },

  /**
   * Log error with context
   */
  logError: (error: Error | unknown, context?: {
    userId?: string
    teamId?: string
    endpoint?: string
    method?: string
    [key: string]: any
  }) => {
    const errorObj = error instanceof Error
      ? {
          message: error.message,
          stack: error.stack,
          name: error.name,
        }
      : { message: String(error) }

    log.error(
      {
        ...errorObj,
        ...context,
        err: error,
      },
      context?.message || 'Error occurred'
    )
  },

  /**
   * Log validation error
   */
  logValidationError: (error: unknown, context?: {
    endpoint?: string
    method?: string
    [key: string]: any
  }) => {
    log.warn(
      {
        type: 'validation_error',
        error: error instanceof Error ? error.message : String(error),
        ...context,
      },
      'Validation failed'
    )
  },

  /**
   * Log database operation
   */
  logDatabase: (operation: string, context?: {
    table?: string
    duration?: number
    [key: string]: any
  }) => {
    log.debug(
      {
        type: 'database',
        operation,
        ...context,
      },
      `Database ${operation}`
    )
  },
}

/**
 * Export default logger
 */
export default log
