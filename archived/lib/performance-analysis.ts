import { db } from "@/lib/db";
import {
  workoutLogs,
  workoutLogSets,
  workouts,
  type WeekPerformanceMetrics,
  type PeriodizationBlock,
} from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Analyze workout performance for a specific week
 */
export async function analyzeWeekPerformance(
  planId: string,
  weekNumber: number
): Promise<WeekPerformanceMetrics> {
  // Get all scheduled workouts for this week
  const scheduledWorkouts = await db
    .select()
    .from(workouts)
    .where(and(eq(workouts.planId, planId), eq(workouts.weekNumber, weekNumber)));

  if (scheduledWorkouts.length === 0) {
    throw new Error(`No workouts found for plan ${planId}, week ${weekNumber}`);
  }

  // Get all logged workouts for this week
  const workoutIds = scheduledWorkouts.map((w) => w.id);
  const loggedWorkouts = await db
    .select()
    .from(workoutLogs)
    .where(and(eq(workoutLogs.planId, planId)));

  // Filter logs that match our week's workout IDs
  const weekLogs = loggedWorkouts.filter((log) => workoutIds.includes(log.workoutId));

  // Get all sets for these logged workouts
  const logIds = weekLogs.map((log) => log.id);
  let allSets: (typeof workoutLogSets.$inferSelect)[] = [];

  if (logIds.length > 0) {
    allSets = await db.select().from(workoutLogSets).where(
      // Use OR condition for multiple log IDs
      eq(workoutLogSets.logId, logIds[0])
    );

    // If more than one log, fetch sets for each
    if (logIds.length > 1) {
      for (let i = 1; i < logIds.length; i++) {
        const moreSets = await db
          .select()
          .from(workoutLogSets)
          .where(eq(workoutLogSets.logId, logIds[i]));
        allSets = [...allSets, ...moreSets];
      }
    }
  }

  // Calculate completion rate
  const completionRate =
    scheduledWorkouts.length > 0
      ? (weekLogs.length / scheduledWorkouts.length) * 100
      : 0;

  // Calculate average RPE
  const setsWithRPE = allSets.filter((set) => set.rpe !== null);
  const avgRPE =
    setsWithRPE.length > 0
      ? setsWithRPE.reduce((sum, set) => sum + Number(set.rpe), 0) / setsWithRPE.length
      : 0;

  // Calculate total volume (sets × reps)
  const totalVolume = allSets.reduce((sum, set) => sum + set.reps, 0);

  // Calculate total tonnage (weight × reps)
  const totalTonnage = allSets.reduce(
    (sum, set) => sum + Number(set.weightKg) * set.reps,
    0
  );

  // Build exercise breakdown
  const exerciseBreakdown: Record<
    string,
    { sets: number; reps: number; avgWeight: number }
  > = {};

  for (const set of allSets) {
    if (!exerciseBreakdown[set.exerciseId]) {
      exerciseBreakdown[set.exerciseId] = {
        sets: 0,
        reps: 0,
        avgWeight: 0,
      };
    }

    exerciseBreakdown[set.exerciseId].sets += 1;
    exerciseBreakdown[set.exerciseId].reps += set.reps;
    exerciseBreakdown[set.exerciseId].avgWeight += Number(set.weightKg);
  }

  // Calculate average weight per exercise
  for (const exerciseId in exerciseBreakdown) {
    const ex = exerciseBreakdown[exerciseId];
    ex.avgWeight = ex.sets > 0 ? ex.avgWeight / ex.sets : 0;
  }

  return {
    completionRate: Math.round(completionRate * 100) / 100,
    avgRPE: Math.round(avgRPE * 100) / 100,
    totalVolume,
    totalTonnage: Math.round(totalTonnage * 100) / 100,
    exerciseBreakdown,
  };
}

/**
 * Progression recommendation result
 */
export interface ProgressionRecommendation {
  shouldProgress: boolean;
  shouldMaintain: boolean;
  shouldRegress: boolean;
  reasoning: string;
  recommendations: string[];
  confidenceScore: number; // 0-1 scale
}

/**
 * Generate progression recommendations based on performance and periodization phase
 */
