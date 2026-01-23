import {
  requireAuth,
  requireTeamMembership,
  requireAccessLevel,
  requireTeamAccess,
  extractTeamId,
  isAuthError,
} from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { AccessLevel } from '@prisma/client'

// Get mocked functions (mocks are set up in jest.setup.js)
const mockAuth = auth as jest.MockedFunction<typeof auth>
const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('auth-middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('requireAuth', () => {
    test('returns user when authenticated', async () => {
      const mockUser = {
        id: 'user-123',
        clerkId: 'clerk-123',
        email: 'test@example.com',
        name: 'Test User',
        firstName: 'Test',
        lastName: 'User',
        imageUrl: null,
      }

      mockAuth.mockResolvedValue({ userId: 'clerk-123' })
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any)

      const result = await requireAuth()

      expect('user' in result).toBe(true)
      if ('user' in result) {
        expect(result.user).toEqual(mockUser)
      }
    })

    test('returns error when not authenticated', async () => {
      mockAuth.mockResolvedValue({ userId: null })

      const result = await requireAuth()

      expect(isAuthError(result)).toBe(true)
      if (isAuthError(result)) {
        expect(result.response.status).toBe(401)
      }
    })

    test('returns error when user not found', async () => {
      mockAuth.mockResolvedValue({ userId: 'clerk-123' })
      mockPrisma.user.findUnique.mockResolvedValue(null)

      const result = await requireAuth()

      expect(isAuthError(result)).toBe(true)
      if (isAuthError(result)) {
        expect(result.response.status).toBe(404)
      }
    })
  })

  describe('requireTeamMembership', () => {
    test('returns membership when user is a team member', async () => {
      const mockMembership = {
        id: 'membership-123',
        teamId: 'team-123',
        userId: 'user-123',
        teamRole: 'CAREGIVER',
        isAdmin: false,
        accessLevel: 'FULL' as AccessLevel,
      }

      mockPrisma.careTeamMember.findFirst.mockResolvedValue(mockMembership as any)

      const result = await requireTeamMembership('user-123', 'team-123')

      expect('membership' in result).toBe(true)
      if ('membership' in result) {
        expect(result.membership).toEqual(mockMembership)
      }
    })

    test('returns error when user is not a team member', async () => {
      mockPrisma.careTeamMember.findFirst.mockResolvedValue(null)

      const result = await requireTeamMembership('user-123', 'team-123')

      expect(isAuthError(result)).toBe(true)
      if (isAuthError(result)) {
        expect(result.response.status).toBe(403)
      }
    })
  })

  describe('requireAccessLevel', () => {
    test('allows FULL access for FULL members', () => {
      const membership = {
        id: 'membership-123',
        teamId: 'team-123',
        userId: 'user-123',
        teamRole: 'CAREGIVER',
        isAdmin: false,
        accessLevel: 'FULL' as AccessLevel,
      }

      const result = requireAccessLevel(membership, 'FULL')

      expect(result).toBeNull()
    })

    test('allows READ_ONLY access for FULL members', () => {
      const membership = {
        id: 'membership-123',
        teamId: 'team-123',
        userId: 'user-123',
        teamRole: 'CAREGIVER',
        isAdmin: false,
        accessLevel: 'FULL' as AccessLevel,
      }

      const result = requireAccessLevel(membership, 'READ_ONLY')

      expect(result).toBeNull()
    })

    test('rejects FULL access for READ_ONLY members', () => {
      const membership = {
        id: 'membership-123',
        teamId: 'team-123',
        userId: 'user-123',
        teamRole: 'CAREGIVER',
        isAdmin: false,
        accessLevel: 'READ_ONLY' as AccessLevel,
      }

      const result = requireAccessLevel(membership, 'FULL')

      expect(isAuthError(result)).toBe(true)
      if (isAuthError(result)) {
        expect(result.response.status).toBe(403)
      }
    })

    test('allows READ_ONLY access for READ_ONLY members', () => {
      const membership = {
        id: 'membership-123',
        teamId: 'team-123',
        userId: 'user-123',
        teamRole: 'CAREGIVER',
        isAdmin: false,
        accessLevel: 'READ_ONLY' as AccessLevel,
      }

      const result = requireAccessLevel(membership, 'READ_ONLY')

      expect(result).toBeNull()
    })
  })

  describe('requireTeamAccess', () => {
    test('returns user and membership for valid team access', async () => {
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
        accessLevel: 'FULL' as AccessLevel,
      }

      mockAuth.mockResolvedValue({ userId: 'clerk-123' })
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any)
      mockPrisma.careTeamMember.findFirst.mockResolvedValue(mockMembership as any)

      const result = await requireTeamAccess('team-123', 'FULL')

      expect(isAuthError(result)).toBe(false)
      if (!isAuthError(result)) {
        expect(result.user).toEqual(mockUser)
        expect(result.membership).toEqual(mockMembership)
      }
    })

    test('rejects READ_ONLY users when FULL access required', async () => {
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
        accessLevel: 'READ_ONLY' as AccessLevel,
      }

      mockAuth.mockResolvedValue({ userId: 'clerk-123' })
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any)
      mockPrisma.careTeamMember.findFirst.mockResolvedValue(mockMembership as any)

      const result = await requireTeamAccess('team-123', 'FULL')

      expect(isAuthError(result)).toBe(true)
      if (isAuthError(result)) {
        expect(result.response.status).toBe(403)
      }
    })

    test('allows READ_ONLY users when READ_ONLY access required', async () => {
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
        accessLevel: 'READ_ONLY' as AccessLevel,
      }

      mockAuth.mockResolvedValue({ userId: 'clerk-123' })
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any)
      mockPrisma.careTeamMember.findFirst.mockResolvedValue(mockMembership as any)

      const result = await requireTeamAccess('team-123', 'READ_ONLY')

      expect(isAuthError(result)).toBe(false)
      if (!isAuthError(result)) {
        expect(result.user).toEqual(mockUser)
        expect(result.membership).toEqual(mockMembership)
      }
    })
  })

  describe('extractTeamId', () => {
    test('extracts teamId from sync params', async () => {
      const params = { teamId: 'team-123' }
      const teamId = await extractTeamId(params)
      expect(teamId).toBe('team-123')
    })

    test('extracts teamId from async params', async () => {
      const params = Promise.resolve({ teamId: 'team-123' })
      const teamId = await extractTeamId(params)
      expect(teamId).toBe('team-123')
    })
  })

  describe('isAuthError', () => {
    test('correctly identifies auth errors', () => {
      const error = {
        response: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
      }
      expect(isAuthError(error)).toBe(true)
    })

    test('correctly identifies non-errors', () => {
      const result = { user: { id: 'user-123' } }
      expect(isAuthError(result)).toBe(false)
    })
  })
})
