import { randomUUID } from "node:crypto";
import { addDays } from "date-fns";
import { db, pool } from "@/lib/db";
import {
  coachCache,
  plans,
  profiles,
  progressionTargets,
  substitutionEvents,
  users,
  type PlanCalendar,
  type PlanCalendarDay,
  type PlanMicrocycle,
  type ProgressionTarget,
  type WorkoutPayload,
  workouts,
  workoutLogs,
  workoutLogSets,
  type PreferredDay,
} from "@/drizzle/schema";
import { eq } from "drizzle-orm";

const demoUserId = "00000000-0000-4000-8000-000000000001";
const demoPlanId = "00000000-0000-4000-8000-000000000010";

const preferredDays: PreferredDay[] = ["mon", "wed", "fri"];

const microcycle: PlanMicrocycle = {
  id: "base-strength-v1",
  weeks: 6,
  daysPerWeek: 3,
  pattern: [
    {
      dayIndex: 0,
      focus: "Lower Strength Foundation",
      blocks: [
        {
          type: "warmup",
          title: "Glute & Core Prime",
          durationMinutes: 10,
          exercises: [
            {
              id: "glute_bridge",
              name: "Glute Bridge",
              equipment: "bodyweight",
              sets: 2,
              reps: "12",
              cues: ["Squeeze for 2s at top"],
            },
            {
              id: "worlds_greatest_stretch",
              name: "World's Greatest Stretch",
              equipment: "bodyweight",
              sets: 1,
              reps: "5/side",
              cues: ["Slow breathing"],
            },
          ],
        },
        {
          type: "strength",
          title: "Lower Body Strength",
          durationMinutes: 35,
          exercises: [
            {
              id: "trap_bar_deadlift",
              name: "Trap Bar Deadlift",
              equipment: "trap_bar",
              sets: 4,
              reps: "6",
              cues: ["Flat back", "Drive through heels"],
            },
            {
              id: "front_squat",
              name: "Front Squat",
              equipment: "barbell",
              sets: 3,
              reps: "8",
              cues: ["Brace", "Elbows high"],
            },
            {
              id: "walking_lunge",
              name: "DB Walking Lunge",
              equipment: "dumbbell",
              sets: 2,
              reps: "10/side",
              cues: ["Stay tall"],
            },
          ],
        },
        {
          type: "conditioning",
          title: "Zone 2 Spin",
          durationMinutes: 15,
          exercises: [
            {
              id: "bike_zone2",
              name: "Bike - Zone 2",
              equipment: "bike",
              sets: 1,
              reps: "15 min",
              cues: ["RPE 6", "Keep cadence smooth"],
            },
          ],
        },
      ],
    },
    {
      dayIndex: 2,
      focus: "Upper Push / Pull",
      blocks: [
        {
          type: "warmup",
          title: "Scapular Prep",
          durationMinutes: 8,
          exercises: [
            {
              id: "band_pull_apart",
              name: "Band Pull-Apart",
              equipment: "band",
              sets: 2,
              reps: "15",
            },
            {
              id: "cat_camel",
              name: "Cat Camel",
              equipment: "bodyweight",
              sets: 1,
              reps: "10",
            },
          ],
        },
        {
          type: "strength",
          title: "Upper Body Strength",
          durationMinutes: 35,
          exercises: [
            {
              id: "bench_press",
              name: "Barbell Bench Press",
              equipment: "barbell",
              sets: 4,
              reps: "6",
              cues: ["Control tempo"],
            },
            {
              id: "chest_supported_row",
              name: "Chest-Supported Row",
              equipment: "dumbbell",
              sets: 3,
              reps: "10",
            },
            {
              id: "half_kneel_press",
              name: "Half-Kneeling DB Press",
              equipment: "dumbbell",
              sets: 3,
              reps: "8/side",
            },
          ],
        },
        {
          type: "accessory",
          title: "Accessory Core",
          durationMinutes: 12,
          exercises: [
            {
              id: "pallof_press",
              name: "Pallof Press",
              equipment: "cable",
              sets: 2,
              reps: "12/side",
            },
            {
              id: "face_pull",
              name: "Cable Face Pull",
              equipment: "cable",
              sets: 2,
              reps: "15",
            },
          ],
        },
        {
          type: "conditioning",
          title: "Treadmill Zone 2",
          durationMinutes: 10,
          exercises: [
            {
              id: "treadmill_walk",
              name: "Incline Walk",
              equipment: "treadmill",
              sets: 1,
              reps: "10 min",
              cues: ["HR < 140"],
            },
          ],
        },
      ],
    },
    {
      dayIndex: 4,
      focus: "Conditioning + Core",
      blocks: [
        {
          type: "warmup",
          title: "Dynamic Prep",
          durationMinutes: 8,
          exercises: [
            {
              id: "jumping_jack_step",
              name: "Low-Impact Jack",
              equipment: "bodyweight",
              sets: 2,
              reps: "20",
              cues: ["Stay light"],
            },
            {
              id: "hip_circles",
              name: "Hip Circles",
              equipment: "bodyweight",
              sets: 1,
              reps: "8/side",
            },
          ],
        },
        {
          type: "conditioning",
          title: "Bike Intervals",
          durationMinutes: 20,
          exercises: [
            {
              id: "bike_interval_z2",
              name: "Bike Zone 2",
              equipment: "bike",
              sets: 1,
              reps: "20 min",
              cues: ["Steady breathing"],
            },
          ],
        },
        {
          type: "accessory",
          title: "Core Finisher",
          durationMinutes: 12,
          exercises: [
            {
              id: "dead_bug",
              name: "Dead Bug",
              equipment: "bodyweight",
              sets: 3,
              reps: "10/side",
            },
            {
              id: "side_plank",
              name: "Side Plank",
              equipment: "bodyweight",
              sets: 2,
              reps: "30s/side",
            },
          ],
        },
        {
          type: "recovery",
          title: "Box Breathing",
          durationMinutes: 5,
          exercises: [
            {
              id: "box_breath",
              name: "Box Breathing",
              equipment: "bodyweight",
              sets: 1,
              reps: "5 min",
              cues: ["4-4-4-4"],
            },
          ],
        },
      ],
    },
  ],
};

