import { z } from "zod";
import { plannerResponseSchema, type PlannerResponse } from "@/lib/validation";
import { getExercise, isPcosSafe } from "@/lib/exerciseLibrary";

interface ProcessorOptions {
  hasPcos: boolean;
  targetMinutesPerSession: number;
  daysPerWeek: number;
  noHighImpact: boolean;
}

interface ProcessorResult {
  success: boolean;
  data?: PlannerResponse;
  warnings?: string[];
  error?: string;
}

/**
 * Post-process planner response to enforce PCOS guardrails and time budgets
 */
export function postProcessPlannerResponse(
  rawResponse: unknown,
  options: ProcessorOptions
): ProcessorResult {
  const warnings: string[] = [];

  // Validate against schema first
  const validationResult = plannerResponseSchema.safeParse(rawResponse);
  if (!validationResult.success) {
    return {
      success: false,
      error: `Schema validation failed: ${validationResult.error.message}`,
    };
  }

  let plannerResponse = validationResult.data;

  try {
    // Apply PCOS guardrails
    if (options.hasPcos) {
      plannerResponse = enforcePcosGuidelines(plannerResponse, warnings);
    }

    // Apply high-impact filter if needed
    if (options.noHighImpact) {
      plannerResponse = filterHighImpactExercises(plannerResponse, warnings);
    }

    // Enforce time budgets
    plannerResponse = enforceTimeBudgets(
      plannerResponse,
      options.targetMinutesPerSession,
      warnings
    );

    return {
      success: true,
      data: plannerResponse,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Post-processing failed",
      warnings,
    };
  }
}

/**
 * Enforce PCOS guidelines:
 * - Ensure 2-3x Zone-2 cardio per week (15-20 min each)
 * - Remove HIIT >60s
 * - Add recovery notes to each day
 */
function enforcePcosGuidelines(
  response: PlannerResponse,
  warnings: string[]
): PlannerResponse {
  const { microcycle } = response;
  const { pattern } = microcycle;

  // Count conditioning blocks (Zone-2)
  let conditioningCount = 0;
  pattern.forEach((day) => {
    const condBlocks = day.blocks.filter((b) => b.type === "conditioning");
    conditioningCount += condBlocks.length;
  });

  // If insufficient Zone-2, add to workout days
  if (conditioningCount < 2) {
    warnings.push(
      `PCOS: Added ${2 - conditioningCount} Zone-2 conditioning block(s) to meet minimum requirement`
    );

    let added = 0;
    for (let i = 0; i < pattern.length && added < 2 - conditioningCount; i++) {
      const day = pattern[i];
      const hasConditioning = day.blocks.some((b) => b.type === "conditioning");

      if (!hasConditioning) {
        // Add Zone-2 conditioning
        day.blocks.push({
          type: "conditioning",
          title: "Zone-2 Cardio (PCOS Protocol)",
          durationMinutes: 15,
          exercises: [
            {
              id: "bike_zone2",
              name: "Bike - Zone 2",
              equipment: "stationary bike",
              sets: 1,
              reps: "15 min",
              notes: "Easy conversational pace, 60-70% max HR",
            },
          ],
        });
        added++;
      }
    }
  }

  // Remove HIIT >60s or high-intensity conditioning
  pattern.forEach((day) => {
    day.blocks = day.blocks.map((block) => {
      if (block.type === "conditioning") {
        // Filter out high-intensity exercises
        block.exercises = block.exercises.filter((ex) => {
          const exerciseData = getExercise(ex.id);
          if (exerciseData && !exerciseData.isPcosFriendly) {
            warnings.push(`PCOS: Removed high-intensity exercise "${ex.name}"`);
            return false;
          }
          return true;
        });

        // Ensure at least one Zone-2 exercise remains
        if (block.exercises.length === 0) {
          block.exercises.push({
            id: "bike_zone2",
            name: "Bike - Zone 2",
            equipment: "stationary bike",
            sets: 1,
            reps: "15 min",
            notes: "Easy conversational pace",
          });
        }
      }
      return block;
    });
  });

  // Add recovery notes to each day if not present
  pattern.forEach((day) => {
    const hasRecovery = day.blocks.some((b) => b.type === "recovery");
    if (!hasRecovery) {
      day.blocks.push({
        type: "recovery",
        title: "PCOS Recovery Protocol",
        durationMinutes: 5,
        exercises: [
          {
            id: "recovery_notes",
            name: "Recovery & Stress Management",
            equipment: "none",
            sets: 1,
            reps: "1 note",
            notes:
              "Prioritize sleep, manage stress, stay hydrated. Light movement is better than missing workouts.",
          },
        ],
      });
    }
  });

  // Add PCOS safety note to review
  if (!response.review.safety.some((s) => s.includes("PCOS"))) {
    response.review.safety.push(
      "PCOS protocol active: Zone-2 cardio emphasized, high-impact exercises avoided, recovery prioritized"
    );
  }

  return response;
}

