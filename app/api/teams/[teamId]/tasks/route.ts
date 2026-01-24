import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { TaskPriority, TaskStatus, TaskType } from "@prisma/client";
import {
  createTaskSchema,
  validateRequest,
  formatZodError,
} from "@/lib/validations";
import { rateLimit, addRateLimitHeaders } from "@/lib/rate-limit";
import {
  requireTeamAccess,
  extractTeamId,
  isAuthError,
} from "@/lib/auth-middleware";
import {
  createErrorResponse,
  createValidationErrorResponse,
  createInternalErrorResponse,
} from "@/lib/error-handler";

export async function GET(
  req: Request,
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
      req,
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

    // Get all tasks for this team
    const tasks = await prisma.task.findMany({
      where: {
        teamId: teamId,
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
        assignedTo: {
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
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    });

    const response = NextResponse.json({ tasks });
    addRateLimitHeaders(
      response.headers,
      rateLimitResult.limit,
      rateLimitResult.remaining,
      rateLimitResult.reset,
    );
    return response;
  } catch (error) {
    const teamId = await extractTeamId(params);
    return createInternalErrorResponse(error, {
      endpoint: "/api/teams/[teamId]/tasks",
      method: "GET",
      teamId,
    });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { teamId: string } | Promise<{ teamId: string }> },
) {
  try {
    // Extract teamId and check authorization (requires FULL access for write operations)
    const teamId = await extractTeamId(params);
    const authResult = await requireTeamAccess(teamId, "FULL");

    if (isAuthError(authResult)) {
      return authResult.response;
    }

    const { user } = authResult;

    // Rate limiting
    const rateLimitResult = await rateLimit(
      req,
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
    const validation = await validateRequest(req, createTaskSchema);
    if (validation.error) {
      return createValidationErrorResponse(validation.error, {
        endpoint: "/api/teams/[teamId]/tasks",
        method: "POST",
        teamId,
        userId: user.id,
      });
    }
    const {
      name,
      description,
      patientName,
      assignedToId,
      priority,
      status,
      type,
      dueDate,
    } = validation.data;

    // Get team to get patient name if not provided
    const team = await prisma.careTeam.findUnique({
      where: { id: teamId },
      include: {
        patient: {
          select: {
            name: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Use provided patientName or default to team's patient name
    const finalPatientName =
      patientName ||
      (team.patient
        ? team.patient.name ||
          `${team.patient.firstName || ""} ${team.patient.lastName || ""}`.trim()
        : null);

    // Create task
    const task = await prisma.task.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        teamId: teamId,
        patientName: finalPatientName,
        createdById: user.id,
        assignedToId: assignedToId || null,
        priority: (priority as TaskPriority) || "MEDIUM",
        status: (status as TaskStatus) || "TODO",
        type: type ? (type as TaskType) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
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
        assignedTo: {
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
    });

    const response = NextResponse.json({ task }, { status: 201 });
    addRateLimitHeaders(
      response.headers,
      rateLimitResult.limit,
      rateLimitResult.remaining,
      rateLimitResult.reset,
    );
    return response;
  } catch (error) {
    const teamId = await extractTeamId(params);
    return createInternalErrorResponse(error, {
      endpoint: "/api/teams/[teamId]/tasks",
      method: "POST",
      teamId,
    });
  }
}