const blockTypeMap: Record<PlanMicrocycle["pattern"][number]["blocks"][number]["type"], WorkoutPayload["blocks"][number]["type"]> = {
  warmup: "warmup",
  strength: "primary",
  accessory: "accessory",
  conditioning: "conditioning",
  recovery: "finisher",
};

const toIsoDate = (date: Date) => date.toISOString().slice(0, 10);

const startOfWeekMonday = (date: Date) => {
  const result = new Date(date);
  const day = result.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
};

async function seed() {
  const today = new Date();
  const planStart = startOfWeekMonday(today);

  const workoutsData: Array<(typeof workouts)["$inferInsert"]> = [];
  const calendarWeeks: PlanCalendar["weeks"] = [];
  const progressionPayloads: Array<(typeof progressionTargets)["$inferInsert"]> = [];

  for (let weekIndex = 0; weekIndex < microcycle.weeks; weekIndex += 1) {
    const weekStart = addDays(planStart, weekIndex * 7);
    const days: PlanCalendarDay[] = [];

    microcycle.pattern.forEach((patternDay, dayPosition) => {
      const workoutId = randomUUID();
      const sessionDate = addDays(weekStart, patternDay.dayIndex);
      const hasStrength = patternDay.blocks.some((block) => block.type === "strength");
      const hasConditioning = patternDay.blocks.some((block) => block.type === "conditioning");
      const kind: (typeof workouts)["$inferInsert"]["kind"] = hasStrength && hasConditioning
        ? "mixed"
        : hasStrength
          ? "strength"
          : hasConditioning
            ? "conditioning"
            : "mobility";

      const payload: WorkoutPayload = {
        workoutId,
        focus: patternDay.focus,
        blocks: patternDay.blocks.map((block) => ({
          type: blockTypeMap[block.type],
          title: block.title,
          exercises: block.exercises.map((exercise) => ({
            id: exercise.id,
            name: exercise.name,
            equipment: exercise.equipment,
            sets: exercise.sets,
            reps: exercise.reps,
            tempo: exercise.tempo,
            cues: exercise.cues,
            restSeconds: block.type === "strength" ? 120 : block.type === "accessory" ? 60 : 30,
          })),
        })),
      };

      const totalDuration = patternDay.blocks.reduce((sum, block) => sum + block.durationMinutes, 0);
      const calendarDay: PlanCalendarDay = {
        dayIndex: weekIndex * microcycle.daysPerWeek + dayPosition,
        isoDate: toIsoDate(sessionDate),
        workoutId,
        isDeload: weekIndex === 3,
        focus: patternDay.focus,
      };

      workoutsData.push({
        id: workoutId,
        planId: demoPlanId,
        userId: demoUserId,
        microcycleDayId: `${microcycle.id}-${patternDay.dayIndex}`,
        dayIndex: calendarDay.dayIndex,
        weekIndex,
        sessionDate: toIsoDate(sessionDate),
        title: `${patternDay.focus} · Week ${weekIndex + 1}`,
        focus: patternDay.focus,
        kind,
        isDeload: calendarDay.isDeload,
        durationMinutes: totalDuration,
        payload,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      days.push(calendarDay);
    });

    calendarWeeks.push({
      weekIndex,
      startDate: toIsoDate(weekStart),
      days,
    });

    const totalLoadKg = 4500 + weekIndex * 220;
    const zone2Minutes = weekIndex === 3 ? 110 : 95;
    const progressionPayload: ProgressionTarget = {
      weekIndex,
      totalLoadKg,
      zone2Minutes,
      focusNotes: weekIndex === 3 ? "Deload and focus on tempo" : "Progress steady +2.5% load",
    };

    progressionPayloads.push({
      id: randomUUID(),
      planId: demoPlanId,
      weekIndex,
      payload: progressionPayload,
      computedAt: new Date(),
    });
  }

  const calendar: PlanCalendar = {
    planId: demoPlanId,
    weeks: calendarWeeks,
  };

  const firstWorkout = workoutsData[0];
  if (!firstWorkout) {
    throw new Error("Seed requires at least one workout");
  }
  const logId = randomUUID();

  const logWorkoutId = firstWorkout.id;
  if (!logWorkoutId) {
    throw new Error("Seed requires workouts to include ids");
  }
  const sessionDateForLog = firstWorkout.sessionDate ?? toIsoDate(planStart);

  const logEntries: Array<(typeof workoutLogSets)["$inferInsert"]> = [
    {
      id: randomUUID(),
      logId,
      exerciseId: "trap_bar_deadlift",
      setIndex: 1,
      reps: 6,
      weightKg: "60",
      rpe: "7.5",
      createdAt: new Date(),
    },
    {
      id: randomUUID(),
      logId,
      exerciseId: "trap_bar_deadlift",
      setIndex: 2,
      reps: 6,
      weightKg: "62.5",
      rpe: "8",
      createdAt: new Date(),
    },
    {
      id: randomUUID(),
      logId,
      exerciseId: "front_squat",
      setIndex: 1,
      reps: 8,
      weightKg: "40",
      rpe: "7",
      createdAt: new Date(),
    },
  ];

  await db.transaction(async (tx) => {
    await tx.delete(users).where(eq(users.id, demoUserId));
    await tx.delete(plans).where(eq(plans.id, demoPlanId));
    await tx.delete(coachCache).where(eq(coachCache.userId, demoUserId));
    await tx.delete(substitutionEvents).where(eq(substitutionEvents.userId, demoUserId));
    await tx.delete(progressionTargets).where(eq(progressionTargets.planId, demoPlanId));
    await tx.delete(workoutLogs).where(eq(workoutLogs.userId, demoUserId));

    await tx.insert(users).values({
      id: demoUserId,
      email: "demo@fitcoach.app",
      createdAt: new Date(),
    });

    await tx.insert(profiles).values({
      userId: demoUserId,
      heightCm: "168",
      weightKg: "68",
      timezone: "UTC",
      fullName: "FitCoach Demo",
      sex: "female",
      unitSystem: "metric",
      hasPcos: true,
      experienceLevel: "intermediate",
      scheduleDaysPerWeek: 3,
      scheduleMinutesPerSession: 60,
      scheduleWeeks: microcycle.weeks,
      preferredDays,
      equipment: ["trap_bar", "barbell", "dumbbell", "bike", "treadmill", "cable"],
      avoidList: [],
      noHighImpact: true,
      goalBias: "balanced",
      coachTone: "friendly",
      coachNotes: "Prioritize steady-state cardio on low energy days.",
      coachTodayEnabled: true,
      coachDebriefEnabled: true,
      coachWeeklyEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await tx.insert(plans).values({
      id: demoPlanId,
      userId: demoUserId,
      title: "Base Strength · 6 Weeks",
      summary: "3-day template emphasizing lower strength, upper push/pull, and PCOS-friendly cardio.",
      status: "active",
      active: true,
      startDate: toIsoDate(planStart),
      durationWeeks: microcycle.weeks,
      daysPerWeek: microcycle.daysPerWeek,
      minutesPerSession: 60,
      preferredDays,
      microcycle,
      calendar,
      plannerVersion: "demo-1",
      generatedBy: "seed-script",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await tx.insert(workouts).values(workoutsData);
    await tx.insert(progressionTargets).values(progressionPayloads);

    await tx.insert(workoutLogs).values({
      id: logId,
      userId: demoUserId,
      planId: demoPlanId,
      workoutId: logWorkoutId,
      sessionDate: sessionDateForLog,
      performedAt: addDays(planStart, 0),
      rpeLastSet: "8",
      totalDurationMinutes: 58,
      notes: "Felt strong, ready to nudge load next session.",
      createdAt: new Date(),
    } satisfies (typeof workoutLogs)["$inferInsert"]);

    await tx.insert(workoutLogSets).values(logEntries);
  });
}

seed()
  .then(() => {
    console.log("✅ Seed data inserted. Demo user: demo@fitcoach.app / plan activated.");
  })
  .catch((err) => {
    console.error("❌ Seed failed", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