/**
 * Filter out high-impact exercises
 */
function filterHighImpactExercises(
  response: PlannerResponse,
  warnings: string[]
): PlannerResponse {
  const { microcycle } = response;
  const { pattern } = microcycle;

  pattern.forEach((day) => {
    day.blocks = day.blocks.map((block) => {
      if (block.type === "strength" || block.type === "accessory") {
        const originalCount = block.exercises.length;
        block.exercises = block.exercises.filter((ex) => {
          const exerciseData = getExercise(ex.id);
          if (exerciseData && exerciseData.impact === "high") {
            warnings.push(`Removed high-impact exercise: "${ex.name}"`);
            return false;
          }
          return true;
        });

        // If we filtered everything, keep at least one low-impact exercise
        if (block.exercises.length === 0 && originalCount > 0) {
          block.exercises.push({
            id: "db_bench",
            name: "Dumbbell Bench Press",
            equipment: "dumbbells",
            sets: 3,
            reps: "8-12",
            notes: "Low-impact alternative",
          });
        }
      }
      return block;
    });
  });

  return response;
}

/**
 * Enforce time budgets per session
 * Estimate: (sets × (working time + rest)) + warmup + conditioning ≤ target minutes
 */
function enforceTimeBudgets(
  response: PlannerResponse,
  targetMinutes: number,
  warnings: string[]
): PlannerResponse {
  const { microcycle } = response;
  const { pattern } = microcycle;

  pattern.forEach((day, dayIndex) => {
    // Calculate total time for this day
    let totalMinutes = 0;
    day.blocks.forEach((block) => {
      totalMinutes += block.durationMinutes;
    });

    // If over budget, trim accessory sets
    if (totalMinutes > targetMinutes) {
      const overage = totalMinutes - targetMinutes;
      warnings.push(
        `Day ${dayIndex + 1} exceeded time budget by ${overage}min. Trimming accessory volume.`
      );

      // Find accessory blocks and reduce sets or duration
      const accessoryBlocks = day.blocks.filter((b) => b.type === "accessory");
      let trimmed = 0;

      for (const block of accessoryBlocks) {
        if (trimmed >= overage) break;

        // Reduce block duration
        const reduction = Math.min(5, overage - trimmed);
        block.durationMinutes = Math.max(10, block.durationMinutes - reduction);
        trimmed += reduction;

        // Also reduce sets if needed
        block.exercises.forEach((ex) => {
          if (ex.sets > 2 && trimmed < overage) {
            ex.sets = Math.max(2, ex.sets - 1);
            trimmed += 2; // Assume ~2 min per set
          }
        });
      }
    }
  });

  return response;
}

/**
 * Validate that a planner response meets all safety requirements
 */
export function validatePlanSafety(response: PlannerResponse, options: ProcessorOptions): {
  isValid: boolean;
  violations: string[];
} {
  const violations: string[] = [];
  const { microcycle } = response;
  const { pattern } = microcycle;

  // Check PCOS requirements
  if (options.hasPcos) {
    const conditioningCount = pattern.reduce((count, day) => {
      return count + day.blocks.filter((b) => b.type === "conditioning").length;
    }, 0);

    if (conditioningCount < 2) {
      violations.push(`PCOS requires 2-3 Zone-2 sessions/week, found ${conditioningCount}`);
    }

    // Check for high-impact exercises
    pattern.forEach((day, dayIndex) => {
      day.blocks.forEach((block) => {
        block.exercises.forEach((ex) => {
          if (!isPcosSafe(ex.id)) {
            violations.push(
              `PCOS violation: High-impact exercise "${ex.name}" on day ${dayIndex + 1}`
            );
          }
        });
      });
    });
  }

  // Check time budgets
  pattern.forEach((day, dayIndex) => {
    const totalMinutes = day.blocks.reduce((sum, block) => sum + block.durationMinutes, 0);
    if (totalMinutes > options.targetMinutesPerSession + 10) {
      violations.push(
        `Day ${dayIndex + 1} exceeds time budget: ${totalMinutes}min > ${options.targetMinutesPerSession}min`
      );
    }
  });

  return {
    isValid: violations.length === 0,
    violations,
  };
}
