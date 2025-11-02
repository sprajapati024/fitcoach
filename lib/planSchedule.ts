import { calculateTrainingDays, generateCalendar } from "@/lib/calendar";
import { shiftUtcDate } from "@/lib/tz";
import type { plans, workouts } from "@/drizzle/schema";
import type { PlanCalendar, PlanMicrocycle } from "@/drizzle/schema";
import type { PlanMicrocycleInput } from "@/lib/validation";
import type { WorkoutPayload } from "@/drizzle/schema";

type PlanRecord = typeof plans.$inferSelect;
type WorkoutRecord = typeof workouts.$inferSelect;
type WorkoutInsert = typeof workouts.$inferInsert;

interface BuildPlanScheduleArgs {
  plan: PlanRecord;
  startDate: string;
  workouts: WorkoutRecord[];
}

export interface WorkoutScheduleUpdate {
  id: string;
  sessionDate: string;
  weekIndex: number;
  dayIndex: number;
  isDeload: boolean;
}

export interface BuildPlanScheduleResult {
  calendar: PlanCalendar;
  workoutUpdates: WorkoutScheduleUpdate[];
  workoutInstances: WorkoutInsert[];
}

function getStartDayOfWeek(startDate: string): number {
  const start = new Date(`${startDate}T00:00:00Z`);
  if (Number.isNaN(start.getTime())) {
    throw new Error(`Invalid plan start date: ${startDate}`);
  }
  return start.getUTCDay();
}

function toWorkoutInsert(workout: WorkoutRecord, sessionDate: string): WorkoutInsert {
  const payload = workout.payload as WorkoutPayload;
  return {
    id: workout.id,
    planId: workout.planId,
    userId: workout.userId,
    microcycleDayId: workout.microcycleDayId,
    dayIndex: workout.dayIndex,
    weekIndex: workout.weekIndex,
    weekNumber: workout.weekNumber,
    sessionDate,
    title: workout.title,
    focus: workout.focus,
    kind: workout.kind,
    isDeload: workout.isDeload,
    durationMinutes: workout.durationMinutes,
    payload,
    createdAt: workout.createdAt,
    updatedAt: workout.updatedAt,
  };
}

export function buildPlanSchedule(args: BuildPlanScheduleArgs): BuildPlanScheduleResult {
  const { plan, startDate, workouts } = args;

  if (!startDate) {
    throw new Error("A start date is required to build the plan schedule");
  }

  if (!plan.microcycle) {
    throw new Error("Plan is missing microcycle data");
  }

  const microcycle = plan.microcycle as PlanMicrocycle | PlanMicrocycleInput;
  const startDayOfWeek = getStartDayOfWeek(startDate);
  const trainingDayIndices = calculateTrainingDays(plan.daysPerWeek, plan.preferredDays ?? []);
  const sessionOffsets = trainingDayIndices.map((dayIndex) => {
    const diff = dayIndex - startDayOfWeek;
    return diff >= 0 ? diff : diff + 7;
  });

  const workoutInstances = workouts.map((workout) => {
    const sessionIndex = plan.daysPerWeek > 0 ? workout.dayIndex % plan.daysPerWeek : 0;
    const offset = sessionOffsets[sessionIndex] ?? sessionOffsets[0] ?? 0;
    const daysFromStart = workout.weekIndex * 7 + offset;
    const sessionDate = shiftUtcDate(startDate, daysFromStart);
    return toWorkoutInsert(workout, sessionDate);
  });

  const calendar = generateCalendar(
    microcycle,
    workoutInstances,
    {
      planId: plan.id,
      userId: plan.userId,
      startDate,
      weeks: microcycle.weeks,
      daysPerWeek: microcycle.daysPerWeek,
      preferredDays: plan.preferredDays ?? [],
    }
  );

  const workoutUpdates: WorkoutScheduleUpdate[] = workoutInstances.map((instance) => ({
    id: instance.id!,
    sessionDate: instance.sessionDate!,
    weekIndex: instance.weekIndex,
    dayIndex: instance.dayIndex,
    isDeload: instance.isDeload ?? false,
  }));

  return {
    calendar,
    workoutUpdates,
    workoutInstances,
  };
}
