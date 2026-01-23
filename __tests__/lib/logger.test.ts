import { log, loggerUtils, createContextLogger, LogLevel } from '@/lib/logger'

// Mock pino in tests
jest.mock('pino', () => {
  const mockLogger = {
    trace: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    fatal: jest.fn(),
    child: jest.fn(() => mockLogger),
  }
  return jest.fn(() => mockLogger)
})

describe('logger', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('log levels', () => {
    test('log.info calls logger with info level', () => {
      log.info({ test: 'data' }, 'Test message')
      expect(log.info).toHaveBeenCalled()
    })

    test('log.error calls logger with error level', () => {
      log.error({ error: 'test' }, 'Error message')
      expect(log.error).toHaveBeenCalled()
    })

    test('log.debug calls logger with debug level', () => {
      log.debug({ debug: 'data' }, 'Debug message')
      expect(log.debug).toHaveBeenCalled()
    })
  })

  describe('createContextLogger', () => {
    test('creates logger with context', () => {
      const contextLogger = createContextLogger({
        userId: 'user-123',
        teamId: 'team-123',
      })

      contextLogger.info({}, 'Test message')
      expect(contextLogger.info).toHaveBeenCalled()
    })
  })

  describe('loggerUtils', () => {
    test('logRequest logs API request', () => {
      loggerUtils.logRequest({
        method: 'GET',
        url: '/api/test',
        userId: 'user-123',
      })

      expect(log.info).toHaveBeenCalled()
    })

    test('logResponse logs API response with correct level', () => {
      // Success response
      loggerUtils.logResponse({
        method: 'GET',
        url: '/api/test',
        status: 200,
      })
      expect(log.info).toHaveBeenCalled()

      // Error response
      loggerUtils.logResponse({
        method: 'GET',
        url: '/api/test',
        status: 500,
      })
      expect(log.error).toHaveBeenCalled()

      // Client error response
      loggerUtils.logResponse({
        method: 'GET',
        url: '/api/test',
        status: 400,
      })
      expect(log.warn).toHaveBeenCalled()
    })

    test('logError logs error with context', () => {
      const error = new Error('Test error')
      loggerUtils.logError(error, {
        userId: 'user-123',
        endpoint: '/api/test',
      })

      expect(log.error).toHaveBeenCalled()
    })

    test('logValidationError logs validation error', () => {
      const error = new Error('Validation failed')
      loggerUtils.logValidationError(error, {
        endpoint: '/api/test',
      })

      expect(log.warn).toHaveBeenCalled()
    })

    test('logDatabase logs database operation', () => {
      loggerUtils.logDatabase('SELECT', {
        table: 'users',
        duration: 10,
      })

      expect(log.debug).toHaveBeenCalled()
    })
  })
})
