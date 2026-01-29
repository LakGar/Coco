import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireTeamAccess, extractTeamId, isAuthError } from "@/lib/auth-middleware"
import { createNotFoundErrorResponse, createInternalErrorResponse } from "@/lib/error-handler"

// PATCH /api/teams/[teamId]/notes/[noteId]/permissions - Update note permissions (only creator)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { teamId: string; noteId: string } | Promise<{ teamId: string; noteId: string }> }
) {
  try {
    // Extract teamId and check authorization
    const resolvedParams = params instanceof Promise ? await params : params
    const { teamId, noteId } = resolvedParams
    const authResult = await requireTeamAccess(teamId, "READ_ONLY") // Need team membership, but note permissions checked separately

    if (isAuthError(authResult)) {
      return authResult.response
    }

    const { user } = authResult

    // Check if user is the creator of this note
    const note = await prisma.note.findFirst({
      where: {
        id: noteId,
        teamId,
        createdById: user.id,
      },
    })

    if (!note) {
      return createNotFoundErrorResponse("Only the note creator can manage permissions", {
        endpoint: "/api/teams/[teamId]/notes/[noteId]/permissions",
        method: "PATCH",
        teamId,
        noteId,
      })
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
      (id: string) => id !== user.id
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
        data: editorIdsWithoutCreator.map((id: string) => ({
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
      (id: string) => id !== user.id && !editorIdsWithoutCreator.includes(id)
    )

    // Delete all existing viewers
    await prisma.noteViewer.deleteMany({
      where: { noteId },
    })

    // Create new viewers
    if (viewerIdsWithoutEditors.length > 0) {
      await prisma.noteViewer.createMany({
        data: viewerIdsWithoutEditors.map((id: string) => ({
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

    if (!updatedNote) {
      return createNotFoundErrorResponse("Note not found", {
        endpoint: "/api/teams/[teamId]/notes/[noteId]/permissions",
        method: "PATCH",
        teamId,
        noteId,
      })
    }

    // Calculate permissions (same logic as GET endpoint)
    const isCreator = updatedNote.createdById === user.id
    const isEditor = updatedNote.editors.some((e) => e.userId === user.id)

    return NextResponse.json({
      ...updatedNote,
      canEdit: isCreator || isEditor,
      canDelete: isCreator,
      userRole: isCreator ? "creator" : isEditor ? "editor" : "viewer",
    })
  } catch (error) {
    const resolvedParams = params instanceof Promise ? await params : params
    const { teamId } = resolvedParams
    return createInternalErrorResponse(error, {
      endpoint: "/api/teams/[teamId]/notes/[noteId]/permissions",
      method: "PATCH",
      teamId,
    })
  }
}

