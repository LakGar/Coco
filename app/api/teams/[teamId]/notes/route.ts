import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNoteSchema, validateRequest } from "@/lib/validations";
import { rateLimit, addRateLimitHeaders } from "@/lib/rate-limit";
import {
  requireTeamAccess,
  extractTeamId,
  isAuthError,
  hasPermission,
  requirePermission,
} from "@/lib/auth-middleware";
import {
  createValidationErrorResponse,
  createInternalErrorResponse,
} from "@/lib/error-handler";
import { loggerUtils } from "@/lib/logger";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit";

// GET /api/teams/[teamId]/notes - Get all notes for a team (user can see if they're creator, editor, or viewer)
export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } | Promise<{ teamId: string }> },
) {
  try {
    // Extract teamId and check authorization
    const teamId = await extractTeamId(params);
    const authResult = await requireTeamAccess(teamId, "READ_ONLY"); // Read operations allow READ_ONLY

    if (isAuthError(authResult)) {
      return authResult.response;
    }

    const { user } = authResult;

    // Rate limiting
    const rateLimitResult = await rateLimit(
      request,
      "GET",
      user.clerkId || user.id,
    );
    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        {
          error: "Too many requests",
          message: "Rate limit exceeded. Please try again later.",
        },
        { status: 429 },
      );
      addRateLimitHeaders(
        response.headers,
        rateLimitResult.limit,
        rateLimitResult.remaining,
        rateLimitResult.reset,
      );
      return response;
    }

    // Get all notes where user is creator, editor, or viewer
    const notes = await prisma.note.findMany({
      where: {
        teamId,
        OR: [
          { createdById: user.id },
          { editors: { some: { userId: user.id } } },
          { viewers: { some: { userId: user.id } } },
        ],
      },
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
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Add permission info for each note
    const notesWithPermissions = notes.map((note: any) => {
      const isCreator = note.createdById === user.id;
      const isEditor = note.editors.some((e: any) => e.userId === user.id);
      const isViewer = note.viewers.some((v: any) => v.userId === user.id);

      return {
        ...note,
        canEdit: isCreator || isEditor,
        canDelete: isCreator,
        userRole: isCreator ? "creator" : isEditor ? "editor" : "viewer",
      };
    });

    const response = NextResponse.json({ notes: notesWithPermissions });
    addRateLimitHeaders(
      response.headers,
      rateLimitResult.limit,
      rateLimitResult.remaining,
      rateLimitResult.reset,
    );
    return response;
  } catch (error) {
    const teamId = await extractTeamId(params).catch(() => "unknown");
    return createInternalErrorResponse(error, {
      endpoint: "/api/teams/[teamId]/notes",
      method: "GET",
      teamId,
    });
  }
}

// POST /api/teams/[teamId]/notes - Create a new note (only FULL access users)
export async function POST(
  request: NextRequest,
  { params }: { params: { teamId: string } | Promise<{ teamId: string }> },
) {
  try {
    // Extract teamId and check authorization (FULL access required for creating notes)
    const teamId = await extractTeamId(params);
    const authResult = await requireTeamAccess(teamId, "FULL");

    if (isAuthError(authResult)) {
      return authResult.response;
    }

    const { user, membership } = authResult;

    // Check if user has permission to create notes
    if (!membership.isAdmin && !membership.canCreateNotes) {
      return NextResponse.json(
        {
          error: "Forbidden",
          message: "You do not have permission to create notes",
        },
        { status: 403 },
      );
    }

    // Rate limiting
    const rateLimitResult = await rateLimit(
      request,
      "POST",
      user.clerkId || user.id,
    );
    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        {
          error: "Too many requests",
          message: "Rate limit exceeded. Please try again later.",
        },
        { status: 429 },
      );
      addRateLimitHeaders(
        response.headers,
        rateLimitResult.limit,
        rateLimitResult.remaining,
        rateLimitResult.reset,
      );
      return response;
    }

    // Validate request body
    const validation = await validateRequest(request, createNoteSchema);
    if (validation.error) {
      return createValidationErrorResponse(validation.error, {
        endpoint: "/api/teams/[teamId]/notes",
        method: "POST",
        teamId,
      });
    }
    const { title, content, editorIds = [], viewerIds = [] } = validation.data;

    // Validate that editorIds and viewerIds are team members
    const teamMemberIds = await prisma.careTeamMember.findMany({
      where: { teamId },
      select: { userId: true },
    });
    const validUserIds = teamMemberIds
      .map((m: { userId: string | null }) => m.userId)
      .filter((id: string | null): id is string => id !== null);

    const validEditorIds = (editorIds as string[]).filter((id: string) =>
      validUserIds.includes(id),
    );
    const validViewerIds = (viewerIds as string[]).filter((id: string) =>
      validUserIds.includes(id),
    );

    // Create note with creator as editor by default
    const note = await prisma.note.create({
      data: {
        teamId,
        createdById: user.id,
        title,
        content,
        editors: {
          create: [
            { userId: user.id }, // Creator is always an editor
            ...validEditorIds
              .filter((id) => id !== user.id) // Don't duplicate creator
              .map((id) => ({ userId: id })),
          ],
        },
        viewers: {
          create: validViewerIds
            .filter((id) => id !== user.id && !validEditorIds.includes(id)) // Don't duplicate creator or editors
            .map((id) => ({ userId: id })),
        },
      },
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
    });

    await createAuditLog({
      teamId,
      actorId: user.id,
      action: AUDIT_ACTIONS.NOTE_CREATED,
      entityType: "Note",
      entityId: note.id,
      metadata: { title: note.title },
    });

    const response = NextResponse.json(note, { status: 201 });
    addRateLimitHeaders(
      response.headers,
      rateLimitResult.limit,
      rateLimitResult.remaining,
      rateLimitResult.reset,
    );
    return response;
  } catch (error) {
    const teamId = await extractTeamId(params).catch(() => "unknown");
    return createInternalErrorResponse(error, {
      endpoint: "/api/teams/[teamId]/notes",
      method: "POST",
      teamId,
    });
  }
}
