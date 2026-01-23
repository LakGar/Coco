import { getCurrentUser } from '@/lib/get-user'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// Get mocked functions (mocks are set up in jest.setup.js)
const mockAuth = auth as jest.MockedFunction<typeof auth>
const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('getCurrentUser', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('returns user when authenticated and found in database', async () => {
    const mockUser = {
      id: 'user-123',
      clerkId: 'clerk-123',
      email: 'test@example.com',
      name: 'Test User',
    }

    mockAuth.mockResolvedValue({ userId: 'clerk-123' })
    mockPrisma.user.findUnique.mockResolvedValue(mockUser as any)

    const result = await getCurrentUser()

    expect(result).toEqual(mockUser)
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { clerkId: 'clerk-123' },
    })
  })

  test('returns null when not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null })

    const result = await getCurrentUser()

    expect(result).toBeNull()
    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled()
  })

  test('returns null when user not found in database', async () => {
    mockAuth.mockResolvedValue({ userId: 'clerk-123' })
    mockPrisma.user.findUnique.mockResolvedValue(null)

    const result = await getCurrentUser()

    expect(result).toBeNull()
  })

  test('handles database errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    mockAuth.mockResolvedValue({ userId: 'clerk-123' })
    mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'))

    const result = await getCurrentUser()

    expect(result).toBeNull()
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})
