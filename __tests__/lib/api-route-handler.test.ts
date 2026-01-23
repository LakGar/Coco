import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandler, createSuccessResponse, createCreatedResponse } from '@/lib/api-route-handler'
import { requireTeamAccess } from '@/lib/auth-middleware'
import { rateLimit } from '@/lib/rate-limit'
import { validateRequest } from '@/lib/validations'
import { z } from 'zod'

// Mock dependencies
jest.mock('@/lib/auth-middleware')
jest.mock('@/lib/rate-limit')
jest.mock('@/lib/validations')

const mockRequireTeamAccess = requireTeamAccess as jest.MockedFunction<typeof requireTeamAccess>
const mockRateLimit = rateLimit as jest.MockedFunction<typeof rateLimit>
const mockValidateRequest = validateRequest as jest.MockedFunction<typeof validateRequest>

describe('api-route-handler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createRouteHandler', () => {
    test('handles successful GET request', async () => {
      const mockUser = {
        id: 'user-123',
        clerkId: 'clerk-123',
        email: 'test@example.com',
        name: 'Test User',
        firstName: 'Test',
        lastName: 'User',
        imageUrl: null,
      }

      const mockMembership = {
        id: 'membership-123',
        teamId: 'team-123',
        userId: 'user-123',
        teamRole: 'CAREGIVER',
        isAdmin: false,
        accessLevel: 'FULL' as const,
      }

      mockRequireTeamAccess.mockResolvedValue({
        user: mockUser,
        membership: mockMembership,
      })

      mockRateLimit.mockResolvedValue({
        success: true,
        limit: 100,
        remaining: 99,
        reset: Date.now() + 60000,
      })

      const handler = createRouteHandler(
        async (req, context) => {
          return createSuccessResponse({ data: 'test' }, 200, context.rateLimitResult)
        },
        {
          requiredAccessLevel: 'READ_ONLY',
          method: 'GET',
        }
      )

      const req = new NextRequest('http://localhost/api/teams/team-123/tasks')
      const params = { teamId: 'team-123' }

      const response = await handler(req, params)
      const data = await response.json()

      expect(data.data).toBe('test')
      expect(mockRequireTeamAccess).toHaveBeenCalledWith('team-123', 'READ_ONLY')
      expect(mockRateLimit).toHaveBeenCalled()
    })

    test('handles validation errors', async () => {
      const mockUser = {
        id: 'user-123',
        clerkId: 'clerk-123',
        email: 'test@example.com',
        name: 'Test User',
        firstName: 'Test',
        lastName: 'User',
        imageUrl: null,
      }

      const mockMembership = {
        id: 'membership-123',
        teamId: 'team-123',
        userId: 'user-123',
        teamRole: 'CAREGIVER',
        isAdmin: false,
        accessLevel: 'FULL' as const,
      }

      const schema = z.object({ name: z.string().min(1) })

      mockRequireTeamAccess.mockResolvedValue({
        user: mockUser,
        membership: mockMembership,
      })

      mockRateLimit.mockResolvedValue({
        success: true,
        limit: 100,
        remaining: 99,
        reset: Date.now() + 60000,
      })

      const zodError = schema.safeParse({ name: '' }).error
      expect(zodError).not.toBeNull()

      mockValidateRequest.mockResolvedValue({
        data: null,
        error: zodError!,
      })

      const handler = createRouteHandler(
        async (req, context) => {
          return createSuccessResponse({ data: 'test' })
        },
        {
          requiredAccessLevel: 'FULL',
          method: 'POST',
          schema,
        }
      )

      const req = new NextRequest('http://localhost/api/teams/team-123/tasks', {
        method: 'POST',
        body: JSON.stringify({ name: '' }),
      })
      const params = { teamId: 'team-123' }

      const response = await handler(req, params)

      expect(response.status).toBe(400)
      expect(mockValidateRequest).toHaveBeenCalled()
    })

    test('handles rate limit errors', async () => {
      const mockUser = {
        id: 'user-123',
        clerkId: 'clerk-123',
        email: 'test@example.com',
        name: 'Test User',
        firstName: 'Test',
        lastName: 'User',
        imageUrl: null,
      }

      const mockMembership = {
        id: 'membership-123',
        teamId: 'team-123',
        userId: 'user-123',
        teamRole: 'CAREGIVER',
        isAdmin: false,
        accessLevel: 'FULL' as const,
      }

      mockRequireTeamAccess.mockResolvedValue({
        user: mockUser,
        membership: mockMembership,
      })

      mockRateLimit.mockResolvedValue({
        success: false,
        limit: 100,
        remaining: 0,
        reset: Date.now() + 60000,
      })

      const handler = createRouteHandler(
        async (req, context) => {
          return createSuccessResponse({ data: 'test' })
        },
        {
          requiredAccessLevel: 'READ_ONLY',
          method: 'GET',
        }
      )

      const req = new NextRequest('http://localhost/api/teams/team-123/tasks')
      const params = { teamId: 'team-123' }

      const response = await handler(req, params)

      expect(response.status).toBe(429)
    })

    test('handles authorization errors', async () => {
      mockRequireTeamAccess.mockResolvedValue({
        response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
      })

      const handler = createRouteHandler(
        async (req, context) => {
          return createSuccessResponse({ data: 'test' })
        },
        {
          requiredAccessLevel: 'FULL',
          method: 'GET',
        }
      )

      const req = new NextRequest('http://localhost/api/teams/team-123/tasks')
      const params = { teamId: 'team-123' }

      const response = await handler(req, params)

      expect(response.status).toBe(403)
    })
  })

  describe('createSuccessResponse', () => {
    test('creates response with rate limit headers', () => {
      const rateLimitResult = {
        success: true,
        limit: 100,
        remaining: 99,
        reset: Date.now() + 60000,
      }

      const response = createSuccessResponse({ data: 'test' }, 200, rateLimitResult)

      expect(response.status).toBe(200)
      expect(response.headers.get('X-RateLimit-Limit')).toBe('100')
    })
  })

  describe('createCreatedResponse', () => {
    test('creates 201 response', () => {
      const rateLimitResult = {
        success: true,
        limit: 100,
        remaining: 99,
        reset: Date.now() + 60000,
      }

      const response = createCreatedResponse({ id: '123' }, rateLimitResult)

      expect(response.status).toBe(201)
    })
  })
})
