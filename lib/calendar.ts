import { createWorkoutId, createMicrocycleId } from "@/lib/ids";
import { shiftUtcDate } from "@/lib/tz";
import type { PlannerResponse, PlanMicrocycleInput } from "@/lib/validation";
import type { PlanCalendar, PlanMicrocycle, WorkoutPayload } from "@/drizzle/schema";
import type { workouts } from "@/drizzle/schema";

type WorkoutInsert = typeof workouts.$inferInsert;

interface CalendarGenerationOptions {
  planId: string;
  userId: string;
  startDate?: string; // ISO date string "YYYY-MM-DD"
  weeks: number;
  daysPerWeek: number;
  preferredDays?: string[]; // e.g., ["Mon", "Wed", "Fri"]
}

/**
 * Determine which weeks are deload weeks
 * - Week 3 is always a deload (index 2)
 * - Week 7 is also a deload if plan is 10+ weeks (index 6)
 */
export function getDeloadWeeks(totalWeeks: number): number[] {
  const deloadWeeks: number[] = [];

  // Week 3 is always a deload (0-indexed: week 2)
  if (totalWeeks >= 3) {
    deloadWeeks.push(2);
  }

  // Week 7 is a deload if plan is 10+ weeks (0-indexed: week 6)
  if (totalWeeks >= 10) {
    deloadWeeks.push(6);
  }

  return deloadWeeks;
}

/**
 * Get day-of-week index from day name
 */
function getDayOfWeekIndex(dayName: string): number {
  const days: Record<string, number> = {
    sun: 0,
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6,
  };
  return days[dayName.toLowerCase()] ?? 1; // Default to Monday
}

/**
 * Calculate training days for a week based on preferred days
 */
export function calculateTrainingDays(
  daysPerWeek: number,
  preferredDays?: string[]
): number[] {
  // If no preferred days, use Mon/Wed/Fri pattern
  if (!preferredDays || preferredDays.length === 0) {
    const defaultPattern: Record<number, number[]> = {
      3: [1, 3, 5], // Mon, Wed, Fri
      4: [1, 3, 5, 6], // Mon, Wed, Fri, Sat
      5: [1, 2, 3, 5, 6], // Mon, Tue, Wed, Fri, Sat
      6: [1, 2, 3, 4, 5, 6], // Mon-Sat
    };
    return defaultPattern[daysPerWeek] || [1, 3, 5];
  }

  // Use preferred days
  const dayIndices = preferredDays.map(getDayOfWeekIndex).sort((a, b) => a - b);
  return dayIndices.slice(0, daysPerWeek);
}

/**
 * Convert microcycle block types to workout payload block types
 */
function convertBlockType(type: string): "warmup" | "primary" | "accessory" | "conditioning" | "finisher" {
  if (type === "strength") return "primary";
  if (type === "recovery") return "finisher";
  return type as "warmup" | "accessory" | "conditioning";
}

/**
 * Generate workout instances from microcycle pattern
 */
