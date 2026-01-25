import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from './prisma'
import { AccessLevel } from '@prisma/client'

/**
 * Result of authentication check
 */
export interface AuthResult {
  user: {
    id: string
    clerkId: string | null
    email: string
    name: string | null
    firstName: string | null
    lastName: string | null
    imageUrl: string | null
  }
}

/**
 * Result of team membership check
 */
export interface TeamMembershipResult {
  membership: {
    id: string
    teamId: string
    userId: string | null
    teamRole: string
    isAdmin: boolean
    accessLevel: AccessLevel
    // Granular permissions
    canViewTasks?: boolean
    canCreateTasks?: boolean
    canEditTasks?: boolean
    canDeleteTasks?: boolean
    canViewNotes?: boolean
    canCreateNotes?: boolean
    canEditNotes?: boolean
    canDeleteNotes?: boolean
    canViewRoutines?: boolean
    canCreateRoutines?: boolean
    canEditRoutines?: boolean
    canDeleteRoutines?: boolean
    canViewContacts?: boolean
    canCreateContacts?: boolean
    canEditContacts?: boolean
    canDeleteContacts?: boolean
    canViewMoods?: boolean
    canCreateMoods?: boolean
    canViewBurdenScales?: boolean
    canCreateBurdenScales?: boolean
    canViewMembers?: boolean
    canInviteMembers?: boolean
    canRemoveMembers?: boolean
    canManagePermissions?: boolean
  }
}

/**
 * Standardized error response
 */
export interface AuthError {
  response: NextResponse
}

/**
 * Authenticates the current user
 * Returns the user if authenticated, or an error response if not
 */
export async function requireAuth(): Promise<AuthResult | AuthError> {
  const { userId } = await auth()

  if (!userId) {
    return {
      response: NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      ),
    }
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      clerkId: true,
      email: true,
      name: true,
      firstName: true,
      lastName: true,
      imageUrl: true,
    },
  })

  if (!user) {
    return {
      response: NextResponse.json(
        { error: 'User not found', message: 'User account not found in database' },
        { status: 404 }
      ),
    }
  }

  return { user }
}

/**
 * Checks if the user is a member of the specified team
 * Requires authentication first (use with requireAuth)
 */
export async function requireTeamMembership(
  userId: string,
  teamId: string
): Promise<TeamMembershipResult | AuthError> {
  const membership = await prisma.careTeamMember.findFirst({
    where: {
      teamId,
      userId,
    },
    select: {
      id: true,
      teamId: true,
      userId: true,
      teamRole: true,
      isAdmin: true,
      accessLevel: true,
      // Include all granular permissions
      canViewTasks: true,
      canCreateTasks: true,
      canEditTasks: true,
      canDeleteTasks: true,
      canViewNotes: true,
      canCreateNotes: true,
      canEditNotes: true,
      canDeleteNotes: true,
      canViewRoutines: true,
      canCreateRoutines: true,
      canEditRoutines: true,
      canDeleteRoutines: true,
      canViewContacts: true,
      canCreateContacts: true,
      canEditContacts: true,
      canDeleteContacts: true,
      canViewMoods: true,
      canCreateMoods: true,
      canViewBurdenScales: true,
      canCreateBurdenScales: true,
      canViewMembers: true,
      canInviteMembers: true,
      canRemoveMembers: true,
      canManagePermissions: true,
    },
  })

  if (!membership) {
    return {
      response: NextResponse.json(
        { error: 'Forbidden', message: 'Not a member of this team' },
        { status: 403 }
      ),
    }
  }

  return { membership }
}

/**
 * Checks if the user has the required access level
 * Requires team membership first (use with requireTeamMembership)
 */
export function requireAccessLevel(
  membership: TeamMembershipResult['membership'],
  requiredLevel: AccessLevel = 'FULL'
): AuthError | null {
  if (membership.accessLevel === 'READ_ONLY' && requiredLevel === 'FULL') {
    return {
      response: NextResponse.json(
        {
          error: 'Forbidden',
          message: 'Read-only users cannot perform this action',
        },
        { status: 403 }
      ),
    }
  }

  return null
}

/**
 * Combined middleware: Authenticate + Team Membership + Access Level
 * Use this for most API routes that require team access
 */
export async function requireTeamAccess(
  teamId: string,
  requiredAccessLevel: AccessLevel = 'FULL'
): Promise<
  | {
      user: AuthResult['user']
      membership: TeamMembershipResult['membership']
    }
  | AuthError
> {
  // Step 1: Authenticate
  const authResult = await requireAuth()
  if ('response' in authResult) {
    return authResult
  }

  // Step 2: Check team membership
  const membershipResult = await requireTeamMembership(authResult.user.id, teamId)
  if ('response' in membershipResult) {
    return membershipResult
  }

  // Step 3: Check access level (if required)
  if (requiredAccessLevel === 'FULL') {
    const accessError = requireAccessLevel(membershipResult.membership, requiredAccessLevel)
    if (accessError) {
      return accessError
    }
  }

  return {
    user: authResult.user,
    membership: membershipResult.membership,
  }
}

/**
 * Helper to extract teamId from params (handles both sync and async params)
 */
export async function extractTeamId(
  params: { teamId: string } | Promise<{ teamId: string }>
): Promise<string> {
  const resolved = params instanceof Promise ? await params : params
  return resolved.teamId
}

/**
 * Type guard to check if result is an error
 */
export function isAuthError(
  result: AuthResult | TeamMembershipResult | ReturnType<typeof requireTeamAccess> | AuthError
): result is AuthError {
  return 'response' in result && result.response instanceof NextResponse
}

/**
 * Check if user has a specific permission
 * Admins automatically have all permissions
 */
export function hasPermission(
  membership: TeamMembershipResult['membership'],
  permission: string
): boolean {
  // Admins have all permissions
  if (membership.isAdmin) {
    return true
  }

  // Check the specific permission
  return (membership as any)[permission] === true
}

/**
 * Require a specific permission for an action
 * Returns an error response if permission is missing
 */
export function requirePermission(
  membership: TeamMembershipResult['membership'],
  permission: string,
  action: string = 'perform this action'
): AuthError | null {
  if (!hasPermission(membership, permission)) {
    return {
      response: NextResponse.json(
        {
          error: 'Forbidden',
          message: `You do not have permission to ${action}`,
        },
        { status: 403 }
      ),
    }
  }

  return null
}
