import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/get-user"

// PATCH /api/teams/[teamId]/notes/[noteId]/permissions - Update note permissions (only creator)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { teamId: string; noteId: string } | Promise<{ teamId: string; noteId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = params instanceof Promise ? await params : params
    const { teamId, noteId } = resolvedParams
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if user is the creator of this note
    const note = await prisma.note.findFirst({
      where: {
        id: noteId,
        teamId,
        createdById: user.id,
      },
    })

    if (!note) {
      return NextResponse.json(
        { error: "Only the note creator can manage permissions" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { editorIds, viewerIds } = body

    // Validate that editorIds and viewerIds are team members
    const teamMemberIds = await prisma.careTeamMember.findMany({
      where: { teamId },
      select: { userId: true },
    })
    const validUserIds = teamMemberIds
      .map((m) => m.userId)
      .filter((id): id is string => id !== null)

    const validEditorIds = (editorIds || []).filter((id: string) =>
      validUserIds.includes(id)
    )
    const validViewerIds = (viewerIds || []).filter((id: string) =>
      validUserIds.includes(id)
    )

    // Remove creator from editorIds (they're always an editor)
    const editorIdsWithoutCreator = validEditorIds.filter(
      (id) => id !== user.id
    )

    // Update editors
    // First, delete all existing editors except creator
    await prisma.noteEditor.deleteMany({
      where: {
        noteId,
        userId: { not: user.id }, // Keep creator
      },
    })

    // Then create new editors
    if (editorIdsWithoutCreator.length > 0) {
      await prisma.noteEditor.createMany({
        data: editorIdsWithoutCreator.map((id) => ({
          noteId,
          userId: id,
        })),
        skipDuplicates: true,
      })
    }

    // Ensure creator is an editor
    await prisma.noteEditor.upsert({
      where: {
        noteId_userId: {
          noteId,
          userId: user.id,
        },
      },
      create: {
        noteId,
        userId: user.id,
      },
      update: {},
    })

    // Update viewers
    // Remove users who are now editors from viewers
    const viewerIdsWithoutEditors = validViewerIds.filter(
      (id) => id !== user.id && !editorIdsWithoutCreator.includes(id)
    )

    // Delete all existing viewers
    await prisma.noteViewer.deleteMany({
      where: { noteId },
    })

    // Create new viewers
    if (viewerIdsWithoutEditors.length > 0) {
      await prisma.noteViewer.createMany({
        data: viewerIdsWithoutEditors.map((id) => ({
          noteId,
          userId: id,
        })),
        skipDuplicates: true,
      })
    }

    // Get updated note
    const updatedNote = await prisma.note.findFirst({
      where: { id: noteId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
            imageUrl: true,
          },
        },
        lastEditedBy: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
            imageUrl: true,
          },
        },
        editors: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true,
                email: true,
                imageUrl: true,
              },
            },
          },
        },
        viewers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true,
                email: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(updatedNote)
  } catch (error) {
    console.error("Error updating note permissions:", error)
    return NextResponse.json(
      { error: "Failed to update note permissions" },
      { status: 500 }
    )
  }
}

