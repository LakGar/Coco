import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeSnapshotForTeam } from "@/lib/patient-journey-snapshot";
import { log, loggerUtils } from "@/lib/logger";
import { validateCronSecret } from "@/lib/cron-auth";

/**
 * Cron: compute Patient Journey snapshots (7 + 30 days) for all teams that have a journey.
 * Run nightly (e.g. 0 1 * * *). Secured by CRON_SECRET (Vercel: Bearer header; manual: ?secret=).
 */
export async function POST(req: Request) {
  const authError = validateCronSecret(req);
  if (authError) return authError;

  try {
    const journeys = await prisma.patientJourney.findMany({
      select: { id: true, teamId: true },
    });

    let computed = 0;
    const errors: string[] = [];

    for (const journey of journeys) {
      for (const rangeDays of [7, 30] as const) {
        try {
          const data = await computeSnapshotForTeam(journey.teamId, rangeDays);
          await prisma.journeySnapshot.upsert({
            where: {
              journeyId_rangeDays: { journeyId: journey.id, rangeDays },
            },
            create: {
              journeyId: journey.id,
              rangeDays,
              data: data as unknown as object,
            },
            update: {
              computedAt: new Date(),
              data: data as unknown as object,
            },
          });
          computed += 1;
        } catch (err) {
          loggerUtils.logError(err, {
            type: "cron_journey_snapshot",
            teamId: journey.teamId,
            rangeDays,
          });
          errors.push(
            `${journey.teamId} range=${rangeDays}: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }
    }

    log.info(
      {
        type: "cron_journey_snapshots",
        journeys: journeys.length,
        computed,
        errors: errors.length,
      },
      "Journey snapshots cron finished",
    );

    return NextResponse.json({
      success: true,
      journeys: journeys.length,
      computed,
      errors: errors.length ? errors : undefined,
    });
  } catch (error) {
    loggerUtils.logError(error, { type: "cron_journey_snapshots" });
    return NextResponse.json(
      {
        error: "Journey snapshots cron failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