export function generateProgressionRecommendations(
  currentPerformance: WeekPerformanceMetrics,
  previousPerformance: WeekPerformanceMetrics | null,
  currentBlock: PeriodizationBlock
): ProgressionRecommendation {
  const recommendations: string[] = [];
  let reasoning = "";
  let shouldProgress = false;
  let shouldMaintain = false;
  let shouldRegress = false;
  let confidenceScore = 0.5;

  // Factor 1: Completion rate
  const completionRate = currentPerformance.completionRate;
  const highCompletion = completionRate >= 80;
  const moderateCompletion = completionRate >= 60 && completionRate < 80;
  const lowCompletion = completionRate < 60;

  // Factor 2: RPE analysis
  const targetRPE = currentBlock.rpeTargets.strength;
  const avgRPE = currentPerformance.avgRPE;
  const rpeUnderTarget = avgRPE > 0 && avgRPE < targetRPE - 1;
  const rpeOnTarget = avgRPE >= targetRPE - 1 && avgRPE <= targetRPE + 1;
  const rpeOverTarget = avgRPE > targetRPE + 1;

  // Factor 3: Volume trend (if we have previous data)
  let volumeIncreased = false;
  let volumeDecreased = false;
  if (previousPerformance) {
    const volumeChange =
      ((currentPerformance.totalVolume - previousPerformance.totalVolume) /
        previousPerformance.totalVolume) *
      100;
    volumeIncreased = volumeChange > 5;
    volumeDecreased = volumeChange < -5;
  }

  // Decision logic based on block type
  if (currentBlock.blockType === "deload") {
    // Deload week - maintain or prepare for next block
    shouldMaintain = true;
    reasoning = "Deload week completed. Focus on recovery and preparation for next training block.";
    recommendations.push("Maintain current training loads");
    recommendations.push("Ensure adequate recovery before next block");
    if (lowCompletion) {
      recommendations.push("Consider adding an extra rest day before resuming");
    }
    confidenceScore = 0.9;
  } else if (currentBlock.blockType === "accumulation") {
    // Accumulation phase - focus on volume
    if (highCompletion && rpeUnderTarget) {
      shouldProgress = true;
      reasoning =
        "High completion rate with RPE below target indicates capacity for increased volume or load.";
      recommendations.push("Increase working sets by 1-2 sets per exercise");
      recommendations.push("Consider adding 2.5-5kg to primary lifts");
      if (volumeIncreased) {
        recommendations.push("Volume is trending up - excellent progress");
      }
      confidenceScore = 0.85;
    } else if (highCompletion && rpeOnTarget) {
      shouldMaintain = true;
      reasoning = "Hitting targets consistently. Continue current progression.";
      recommendations.push("Maintain current volume and intensity");
      recommendations.push("Focus on technique refinement");
      confidenceScore = 0.8;
    } else if (moderateCompletion || rpeOverTarget) {
      shouldMaintain = true;
      reasoning =
        "Moderate completion or high RPE suggests current load is appropriate.";
      recommendations.push("Maintain current training load");
      recommendations.push("Monitor recovery closely");
      if (rpeOverTarget) {
        recommendations.push("Consider reducing 1-2 sets if RPE remains high");
      }
      confidenceScore = 0.7;
    } else if (lowCompletion) {
      shouldRegress = true;
      reasoning = "Low completion rate indicates need to reduce training stress.";
      recommendations.push("Reduce volume by 10-15%");
      recommendations.push("Assess recovery and stress levels");
      recommendations.push("Consider scheduling an early deload");
      confidenceScore = 0.75;
    }
  } else if (currentBlock.blockType === "intensification") {
    // Intensification phase - focus on load progression
    if (highCompletion && rpeUnderTarget) {
      shouldProgress = true;
      reasoning =
        "Handling current intensification loads well. Ready for load increase.";
      recommendations.push("Increase load by 2.5-5% on primary lifts");
      recommendations.push("Maintain current set/rep scheme");
      if (!volumeDecreased) {
        recommendations.push("Volume holding steady - good indicator for progression");
      }
      confidenceScore = 0.85;
    } else if (highCompletion && rpeOnTarget) {
      shouldMaintain = true;
      reasoning = "Meeting intensity targets. Continue building strength.";
      recommendations.push("Maintain current loads");
      recommendations.push("Focus on bar speed and technique under heavy loads");
      confidenceScore = 0.8;
    } else if (rpeOverTarget || moderateCompletion) {
      shouldMaintain = true;
      reasoning = "Intensity is challenging. Consolidate current adaptations.";
      recommendations.push("Hold loads for one more week");
      recommendations.push("Ensure adequate rest between sessions");
      confidenceScore = 0.7;
    } else if (lowCompletion) {
      shouldRegress = true;
      reasoning = "Struggling with current intensity. Reduce load to build back up.";
      recommendations.push("Reduce loads by 5-10%");
      recommendations.push("May need to extend accumulation phase");
      recommendations.push("Check sleep, nutrition, and stress");
      confidenceScore = 0.8;
    }
  } else if (currentBlock.blockType === "realization") {
    // Realization/Peak phase - test maximal performance
    if (highCompletion && rpeOnTarget) {
      shouldProgress = true;
      reasoning = "Peaking successfully. Ready for performance tests.";
      recommendations.push("Attempt planned performance tests or PRs");
      recommendations.push("Maintain current approach");
      confidenceScore = 0.9;
    } else if (rpeOverTarget) {
      shouldMaintain = true;
      reasoning = "Peak loads are maximal. Focus on recovery between attempts.";
      recommendations.push("Ensure 48-72hr rest before peak efforts");
      recommendations.push("Reduce accessory work if needed");
      confidenceScore = 0.75;
    } else {
      shouldMaintain = true;
      reasoning = "Peaking phase in progress. Trust the process.";
      recommendations.push("Follow planned peak protocol");
      recommendations.push("Prioritize recovery and mental preparation");
      confidenceScore = 0.7;
    }
  }

  return {
    shouldProgress,
    shouldMaintain,
    shouldRegress,
    reasoning,
    recommendations,
    confidenceScore,
  };
}

