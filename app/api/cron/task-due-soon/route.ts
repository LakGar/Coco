import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAndNotify } from "@/lib/notifications";
import { log, loggerUtils } from "@/lib/logger";
import { validateCronSecret } from "@/lib/cron-auth";
import { NotificationType } from "@prisma/client";

const DUE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const DEDUP_WINDOW_MS = 2 * 60 * 60 * 1000; // don't re-notify within 2 hours

/**
 * Cron: notify assignees when a task is due in the next 1 hour.
 * Run every 15–30 min (e.g. every 15 minutes).
 * Secured by CRON_SECRET (Vercel: Bearer header; manual: ?secret=).
 */
export async function POST(req: Request) {
  const authError = validateCronSecret(req);
  if (authError) return authError;

  try {
    const now = new Date();
    const dueBy = new Date(now.getTime() + DUE_WINDOW_MS);
    const dedupSince = new Date(now.getTime() - DEDUP_WINDOW_MS);

    const tasksDueSoon = await prisma.task.findMany({
      where: {
        dueDate: { gte: now, lte: dueBy },
        status: { not: "DONE" },
        assignedToId: { not: null },
      },
      include: {
        team: { select: { name: true } },
        assignedTo: { select: { id: true } },
      },
    });

    let notified = 0;
    const errors: string[] = [];

    for (const task of tasksDueSoon) {
      const assigneeId = task.assignedToId!;
      const taskLink = `/dashboard/tasks?task=${task.id}`;

      const existing = await prisma.notification.findFirst({
        where: {
          userId: assigneeId,
          type: NotificationType.TASK_DUE,
          linkUrl: { contains: task.id },
          createdAt: { gte: dedupSince },
        },
      });

      if (existing) continue;

      try {
        const dueLabel =
          task.dueDate instanceof Date
            ? task.dueDate.toLocaleTimeString(undefined, {
                hour: "numeric",
                minute: "2-digit",
              })
            : "soon";

        await createAndNotify({
          teamId: task.teamId,
          userId: assigneeId,
          type: NotificationType.TASK_DUE,
          title: "Task due in 1 hour",
          message: `"${task.name}" is due at ${dueLabel}${task.team?.name ? ` (${task.team.name})` : ""}.`,
          linkUrl: taskLink,
          linkLabel: "View task",
        });
        notified++;
      } catch (err) {
        const msg = `task ${task.id}: ${err instanceof Error ? err.message : String(err)}`;
        loggerUtils.logError(err, {
          type: "cron_task_due_soon",
          taskId: task.id,
        });
        errors.push(msg);
      }
    }

    log.info(
      {
        type: "cron_task_due_soon",
        tasksDueSoon: tasksDueSoon.length,
        notified,
        errors: errors.length,
      },
      "Task due soon cron finished",
    );

    return NextResponse.json({
      success: true,
      tasksDueSoon: tasksDueSoon.length,
      notified,
      errors: errors.length ? errors : undefined,
    });
  } catch (error) {
    loggerUtils.logError(error, { type: "cron_task_due_soon" });
    return NextResponse.json(
      {
        error: "Task due soon cron failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
