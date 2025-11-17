import "dotenv/config";
import { db, pool } from "@/lib/db";
import { plans, workouts } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { buildPlanSchedule } from "@/lib/planSchedule";

async function backfillActivePlans() {
  const activePlans = await db
    .select()
    .from(plans)
    .where(and(eq(plans.active, true), eq(plans.status, "active")));

  if (activePlans.length === 0) {
    console.log("No active plans found. Nothing to backfill.");
    return;
  }

  console.log(`Found ${activePlans.length} active plan(s) to backfill.`);

  for (const plan of activePlans) {
    if (!plan.startDate) {
      console.warn(`Skipping plan ${plan.id}; no start date set.`);
      continue;
    }

    const planWorkouts = await db
      .select()
      .from(workouts)
      .where(eq(workouts.planId, plan.id))
      .orderBy(workouts.dayIndex);

    if (planWorkouts.length === 0) {
      console.warn(`Skipping plan ${plan.id}; no workouts found.`);
      continue;
    }

    const { calendar, workoutUpdates } = buildPlanSchedule({
      plan,
      startDate: plan.startDate,
      workouts: planWorkouts,
    });

    await db.transaction(async (tx) => {
      await tx
        .update(plans)
        .set({
          calendar,
          updatedAt: new Date(),
        })
        .where(eq(plans.id, plan.id));

      for (const workout of workoutUpdates) {
        await tx
          .update(workouts)
          .set({
            sessionDate: workout.sessionDate,
            isDeload: workout.isDeload,
          })
          .where(eq(workouts.id, workout.id));
      }
    });

    console.log(`Backfilled plan ${plan.id} with ${workoutUpdates.length} workouts.`);
  }
}

backfillActivePlans()
  .catch((error) => {
    console.error("Backfill failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