export function generateWorkouts(
  microcycle: PlanMicrocycleInput,
  options: CalendarGenerationOptions
): WorkoutInsert[] {
  const { planId, userId, startDate, weeks, daysPerWeek, preferredDays } = options;
  const workouts: WorkoutInsert[] = [];
  const deloadWeeks = getDeloadWeeks(weeks);
  const trainingDaysOfWeek = calculateTrainingDays(daysPerWeek, preferredDays);

  // Get the microcycle pattern days
  const { pattern } = microcycle;

  let globalDayIndex = 0;

  for (let weekIndex = 0; weekIndex < weeks; weekIndex++) {
    const isDeloadWeek = deloadWeeks.includes(weekIndex);

    // For each training day in this week
    for (let sessionIndex = 0; sessionIndex < daysPerWeek; sessionIndex++) {
      const dayOfWeek = trainingDaysOfWeek[sessionIndex];

      // Calculate the actual calendar date
      const daysFromStart = weekIndex * 7 + dayOfWeek;
      const sessionDate = startDate ? shiftUtcDate(startDate, daysFromStart) : undefined;

      // Rotate through microcycle pattern (A/B rotation)
      const patternIndex = sessionIndex % pattern.length;
      const templateDay = pattern[patternIndex];

      // Create workout ID
      const workoutId = createWorkoutId();

      // Build workout payload
      let blocks = templateDay.blocks.map((block) => ({
        type: convertBlockType(block.type),
        title: block.title,
        exercises: block.exercises.map((ex) => ({
          id: ex.id,
          name: ex.name,
          equipment: ex.equipment,
          sets: ex.sets,
          reps: ex.reps,
          ...(ex.tempo && { tempo: ex.tempo }),
          ...(ex.cues && { cues: ex.cues }),
          restSeconds: 90, // Default rest
        })),
      }));

      // Apply deload modifications if needed
      if (isDeloadWeek) {
        blocks = applyDeloadModifications(blocks);
      }

      const payload: WorkoutPayload = {
        workoutId,
        focus: templateDay.focus,
        blocks,
      };

      // Calculate total duration
      const durationMinutes = blocks.reduce((sum, block) => {
        const blockDuration = block.exercises.reduce((total, ex) => total + ex.sets * 3, 0); // ~3 min per set
        return sum + blockDuration;
      }, 0);

      const workout: WorkoutInsert = {
        id: workoutId,
        planId,
        userId,
        microcycleDayId: `${microcycle.id}_day_${templateDay.dayIndex}`,
        dayIndex: globalDayIndex,
        weekIndex,
        weekNumber: weekIndex + 1,
        sessionDate: sessionDate ?? null,
        title: `Week ${weekIndex + 1} - ${templateDay.focus}`,
        focus: templateDay.focus,
        kind: "strength",
        isDeload: isDeloadWeek,
        durationMinutes: Math.min(durationMinutes, 90),
        payload,
      };

      workouts.push(workout);
      globalDayIndex++;
    }
  }

  return workouts;
}

/**
 * Apply deload modifications to workout blocks
 * - Reduce strength volume (trim 1 set from each exercise)
 * - Reduce conditioning duration by 20%
 */
type WorkoutBlock = WorkoutPayload["blocks"][number];
type WorkoutExercise = WorkoutBlock["exercises"][number];

function applyDeloadModifications(blocks: WorkoutBlock[]) {
  return blocks.map((block) => {
    if (block.type === "primary" || block.type === "accessory") {
      // Reduce sets for each exercise
      return {
        ...block,
        exercises: block.exercises.map((exercise) => {
          const newCues = [...(exercise.cues ?? []), "Deload week - reduced volume"];
          return {
            id: exercise.id,
            name: exercise.name,
            equipment: exercise.equipment,
            sets: Math.max(1, exercise.sets - 1),
            reps: exercise.reps,
            restSeconds: 90,
            ...(exercise.tempo && { tempo: exercise.tempo }),
            cues: newCues,
          };
        }),
      };
    }

    if (block.type === "conditioning") {
      // Reduce exercise count or duration
      return {
        ...block,
        exercises: block.exercises.map((exercise) => {
          const newCues = [...(exercise.cues ?? []), "Deload week - reduced intensity"];
          return {
            id: exercise.id,
            name: exercise.name,
            equipment: exercise.equipment,
            sets: exercise.sets,
            reps: exercise.reps.includes("min")
              ? `${Math.floor(parseInt(exercise.reps, 10) * 0.8)} min`
              : exercise.reps,
            restSeconds: 90,
            ...(exercise.tempo && { tempo: exercise.tempo }),
            cues: newCues,
          };
        }),
      };
    }

    // For warmup, finisher, or other block types - normalize structure
    return {
      ...block,
      exercises: block.exercises.map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        equipment: exercise.equipment,
        sets: exercise.sets,
        reps: exercise.reps,
        restSeconds: 90,
        ...(exercise.tempo && { tempo: exercise.tempo }),
        ...(exercise.cues && { cues: exercise.cues }),
      })),
    };
  });
}

/**
 * Generate calendar structure from microcycle
 */
