import { type PlanMicrocycleInput, planMicrocycleSchema } from "@/lib/validation";
import type { PeriodizationBlock } from "@/drizzle/schema";
import type { ProgressionRecommendation } from "@/lib/performance-analysis";

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

// ============================================================================
// ENHANCED PROGRESSION LOGIC FOR ADAPTIVE PLANNING
// ============================================================================

/**
 * Exercise-specific progression recommendation
 */
export interface ExerciseProgression {
  exerciseId: string;
  currentWeight: number;
  currentReps: number;
  currentRPE: number;
  recommendedWeight: number;
  recommendedReps: number | string;
  targetRPE: number;
  progressionType: "increase" | "maintain" | "decrease";
  notes: string;
}

/**
 * Calculate exercise-specific progression based on recent logs and periodization phase
 */
export function calculateExerciseProgression(
  exerciseId: string,
  recentLogs: LoggedSet[],
  periodizationBlock: PeriodizationBlock,
  performanceAnalysis: ProgressionRecommendation
): ExerciseProgression {
  if (recentLogs.length === 0) {
    // No data - return baseline recommendations based on periodization block
    return {
      exerciseId,
      currentWeight: 0,
      currentReps: 0,
      currentRPE: 0,
      recommendedWeight: 0,
      recommendedReps: periodizationBlock.repRanges.strength,
      targetRPE: periodizationBlock.rpeTargets.strength,
      progressionType: "maintain",
      notes: "No previous data. Start with appropriate working weight for target reps and RPE.",
    };
  }

  // Find the best set (highest weight × reps product)
  const bestSet = recentLogs.reduce((best, current) => {
    const currentProduct = current.weightKg * current.reps;
    const bestProduct = best.weightKg * best.reps;
    return currentProduct > bestProduct ? current : best;
  });

  const currentWeight = bestSet.weightKg;
  const currentReps = bestSet.reps;
  const currentRPE = bestSet.rpe ?? 0;

  // Parse target rep range
  const repRangeStr = periodizationBlock.repRanges.strength;
  const repRangeParts = repRangeStr.split("-").map((s) => parseInt(s.trim(), 10));
  const targetRepMin = repRangeParts[0] || 8;
  const targetRepMax = repRangeParts[1] || 12;
  const targetRPE = periodizationBlock.rpeTargets.strength;

  let recommendedWeight = currentWeight;
  let recommendedReps: number | string = repRangeStr;
  let progressionType: "increase" | "maintain" | "decrease" = "maintain";
  let notes = "";

  // Determine progression based on performance analysis
  if (performanceAnalysis.shouldProgress) {
    // User is ready to progress
    if (currentReps >= targetRepMax) {
      // Hit top of rep range - increase weight
      const weightIncrease = currentWeight >= 60 ? 2.5 : 5; // Smaller jumps for lighter weights
      recommendedWeight = currentWeight + weightIncrease;
      recommendedReps = targetRepMin; // Reset to bottom of rep range
      progressionType = "increase";
      notes = `Increase weight by ${weightIncrease}kg. You hit ${currentReps} reps, which is at/above the target range.`;
    } else if (currentRPE < targetRPE - 1.5) {
      // RPE significantly below target - can add weight
      recommendedWeight = currentWeight + 2.5;
      progressionType = "increase";
      notes = `RPE (${currentRPE.toFixed(1)}) is below target (${targetRPE}). Increase weight while maintaining reps.`;
    } else {
      // In middle of rep range - add reps
      progressionType = "increase";
      notes = `Continue progressing reps toward ${targetRepMax}. Add 1-2 reps per set when possible.`;
    }
  } else if (performanceAnalysis.shouldRegress) {
    // User is struggling - reduce load
    const weightDecrease = currentWeight * 0.1; // 10% reduction
    recommendedWeight = Math.round((currentWeight - weightDecrease) * 2) / 2; // Round to nearest 0.5kg
    progressionType = "decrease";
    notes = `Reduce weight by ~10% to consolidate technique and build back up. Focus on quality reps.`;
  } else {
    // Maintain current approach
    progressionType = "maintain";
    notes = `Maintain current weights and rep ranges. Focus on consistency and technique.`;
  }

  // Apply deload modifications if in deload block
  if (periodizationBlock.blockType === "deload") {
    recommendedWeight = Math.round(currentWeight * 0.85 * 2) / 2; // 15% reduction
    progressionType = "decrease";
    notes = "Deload week: reduce weight by 15% and focus on recovery and movement quality.";
  }

  return {
    exerciseId,
    currentWeight,
    currentReps,
    currentRPE,
    recommendedWeight: Math.max(recommendedWeight, 0),
    recommendedReps,
    targetRPE,
    progressionType,
    notes,
  };
}

