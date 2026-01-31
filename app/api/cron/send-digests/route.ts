import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendDigestEmail } from "@/lib/email";
import { log, loggerUtils } from "@/lib/logger";
import { validateCronSecret } from "@/lib/cron-auth";
import { format, startOfDay, endOfDay, subDays } from "date-fns";

const appUrl =
  process.env.NODE_ENV === "production" ||
  process.env.VERCEL_ENV === "production"
    ? "https://joincoco.app"
    : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * Cron: send daily and weekly digest emails to users who have opted in.
 * Run every hour at :00 (e.g. 0 * * * *). Only sends at the user's configured digest time (UTC).
 * Secured by CRON_SECRET (Vercel: Bearer header; manual: ?secret=).
 */
export async function POST(req: Request) {
  const authError = validateCronSecret(req);
  if (authError) return authError;

  try {
    const now = new Date();
    const utcHour = now.getUTCHours();
    const utcMin = now.getUTCMinutes();
    const utcDay = now.getUTCDay(); // 0 Sun, 1 Mon, ...
    const timeStr = `${String(utcHour).padStart(2, "0")}:${String(utcMin).padStart(2, "0")}`;

    const settingsList = await prisma.userNotificationSettings.findMany({
      where: { emailNotificationsEnabled: true },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    let dailySent = 0;
    let weeklySent = 0;
    const errors: string[] = [];

    for (const settings of settingsList) {
      const user = settings.user;
      if (!user?.email) continue;

      const dailyTime = settings.dailyDigestTime ?? "09:00";
      const weeklyDay = settings.weeklyDigestDay ?? 1;
      const weeklyTime = settings.weeklyDigestTime ?? "09:00";

      const sendDaily = timeStr === dailyTime;
      const sendWeekly = utcDay === weeklyDay && timeStr === weeklyTime;

      if (!sendDaily && !sendWeekly) continue;

      try {
        const memberships = await prisma.careTeamMember.findMany({
          where: { userId: user.id },
          include: {
            team: {
              select: { id: true, name: true },
            },
          },
        });
        const teamIds = memberships.map((m) => m.teamId);

        if (teamIds.length === 0) {
          if (sendDaily) {
            await sendDigestEmail({
              to: user.email,
              subject: "Your Coco daily digest",
              sections: [
                {
                  title: "Overview",
                  items: [
                    "You have no care teams yet. Add or join a team to see tasks and activity.",
                  ],
                },
              ],
              dashboardUrl: `${appUrl}/dashboard`,
            });
            dailySent++;
          }
          if (sendWeekly) {
            await sendDigestEmail({
              to: user.email,
              subject: "Your Coco weekly digest",
              sections: [
                {
                  title: "Overview",
                  items: [
                    "You have no care teams yet. Add or join a team to see tasks and activity.",
                  ],
                },
              ],
              dashboardUrl: `${appUrl}/dashboard`,
            });
            weeklySent++;
          }
          continue;
        }

        const todayStart = startOfDay(now);
        const todayEnd = endOfDay(now);
        const weekStart = startOfDay(subDays(now, 7));
        const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const next7d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const [tasksDue24h, tasksDue7d, completedToday, completedThisWeek] =
          await Promise.all([
            prisma.task.findMany({
              where: {
                teamId: { in: teamIds },
                dueDate: { gte: now, lte: next24h },
                status: { not: "DONE" },
              },
              select: {
                name: true,
                dueDate: true,
                team: { select: { name: true } },
              },
              orderBy: { dueDate: "asc" },
              take: 20,
            }),
            prisma.task.findMany({
              where: {
                teamId: { in: teamIds },
                dueDate: { gte: now, lte: next7d },
                status: { not: "DONE" },
              },
              select: {
                name: true,
                dueDate: true,
                team: { select: { name: true } },
              },
              orderBy: { dueDate: "asc" },
              take: 20,
            }),
            prisma.task.findMany({
              where: {
                teamId: { in: teamIds },
                status: "DONE",
                updatedAt: { gte: todayStart, lte: todayEnd },
              },
              select: { name: true, team: { select: { name: true } } },
              take: 15,
            }),
            prisma.task.findMany({
              where: {
                teamId: { in: teamIds },
                status: "DONE",
                updatedAt: { gte: weekStart, lte: now },
              },
              select: {
                name: true,
                updatedAt: true,
                team: { select: { name: true } },
              },
              orderBy: { updatedAt: "desc" },
              take: 25,
            }),
          ]);

        const buildSection = (
          title: string,
          items: string[],
        ): { title: string; items: string[] } =>
          items.length > 0 ? { title, items } : { title, items: [] };

        const dailySections: { title: string; items: string[] }[] = [];
        if (tasksDue24h.length > 0) {
          dailySections.push(
            buildSection(
              "Due in the next 24 hours",
              tasksDue24h.map((t) => {
                const d = t.dueDate
                  ? format(new Date(t.dueDate), "MMM d, h:mm a")
                  : "";
                return `${t.name}${d ? ` — ${d}` : ""}${t.team?.name ? ` (${t.team.name})` : ""}`;
              }),
            ),
          );
        }
        if (completedToday.length > 0) {
          dailySections.push(
            buildSection(
              "Completed today",
              completedToday.map(
                (t) => `${t.name}${t.team?.name ? ` (${t.team.name})` : ""}`,
              ),
            ),
          );
        }
        if (dailySections.length === 0) {
          dailySections.push({
            title: "Overview",
            items: [
              "No tasks due in the next 24 hours and nothing completed today.",
            ],
          });
        }

        const weeklySections: { title: string; items: string[] }[] = [];
        if (tasksDue7d.length > 0) {
          weeklySections.push(
            buildSection(
              "Upcoming (next 7 days)",
              tasksDue7d.map((t) => {
                const d = t.dueDate
                  ? format(new Date(t.dueDate), "MMM d, h:mm a")
                  : "";
                return `${t.name}${d ? ` — ${d}` : ""}${t.team?.name ? ` (${t.team.name})` : ""}`;
              }),
            ),
          );
        }
        if (completedThisWeek.length > 0) {
          weeklySections.push(
            buildSection(
              "Completed this week",
              completedThisWeek.map((t) => {
                const d = t.updatedAt
                  ? format(new Date(t.updatedAt), "MMM d")
                  : "";
                return `${t.name}${d ? ` — ${d}` : ""}${t.team?.name ? ` (${t.team.name})` : ""}`;
              }),
            ),
          );
        }
        if (weeklySections.length === 0) {
          weeklySections.push({
            title: "Overview",
            items: ["No upcoming tasks or completions this week."],
          });
        }

        if (sendDaily) {
          const res = await sendDigestEmail({
            to: user.email,
            subject: "Your Coco daily digest",
            sections: dailySections,
            dashboardUrl: `${appUrl}/dashboard`,
          });
          if (res.success) dailySent++;
          else errors.push(`daily ${user.email}: ${res.error}`);
        }

        if (sendWeekly) {
          const res = await sendDigestEmail({
            to: user.email,
            subject: "Your Coco weekly digest",
            sections: weeklySections,
            dashboardUrl: `${appUrl}/dashboard`,
          });
          if (res.success) weeklySent++;
          else errors.push(`weekly ${user.email}: ${res.error}`);
        }
      } catch (err) {
        loggerUtils.logError(err, { type: "cron_digest", userId: user.id });
        errors.push(
          `${user.email}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    log.info(
      { type: "cron_digest", dailySent, weeklySent, errors: errors.length },
      "Digest cron finished",
    );

    return NextResponse.json({
      success: true,
      dailySent,
      weeklySent,
      errors: errors.length ? errors : undefined,
    });
  } catch (error) {
    loggerUtils.logError(error, { type: "cron_digest" });
    return NextResponse.json(
      {
        error: "Digest cron failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