export function generateCalendar(
  microcycle: PlanMicrocycleInput,
  workoutsGenerated: WorkoutInsert[],
  options: CalendarGenerationOptions
): PlanCalendar {
  const { planId, startDate, weeks } = options;

  // Group workouts by week
  const weeklySchedule: PlanCalendar["weeks"] = [];

  for (let weekIndex = 0; weekIndex < weeks; weekIndex++) {
    const weekWorkouts = workoutsGenerated.filter((w) => w.weekIndex === weekIndex);
    const weekStartDate = startDate ? shiftUtcDate(startDate, weekIndex * 7) : "";

    weeklySchedule.push({
      weekIndex,
      startDate: weekStartDate,
      days: weekWorkouts.map((w) => ({
        dayIndex: w.dayIndex,
        isoDate: w.sessionDate || "",
        workoutId: w.id || "",
        isDeload: w.isDeload || false,
        focus: w.focus,
      })),
    });
  }

  return {
    planId,
    weeks: weeklySchedule,
  };
}

/**
 * Main function to expand planner response into full plan data
 * Now accepts weeks from options (user profile) instead of from agent response
 */
export function expandPlannerResponse(
  plannerResponse: PlannerResponse,
  options: Omit<CalendarGenerationOptions, "daysPerWeek"> & { weeks: number }
): {
  microcycle: PlanMicrocycle;
  calendar: PlanCalendar;
  workouts: WorkoutInsert[];
} {
  const { microcycle: microcycleInput } = plannerResponse;
  const { weeks } = options;

  // Generate microcycle ID (app-generated, not from agent)
  const microcycleId = createMicrocycleId();

  // Build full microcycle for storage with app-generated fields
  const fullMicrocycleInput: PlanMicrocycleInput = {
    id: microcycleId,
    weeks,
    daysPerWeek: microcycleInput.daysPerWeek,
    pattern: microcycleInput.pattern,
  };

  // Generate workouts
  const workouts = generateWorkouts(fullMicrocycleInput, {
    ...options,
    weeks,
    daysPerWeek: microcycleInput.daysPerWeek,
  });

  // Generate calendar
  const calendar = generateCalendar(fullMicrocycleInput, workouts, {
    ...options,
    weeks,
    daysPerWeek: microcycleInput.daysPerWeek,
  });

  // Convert to storage format (transform null to undefined for optional fields)
  const microcycle: PlanMicrocycle = {
    id: microcycleId,
    weeks,
    daysPerWeek: microcycleInput.daysPerWeek,
    pattern: microcycleInput.pattern.map(day => ({
      ...day,
      blocks: day.blocks.map(block => ({
        ...block,
        exercises: block.exercises.map(ex => ({
          ...ex,
          tempo: ex.tempo ?? undefined,
          cues: ex.cues ?? undefined,
          notes: ex.notes ?? undefined,
        })),
      })),
    })),
  };

  return {
    microcycle,
    calendar,
    workouts,
  };
}

/**
 * Get workout by day index
 */
export function getWorkoutByDayIndex(
  workouts: WorkoutInsert[],
  dayIndex: number
): WorkoutInsert | null {
  return workouts.find((w) => w.dayIndex === dayIndex) || null;
}

/**
 * Get workouts for a specific week
 */
export function getWorkoutsByWeek(
  workouts: WorkoutInsert[],
  weekIndex: number
): WorkoutInsert[] {
  return workouts.filter((w) => w.weekIndex === weekIndex);
}

/**
 * Generate workouts for a single week only (adaptive weekly generation)
 */
