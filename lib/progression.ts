import { type PlanMicrocycleInput, planMicrocycleSchema } from "@/lib/validation";

export interface LoggedSet {
  weightKg: number;
  reps: number;
  rpe?: number;
}

export interface WeeklyLogSummary {
  weekIndex: number;
  sets: LoggedSet[];
  zone2Minutes?: number;
}

export interface ProgressionTargetOutput {
  weekIndex: number;
  totalLoadKg: number;
  zone2Minutes: number;
  focusNotes: string;
  isDeload: boolean;
}

function computeLoadKg(sets: LoggedSet[]) {
  return Math.round(
    sets.reduce((sum, set) => {
      if (Number.isNaN(set.weightKg) || Number.isNaN(set.reps)) {
        return sum;
      }
      return sum + set.weightKg * set.reps;
    }, 0),
  );
}

function aggregateLogs(logs: WeeklyLogSummary[]) {
  const map = new Map<number, { load: number; zone: number }>();

  logs.forEach((log) => {
    const current = map.get(log.weekIndex) ?? { load: 0, zone: 0 };
    current.load += computeLoadKg(log.sets);
    if (typeof log.zone2Minutes === "number") {
      current.zone += log.zone2Minutes;
    }
    map.set(log.weekIndex, current);
  });

  return map;
}

function conditioningMinutesFromPlan(plan: PlanMicrocycleInput) {
  const minutes = plan.pattern.reduce((total, day) => {
    const conditioning = day.blocks
      .filter((block) => block.type === "conditioning")
      .reduce((sum, block) => sum + block.durationMinutes, 0);
    return total + conditioning;
  }, 0);

  const sessions = plan.pattern.filter((day) =>
    day.blocks.some((block) => block.type === "conditioning"),
  ).length;

  // Guardrail: ensure at least two conditioning exposures per week, 90 minutes total.
  const minimumSessions = Math.max(2, sessions);
  const targetedMinutes = Math.max(90, minutes);

  return {
    perWeekMinutes: Math.max(targetedMinutes, minimumSessions * 30),
    sessionCount: minimumSessions,
  };
}

function determineDeloadWeeks(totalWeeks: number) {
  if (totalWeeks >= 10) {
    return new Set([3, 7]);
  }
  return new Set([3]);
}

export function computeProgressionTargets(params: {
  plan: PlanMicrocycleInput;
  totalWeeks: number;
  logs: WeeklyLogSummary[];
}): ProgressionTargetOutput[] {
  const parsedPlan = planMicrocycleSchema.parse(params.plan);
  const { totalWeeks, logs } = params;
  const loadByWeek = aggregateLogs(logs);
  const deloadWeeks = determineDeloadWeeks(totalWeeks);
  const { perWeekMinutes } = conditioningMinutesFromPlan(parsedPlan);

  const weeks: ProgressionTargetOutput[] = [];
  const sortedLoggedWeeks = Array.from(loadByWeek.keys()).sort((a, b) => a - b);
  const lastLoggedWeek = sortedLoggedWeeks[sortedLoggedWeeks.length - 1] ?? -1;
  let rollingLoad = lastLoggedWeek >= 0 ? loadByWeek.get(lastLoggedWeek)?.load ?? 3200 : 3200;

  for (let weekIndex = 0; weekIndex < totalWeeks; weekIndex += 1) {
    const hasActual = loadByWeek.has(weekIndex);
    const isDeload = deloadWeeks.has(weekIndex);

    if (hasActual) {
      rollingLoad = loadByWeek.get(weekIndex)?.load ?? rollingLoad;
    } else if (weekIndex > lastLoggedWeek) {
      if (isDeload) {
        rollingLoad = Math.round(rollingLoad * 0.82);
      } else {
        rollingLoad = Math.round(rollingLoad * 1.025);
      }
    }

    const focusNotes = hasActual
      ? "Logged week — targets based on recorded sessions."
      : isDeload
        ? "Deload week: reduce loads ~18% and emphasize technique."
        : "Progressive week: hold quality, add ~2% load or 1 rep where smooth.";

    weeks.push({
      weekIndex,
      totalLoadKg: Math.max(rollingLoad, 2500),
      zone2Minutes: perWeekMinutes,
      focusNotes,
      isDeload,
    });
  }

  return weeks;
}