/**
 * Apply deload modifications to a progression target
 * Enhanced version with configurable volume and load reduction
 */
export function applyDeloadModifications(
  baseProgression: ProgressionTargetOutput,
  volumeReduction: number = 0.4,
  loadReduction: number = 0.15
): ProgressionTargetOutput {
  return {
    ...baseProgression,
    totalLoadKg: Math.round(baseProgression.totalLoadKg * (1 - loadReduction)),
    zone2Minutes: Math.round(baseProgression.zone2Minutes * (1 - volumeReduction)),
    focusNotes: `Deload: ${Math.round(volumeReduction * 100)}% volume reduction, ${Math.round(loadReduction * 100)}% load reduction. Emphasize recovery and technique.`,
    isDeload: true,
  };
}

/**
 * Volume landmark for tracking progression over time
 */
export interface VolumeLandmark {
  weekIndex: number;
  volumeLandmark: number;
  intensityLandmark: number;
  avgRPE: number;
}

/**
 * Calculate volume and intensity landmarks over time
 * Useful for visualizing progression trends
 */
export function calculateWeeklyVolumeLandmarks(
  logs: WeeklyLogSummary[],
  targetWeeks: number
): VolumeLandmark[] {
  const landmarks: VolumeLandmark[] = [];

  // Group logs by week
  const weekMap = new Map<number, LoggedSet[]>();
  logs.forEach((log) => {
    const existing = weekMap.get(log.weekIndex) || [];
    weekMap.set(log.weekIndex, [...existing, ...log.sets]);
  });

  // Calculate landmarks for each week
  for (let weekIndex = 0; weekIndex < targetWeeks; weekIndex++) {
    const weekSets = weekMap.get(weekIndex) || [];

    if (weekSets.length === 0) {
      // No data for this week
      landmarks.push({
        weekIndex,
        volumeLandmark: 0,
        intensityLandmark: 0,
        avgRPE: 0,
      });
      continue;
    }

    // Calculate total volume (reps)
    const totalVolume = weekSets.reduce((sum, set) => sum + set.reps, 0);

    // Calculate average intensity (weight)
    const avgWeight =
      weekSets.reduce((sum, set) => sum + set.weightKg, 0) / weekSets.length;

    // Calculate average RPE
    const setsWithRPE = weekSets.filter((set) => set.rpe !== undefined && set.rpe > 0);
    const avgRPE =
      setsWithRPE.length > 0
        ? setsWithRPE.reduce((sum, set) => sum + (set.rpe || 0), 0) / setsWithRPE.length
        : 0;

    landmarks.push({
      weekIndex,
      volumeLandmark: totalVolume,
      intensityLandmark: Math.round(avgWeight * 10) / 10,
      avgRPE: Math.round(avgRPE * 10) / 10,
    });
  }

  return landmarks;
}

/**
 * Estimate 1RM from a logged set using Epley formula
 */
export function estimateOneRepMax(weight: number, reps: number, rpe?: number): number {
  // If RPE is provided, adjust reps to equivalent @RPE 10
  let adjustedReps = reps;
  if (rpe !== undefined) {
    const repsInReserve = 10 - rpe;
    adjustedReps = reps + repsInReserve;
  }

  // Epley formula: 1RM = weight × (1 + reps/30)
  if (adjustedReps === 1) {
    return weight;
  }

  return Math.round(weight * (1 + adjustedReps / 30) * 10) / 10;
}

/**
 * Calculate recommended weight for a target rep range based on estimated 1RM
 */
export function calculateWeightForReps(
  estimatedOneRM: number,
  targetReps: number,
  targetRPE: number = 8
): number {
  // Calculate reps in reserve from RPE
  const repsInReserve = 10 - targetRPE;
  const totalReps = targetReps + repsInReserve;

  // Reverse Epley formula: weight = 1RM / (1 + reps/30)
  const weight = estimatedOneRM / (1 + totalReps / 30);

  // Round to nearest 2.5kg increment
  return Math.round(weight / 2.5) * 2.5;
}
