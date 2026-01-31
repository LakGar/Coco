import { requireAuth, isAuthError } from "@/lib/auth-middleware";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
  createNotFoundErrorResponse,
  createInternalErrorResponse,
} from "@/lib/error-handler";

export async function GET() {
  try {
    const authResult = await requireAuth();

    if (isAuthError(authResult)) {
      return authResult.response;
    }

    const { user } = authResult;

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        imageUrl: user.imageUrl,
      },
    });
  } catch (error) {
    return createInternalErrorResponse(error, {
      endpoint: "/api/user/profile",
      method: "GET",
    });
  }
}

export async function PATCH(req: Request) {
  try {
    const authResult = await requireAuth();
    if (isAuthError(authResult)) {
      return authResult.response;
    }
    const { user } = authResult;
    const body = (await req.json()) as {
      name?: string;
      firstName?: string;
      lastName?: string;
    };
    const { name, firstName, lastName } = body;
    const updateData: {
      name?: string | null;
      firstName?: string | null;
      lastName?: string | null;
    } = {};
    if (typeof name === "string") updateData.name = name.trim() || null;
    if (typeof firstName === "string")
      updateData.firstName = firstName.trim() || null;
    if (typeof lastName === "string")
      updateData.lastName = lastName.trim() || null;
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        user: {
          id: user.id,
          name: user.name,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          imageUrl: user.imageUrl,
        },
      });
    }
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });
    return NextResponse.json({
      user: {
        id: updated.id,
        name: updated.name,
        firstName: updated.firstName,
        lastName: updated.lastName,
        email: updated.email,
        imageUrl: updated.imageUrl,
      },
    });
  } catch (error) {
    return createInternalErrorResponse(error, {
      endpoint: "/api/user/profile",
      method: "PATCH",
    });
  }
}
