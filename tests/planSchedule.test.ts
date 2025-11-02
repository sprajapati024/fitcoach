import { describe, expect, it } from "vitest";
import { buildPlanSchedule } from "@/lib/planSchedule";
import type { PlanCalendar, PlanMicrocycle } from "@/drizzle/schema";
import type { plans, workouts } from "@/drizzle/schema";

const baseMicrocycle: PlanMicrocycle = {
  id: "microcycle-test",
  weeks: 2,
  daysPerWeek: 3,
  pattern: [
    {
      dayIndex: 0,
      focus: "Lower Body Strength",
      blocks: [
        {
          type: "warmup",
          title: "Warm-up",
          durationMinutes: 10,
          exercises: [
            {
              id: "wu-1",
              name: "Air Squats",
              equipment: "Bodyweight",
              sets: 2,
              reps: "10",
              tempo: undefined,
              cues: undefined,
              notes: undefined,
            },
          ],
        },
      ],
    },
    {
      dayIndex: 1,
      focus: "Upper Body Strength",
      blocks: [
        {
          type: "strength",
          title: "Pressing",
          durationMinutes: 25,
          exercises: [
            {
              id: "press-1",
              name: "Dumbbell Bench Press",
              equipment: "Dumbbells",
              sets: 3,
              reps: "8",
              tempo: undefined,
              cues: undefined,
              notes: undefined,
            },
          ],
        },
      ],
    },
    {
      dayIndex: 2,
      focus: "Conditioning",
      blocks: [
        {
          type: "conditioning",
          title: "Intervals",
          durationMinutes: 20,
          exercises: [
            {
              id: "bike-1",
              name: "Bike Sprints",
              equipment: "Bike",
              sets: 4,
              reps: "2 min",
              tempo: undefined,
              cues: undefined,
              notes: undefined,
            },
          ],
        },
      ],
    },
  ],
};

const basePlan: typeof plans.$inferSelect = {
  id: "plan-test",
  userId: "user-123",
  title: "Test Plan",
  summary: "A simple test plan",
  status: "active",
  active: true,
  startDate: null,
  durationWeeks: baseMicrocycle.weeks,
  daysPerWeek: baseMicrocycle.daysPerWeek,
  minutesPerSession: 60,
  preferredDays: ["mon", "wed", "fri"],
  microcycle: baseMicrocycle,
  calendar: { planId: "plan-test", weeks: [] } as unknown as PlanCalendar,
  plannerVersion: "test",
  generatedBy: "test",
  createdAt: new Date(),
  updatedAt: new Date(),
};

function createWorkout(params: { id: string; weekIndex: number; dayIndex: number; focus: string }): typeof workouts.$inferSelect {
  return {
    id: params.id,
    planId: basePlan.id,
    userId: basePlan.userId,
    microcycleDayId: `${baseMicrocycle.id}_day_${params.dayIndex % baseMicrocycle.pattern.length}`,
    dayIndex: params.weekIndex * baseMicrocycle.daysPerWeek + params.dayIndex,
    weekIndex: params.weekIndex,
    weekNumber: params.weekIndex + 1,
    weekStatus: "pending",
    sessionDate: null,
    title: `${params.focus} Session`,
    focus: params.focus,
    kind: "strength",
    isDeload: params.weekIndex === 1 && params.dayIndex === 0,
    durationMinutes: 55,
    payload: {
      workoutId: params.id,
      focus: params.focus,
      blocks: [
        {
          type: "warmup",
          title: "Warm-up",
          exercises: [
            {
              id: "wu-1",
              name: "Air Squats",
              equipment: "Bodyweight",
              sets: 2,
              reps: "10",
              tempo: undefined,
              cues: undefined,
              restSeconds: 60,
            },
          ],
        },
      ],
    },
    generationContext: null,
    coachingNotes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

const planWorkouts: typeof workouts.$inferSelect[] = [
  createWorkout({ id: "workout-1", weekIndex: 0, dayIndex: 0, focus: "Lower Body Strength" }),
  createWorkout({ id: "workout-2", weekIndex: 0, dayIndex: 1, focus: "Upper Body Strength" }),
  createWorkout({ id: "workout-3", weekIndex: 0, dayIndex: 2, focus: "Conditioning" }),
  createWorkout({ id: "workout-4", weekIndex: 1, dayIndex: 0, focus: "Lower Body Strength" }),
  createWorkout({ id: "workout-5", weekIndex: 1, dayIndex: 1, focus: "Upper Body Strength" }),
  createWorkout({ id: "workout-6", weekIndex: 1, dayIndex: 2, focus: "Conditioning" }),
];

describe("buildPlanSchedule", () => {
  it("aligns workouts to the selected start date", () => {
    const { calendar, workoutUpdates } = buildPlanSchedule({
      plan: basePlan,
      startDate: "2025-01-06", // Monday
      workouts: planWorkouts,
    });

    expect(workoutUpdates).toHaveLength(planWorkouts.length);
    expect(workoutUpdates[0].sessionDate).toBe("2025-01-06");
    expect(workoutUpdates[1].sessionDate).toBe("2025-01-08");
    expect(workoutUpdates[2].sessionDate).toBe("2025-01-10");
    expect(workoutUpdates[3].sessionDate).toBe("2025-01-13");
    expect(workoutUpdates[4].sessionDate).toBe("2025-01-15");
    expect(workoutUpdates[5].sessionDate).toBe("2025-01-17");

    expect(calendar.weeks).toHaveLength(baseMicrocycle.weeks);
    expect(calendar.weeks[0].startDate).toBe("2025-01-06");
    expect(calendar.weeks[1].startDate).toBe("2025-01-13");
    expect(calendar.weeks[0].days[0].isoDate).toBe("2025-01-06");
  });

  it("recomputes session dates when the start date shifts", () => {
    const { workoutUpdates } = buildPlanSchedule({
      plan: basePlan,
      startDate: "2025-01-13", // Next Monday
      workouts: planWorkouts,
    });

    expect(workoutUpdates[0].sessionDate).toBe("2025-01-13");
    expect(workoutUpdates[1].sessionDate).toBe("2025-01-15");
    expect(workoutUpdates[2].sessionDate).toBe("2025-01-17");
  });
});
