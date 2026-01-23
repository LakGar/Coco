import {
  createErrorResponse,
  createValidationErrorResponse,
  createAuthenticationErrorResponse,
  createAuthorizationErrorResponse,
  createNotFoundErrorResponse,
  createRateLimitErrorResponse,
  createInternalErrorResponse,
  ErrorType,
} from '@/lib/error-handler'
import { z } from 'zod'

// Mock environment
const originalEnv = process.env.NODE_ENV

describe('error-handler', () => {
  afterEach(() => {
    process.env.NODE_ENV = originalEnv
  })

  describe('createErrorResponse', () => {
    test('includes full error details in development', () => {
      process.env.NODE_ENV = 'development'
      const error = new Error('Test error')
      error.stack = 'Error: Test error\n    at test.ts:1:1'

      const response = createErrorResponse(error, 500, ErrorType.INTERNAL)

      expect(response.status).toBe(500)
      const body = JSON.parse(response.body as string)
      expect(body.error).toBe('Test error')
      expect(body.details).toBeDefined()
      if (body.details && typeof body.details === 'object') {
        expect(body.details.message).toBe('Test error')
        expect(body.details.stack).toBeDefined()
      }
    })

    test('sanitizes error messages in production', () => {
      process.env.NODE_ENV = 'production'
      const error = new Error('Database connection failed: password=secret123')

      const response = createErrorResponse(error, 500, ErrorType.INTERNAL)

      expect(response.status).toBe(500)
      const body = JSON.parse(response.body as string)
      expect(body.error).toBe('An internal error occurred')
      expect(body.details).toBeUndefined()
    })

    test('includes validation error details in production', () => {
      process.env.NODE_ENV = 'production'
      const schema = z.object({ name: z.string().min(1) })
      let zodError: z.ZodError | null = null

      try {
        schema.parse({ name: '' })
      } catch (e) {
        zodError = e as z.ZodError
      }

      expect(zodError).not.toBeNull()
      if (zodError) {
        const response = createErrorResponse(zodError, 400, ErrorType.VALIDATION)

        expect(response.status).toBe(400)
        const body = JSON.parse(response.body as string)
        expect(body.error).toBe('Invalid input provided')
        expect(body.details).toBeDefined() // Validation errors are safe to show
      }
    })

    test('includes context in error logs', () => {
      process.env.NODE_ENV = 'development'
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      const error = new Error('Test error')

      createErrorResponse(error, 500, ErrorType.INTERNAL, {
        userId: 'user-123',
        teamId: 'team-123',
        endpoint: '/api/test',
        method: 'GET',
      })

      expect(consoleSpy).toHaveBeenCalled()
      const logCall = consoleSpy.mock.calls[0]
      expect(logCall[1]).toContain('Test error')
      consoleSpy.mockRestore()
    })
  })

  describe('createValidationErrorResponse', () => {
    test('creates 400 response for validation errors', () => {
      const zodError = z.string().min(5).safeParse('abc').error
      expect(zodError).not.toBeNull()

      if (zodError) {
        const response = createValidationErrorResponse(zodError)

        expect(response.status).toBe(400)
        const body = JSON.parse(response.body as string)
        expect(body.code).toBe(ErrorType.VALIDATION)
      }
    })
  })

  describe('createAuthenticationErrorResponse', () => {
    test('creates 401 response', () => {
      const response = createAuthenticationErrorResponse()

      expect(response.status).toBe(401)
      const body = JSON.parse(response.body as string)
      expect(body.code).toBe(ErrorType.AUTHENTICATION)
      expect(body.error).toBe('Authentication required')
    })
  })

  describe('createAuthorizationErrorResponse', () => {
    test('creates 403 response', () => {
      const response = createAuthorizationErrorResponse()

      expect(response.status).toBe(403)
      const body = JSON.parse(response.body as string)
      expect(body.code).toBe(ErrorType.AUTHORIZATION)
      expect(body.error).toBe('Insufficient permissions')
    })
  })

  describe('createNotFoundErrorResponse', () => {
    test('creates 404 response with resource name', () => {
      const response = createNotFoundErrorResponse('Task')

      expect(response.status).toBe(404)
      const body = JSON.parse(response.body as string)
      expect(body.code).toBe(ErrorType.NOT_FOUND)
    })
  })

  describe('createRateLimitErrorResponse', () => {
    test('creates 429 response', () => {
      const response = createRateLimitErrorResponse()

      expect(response.status).toBe(429)
      const body = JSON.parse(response.body as string)
      expect(body.code).toBe(ErrorType.RATE_LIMIT)
    })
  })

  describe('createInternalErrorResponse', () => {
    test('creates 500 response', () => {
      const error = new Error('Internal server error')
      const response = createInternalErrorResponse(error)

      expect(response.status).toBe(500)
      const body = JSON.parse(response.body as string)
      expect(body.code).toBe(ErrorType.INTERNAL)
    })
  })

  describe('error type detection', () => {
    test('detects validation errors', () => {
      process.env.NODE_ENV = 'production'
      const error = new Error('Validation failed')
      error.name = 'ZodError'

      const response = createErrorResponse(error, 400)

      const body = JSON.parse(response.body as string)
      expect(body.code).toBe(ErrorType.VALIDATION)
    })

    test('detects authentication errors', () => {
      process.env.NODE_ENV = 'production'
      const error = new Error('Unauthorized access')

      const response = createErrorResponse(error, 401)

      const body = JSON.parse(response.body as string)
      expect(body.code).toBe(ErrorType.AUTHENTICATION)
    })

    test('detects database errors', () => {
      process.env.NODE_ENV = 'production'
      const error = new Error('Prisma query failed')

      const response = createErrorResponse(error, 500)

      const body = JSON.parse(response.body as string)
      expect(body.code).toBe(ErrorType.DATABASE)
    })
  })
})