/**
 * Create a concise summary for AI prompt (token-efficient)
 */
export function summarizeWeekForAI(
  performance: WeekPerformanceMetrics,
  recommendations: ProgressionRecommendation,
  weekNumber: number,
  blockType: PeriodizationBlock["blockType"]
): string {
  const summary = [
    `Week ${weekNumber} (${blockType} phase):`,
    `- Completion: ${performance.completionRate.toFixed(0)}%`,
    `- Avg RPE: ${performance.avgRPE.toFixed(1)}`,
    `- Volume: ${performance.totalVolume} reps`,
    `- Tonnage: ${performance.totalTonnage.toFixed(0)}kg`,
    ``,
    `Analysis: ${recommendations.reasoning}`,
    ``,
    `Key recommendations:`,
    ...recommendations.recommendations.map((rec) => `- ${rec}`),
  ];

  return summary.join("\n");
}

/**
 * Calculate week-over-week changes for detailed analysis
 */
export function calculateWeekOverWeekChanges(
  current: WeekPerformanceMetrics,
  previous: WeekPerformanceMetrics | null
): {
  completionRateChange: number;
  rpeChange: number;
  volumeChange: number;
  tonnageChange: number;
} {
  if (!previous) {
    return {
      completionRateChange: 0,
      rpeChange: 0,
      volumeChange: 0,
      tonnageChange: 0,
    };
  }

  return {
    completionRateChange: current.completionRate - previous.completionRate,
    rpeChange: current.avgRPE - previous.avgRPE,
    volumeChange:
      previous.totalVolume > 0
        ? ((current.totalVolume - previous.totalVolume) / previous.totalVolume) * 100
        : 0,
    tonnageChange:
      previous.totalTonnage > 0
        ? ((current.totalTonnage - previous.totalTonnage) / previous.totalTonnage) *
          100
        : 0,
  };
}

/**
 * Determine if a week is ready for progression analysis
 * (i.e., user has completed enough workouts)
 */
export function isWeekReadyForAnalysis(
  performance: WeekPerformanceMetrics,
  minimumCompletionRate: number = 50
): boolean {
  return performance.completionRate >= minimumCompletionRate;
}

/**
 * Transform week performance data into format expected by adaptive planner
 * This bridges the existing performance analysis with the new adaptive agent
 */
export async function preparePerformanceDataForAdaptivePlanner(
  planId: string,
  weekNumber: number
): Promise<{
  workouts: Array<{
    focus: string;
    completedSets: number;
    targetSets: number;
    avgRPE: number;
    notes?: string;
  }>;
  overallAdherence: number;
  avgRPEAcrossWeek: number;
  userFeedback?: string;
}> {
  // Get all scheduled workouts for this week
  const scheduledWorkouts = await db
    .select()
    .from(workouts)
    .where(and(eq(workouts.planId, planId), eq(workouts.weekNumber, weekNumber)));

  // Get all logged workouts for this week
  const workoutIds = scheduledWorkouts.map((w) => w.id);
  const loggedWorkouts = await db
    .select()
    .from(workoutLogs)
    .where(and(eq(workoutLogs.planId, planId)));

  const weekLogs = loggedWorkouts.filter((log) => workoutIds.includes(log.workoutId));

  // Get performance metrics
  const performance = await analyzeWeekPerformance(planId, weekNumber);

  // Build workout-by-workout breakdown
  const workoutData = await Promise.all(
    scheduledWorkouts.map(async (workout) => {
      const log = weekLogs.find((l) => l.workoutId === workout.id);

      // Count target sets from workout payload
      const payload = workout.payload as { blocks: Array<{ exercises: Array<{ sets: number }> }> };
      const targetSets = payload.blocks.reduce(
        (sum, block) => sum + block.exercises.reduce((s, ex) => s + ex.sets, 0),
        0
      );

      let completedSets = 0;
      let avgRPE = 0;

      if (log) {
        // Get sets for this log
        const sets = await db
          .select()
          .from(workoutLogSets)
          .where(eq(workoutLogSets.logId, log.id));

        completedSets = sets.length;

        const setsWithRPE = sets.filter((s) => s.rpe !== null);
        avgRPE =
          setsWithRPE.length > 0
            ? setsWithRPE.reduce((sum, s) => sum + Number(s.rpe), 0) / setsWithRPE.length
            : 0;
      }

      return {
        focus: workout.focus,
        completedSets,
        targetSets,
        avgRPE: Math.round(avgRPE * 10) / 10,
        notes: log?.notes || undefined,
      };
    })
  );

  return {
    workouts: workoutData,
    overallAdherence: performance.completionRate / 100, // Convert percentage to 0-1
    avgRPEAcrossWeek: performance.avgRPE,
    userFeedback: undefined, // Can be extended later to pull from user notes
  };
}