export function generateWeekWorkouts(
  microcycle: PlanMicrocycleInput,
  weekNumber: number, // 1-indexed (Week 1, Week 2, etc.)
  options: Omit<CalendarGenerationOptions, "weeks">
): WorkoutInsert[] {
  const { planId, userId, startDate, daysPerWeek, preferredDays } = options;
  const weekIndex = weekNumber - 1; // Convert to 0-indexed
  const workouts: WorkoutInsert[] = [];

  // Determine if this week is a deload (we'll pass total weeks context later)
  // For now, week 3 and week 7 are deloads
  const isDeloadWeek = weekNumber === 3 || weekNumber === 7;

  const trainingDaysOfWeek = calculateTrainingDays(daysPerWeek, preferredDays);
  const { pattern } = microcycle;

  // Calculate starting globalDayIndex based on previous weeks
  // Each week has daysPerWeek sessions
  const globalDayIndexStart = weekIndex * daysPerWeek;

  for (let sessionIndex = 0; sessionIndex < daysPerWeek; sessionIndex++) {
    const dayOfWeek = trainingDaysOfWeek[sessionIndex];

    // Calculate the actual calendar date
    const daysFromStart = weekIndex * 7 + dayOfWeek;
    const sessionDate = startDate ? shiftUtcDate(startDate, daysFromStart) : undefined;

    // Rotate through microcycle pattern
    const patternIndex = sessionIndex % pattern.length;
    const templateDay = pattern[patternIndex];

    const workoutId = createWorkoutId();

    // Build workout payload
    let blocks = templateDay.blocks.map((block) => ({
      type: convertBlockType(block.type),
      title: block.title,
      exercises: block.exercises.map((ex) => ({
        id: ex.id,
        name: ex.name,
        equipment: ex.equipment,
        sets: ex.sets,
        reps: ex.reps,
        ...(ex.tempo && { tempo: ex.tempo }),
        ...(ex.cues && { cues: ex.cues }),
        restSeconds: 90,
      })),
    }));

    // Apply deload modifications if needed
    if (isDeloadWeek) {
      blocks = applyDeloadModifications(blocks);
    }

    const payload: WorkoutPayload = {
      workoutId,
      focus: templateDay.focus,
      blocks,
    };

    const durationMinutes = blocks.reduce((sum, block) => {
      const blockDuration = block.exercises.reduce((total, ex) => total + ex.sets * 3, 0);
      return sum + blockDuration;
    }, 0);

    const workout: WorkoutInsert = {
      id: workoutId,
      planId,
      userId,
      microcycleDayId: `${microcycle.id}_day_${templateDay.dayIndex}`,
      dayIndex: globalDayIndexStart + sessionIndex,
      weekIndex,
      weekNumber,
      sessionDate: sessionDate ?? null,
      title: `Week ${weekNumber} - ${templateDay.focus}`,
      focus: templateDay.focus,
      kind: "strength",
      isDeload: isDeloadWeek,
      durationMinutes: Math.min(durationMinutes, 90),
      payload,
    };

    workouts.push(workout);
  }

  return workouts;
}

/**
 * Expand planner response for initial week only (adaptive planning)
 */
export function expandPlannerResponseInitialWeek(
  plannerResponse: PlannerResponse,
  options: Omit<CalendarGenerationOptions, "daysPerWeek" | "weeks"> & { totalWeeks: number }
): {
  microcycle: PlanMicrocycle;
  workouts: WorkoutInsert[];
} {
  const { microcycle: microcycleInput } = plannerResponse;
  const { totalWeeks } = options;

  const microcycleId = createMicrocycleId();

  const fullMicrocycleInput: PlanMicrocycleInput = {
    id: microcycleId,
    weeks: totalWeeks,
    daysPerWeek: microcycleInput.daysPerWeek,
    pattern: microcycleInput.pattern,
  };

  // Generate only Week 1 workouts
  const workouts = generateWeekWorkouts(fullMicrocycleInput, 1, {
    ...options,
    daysPerWeek: microcycleInput.daysPerWeek,
  });

  const microcycle: PlanMicrocycle = {
    id: microcycleId,
    weeks: totalWeeks,
    daysPerWeek: microcycleInput.daysPerWeek,
    pattern: microcycleInput.pattern.map(day => ({
      ...day,
      blocks: day.blocks.map(block => ({
        ...block,
        exercises: block.exercises.map(ex => ({
          ...ex,
          tempo: ex.tempo ?? undefined,
          cues: ex.cues ?? undefined,
          notes: ex.notes ?? undefined,
        })),
      })),
    })),
  };

  return {
    microcycle,
    workouts,
  };
}
