import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { AccessLevel } from '@prisma/client'

export async function PATCH(
  req: Request,
  { params }: { params: { teamId: string; memberId: string } | Promise<{ teamId: string; memberId: string }> }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const resolvedParams = params instanceof Promise ? await params : params
    const { teamId, memberId } = resolvedParams

    // Get current user from database
    const currentUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Verify current user is an admin of this team
    const currentUserMembership = await prisma.careTeamMember.findFirst({
      where: {
        teamId: teamId,
        userId: currentUser.id,
      },
    })

    if (!currentUserMembership) {
      return NextResponse.json(
        { error: 'Not a member of this team' },
        { status: 403 }
      )
    }

    if (!currentUserMembership.isAdmin) {
      return NextResponse.json(
        { error: 'Only admins can update member permissions' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await req.json()
    const { accessLevel, isAdmin } = body

    // Validate accessLevel if provided
    if (accessLevel && !['FULL', 'READ_ONLY'].includes(accessLevel)) {
      return NextResponse.json(
        { error: 'Invalid access level. Must be FULL or READ_ONLY' },
        { status: 400 }
      )
    }

    // Find the member to update
    const memberToUpdate = await prisma.careTeamMember.findFirst({
      where: {
        teamId: teamId,
        userId: memberId,
      },
    })

    if (!memberToUpdate) {
      return NextResponse.json(
        { error: 'Member not found in this team' },
        { status: 404 }
      )
    }

    // Find the team creator (first admin by joinedAt date)
    const teamCreator = await prisma.careTeamMember.findFirst({
      where: {
        teamId: teamId,
        isAdmin: true,
      },
      orderBy: {
        joinedAt: 'asc',
      },
    })

    // Prevent removing admin from the team creator
    if (memberToUpdate.id === teamCreator?.id && isAdmin === false) {
      return NextResponse.json(
        { error: 'Cannot remove admin status from the team creator' },
        { status: 400 }
      )
    }

    // Prevent admin from removing their own admin status (unless they're the creator, which is already handled above)
    if (memberToUpdate.userId === currentUser.id && isAdmin === false) {
      return NextResponse.json(
        { error: 'You cannot remove your own admin status' },
        { status: 400 }
      )
    }

    // Update the member
    const updatedMember = await prisma.careTeamMember.update({
      where: { id: memberToUpdate.id },
      data: {
        ...(accessLevel && { accessLevel: accessLevel as AccessLevel }),
        ...(typeof isAdmin === 'boolean' && { isAdmin }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
            imageUrl: true,
            role: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      member: {
        id: updatedMember.user!.id,
        name: updatedMember.user!.name || `${updatedMember.user!.firstName || ''} ${updatedMember.user!.lastName || ''}`.trim() || updatedMember.user!.email,
        email: updatedMember.user!.email,
        image: updatedMember.user!.imageUrl || undefined,
        role: updatedMember.teamRole,
        isAdmin: updatedMember.isAdmin,
        accessLevel: updatedMember.accessLevel,
      },
    })
  } catch (error) {
    console.error('Error updating member permissions:', error)
    return NextResponse.json(
      {
        error: 'Error updating member permissions',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

