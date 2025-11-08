import type { PlannerResponse } from "@/lib/validation";

/**
 * Progressive Overload System
 *
 * Applies automatic progression to workout plans based on week number and phase.
 *
 * Progression strategies:
 * - Weeks 1-3 (Accumulation): Increase volume (reps/sets)
 * - Weeks 4-6 (Intensification): Maintain volume, note to increase intensity
 * - Week 7 (Deload): Reduce volume by 40%
 * - Week 8+ (Realization): Peak performance, reduced volume
 */

export type Phase = "accumulation" | "intensification" | "deload" | "realization";

export interface WeekProgression {
  weekNumber: number;
  phase: Phase;
  volumeMultiplier: number; // Multiplier for sets (e.g., 0.6 for deload, 1.0 for normal, 1.2 for volume block)
  repProgression: string; // Guidance for rep progression
  notes: string;
}

/**
 * Determine the training phase based on week number in typical 8-week block
 */
export function getPhaseForWeek(weekNumber: number, totalWeeks: number): Phase {
  const weekInCycle = ((weekNumber - 1) % 8) + 1; // Convert to 1-based week in 8-week cycle

  // For programs longer than 8 weeks, repeat the cycle
  if (weekInCycle <= 3) return "accumulation";
  if (weekInCycle <= 6) return "intensification";
  if (weekInCycle === 7) return "deload";
  return "realization"; // Week 8
}

/**
 * Get progression guidance for a specific week
 */
export function getWeekProgression(weekNumber: number, totalWeeks: number): WeekProgression {
  const phase = getPhaseForWeek(weekNumber, totalWeeks);

  switch (phase) {
    case "accumulation":
      return {
        weekNumber,
        phase,
        volumeMultiplier: 1.0 + (weekNumber - 1) * 0.1, // Week 1: 1.0, Week 2: 1.1, Week 3: 1.2
        repProgression: `Week ${weekNumber}: Add 1-2 reps to primary lifts if comfortable`,
        notes: "Building work capacity and movement quality",
      };

    case "intensification":
      return {
        weekNumber,
        phase,
        volumeMultiplier: 1.0,
        repProgression: "Maintain reps, focus on quality and control",
        notes: "Preparing for heavier loads - maintain volume while improving technique",
      };

    case "deload":
      return {
        weekNumber,
        phase,
        volumeMultiplier: 0.6, // 40% volume reduction
        repProgression: "Reduce reps by 20-30%, focus on recovery",
        notes: "Recovery week - allow body to adapt and supercompensate",
      };

    case "realization":
      return {
        weekNumber,
        phase,
        volumeMultiplier: 0.8, // Slight volume reduction for peak performance
        repProgression: "Express your fitness - challenging reps with excellent form",
        notes: "Peak performance week - test strength gains",
      };
  }
}

/**
 * Apply progressive overload to a microcycle pattern
 *
 * Takes the base template and modifies sets/reps based on week number
 */
export function applyProgressiveOverload(
  baseMicrocycle: PlannerResponse["microcycle"],
  weekNumber: number,
  totalWeeks: number
): PlannerResponse["microcycle"] {
  const progression = getWeekProgression(weekNumber, totalWeeks);

  // Deep clone the microcycle to avoid mutations
  const progressedMicrocycle = JSON.parse(JSON.stringify(baseMicrocycle));

  progressedMicrocycle.pattern.forEach((day) => {
    day.blocks.forEach((block) => {
      // Apply progression to strength and accessory blocks
      if (block.type === "strength" || block.type === "accessory") {
        block.exercises.forEach((exercise) => {
          // Apply volume multiplier to sets
          const baseSets = exercise.sets;
          const newSets = Math.max(1, Math.round(baseSets * progression.volumeMultiplier));
          exercise.sets = newSets;

          // Modify rep ranges based on phase
          const currentReps = exercise.reps;
          exercise.reps = adjustRepsForPhase(currentReps, progression.phase, weekNumber);

          // Add progression notes
          if (!exercise.notes) {
            exercise.notes = "";
          }

          // Add week-specific guidance
          if (progression.phase === "accumulation" && weekNumber > 1) {
            exercise.notes = `Week ${weekNumber}: Try to add 1-2 reps from last week. ${exercise.notes}`.trim();
          } else if (progression.phase === "intensification") {
            exercise.notes = `Focus on control and quality. ${exercise.notes}`.trim();
          } else if (progression.phase === "deload") {
            exercise.notes = `Recovery week - light and controlled. ${exercise.notes}`.trim();
          } else if (progression.phase === "realization") {
            exercise.notes = `Peak performance - push your limits safely. ${exercise.notes}`.trim();
          }
        });
      }

      // Adjust conditioning duration
      if (block.type === "conditioning") {
        if (progression.phase === "deload") {
          block.durationMinutes = Math.max(10, Math.round(block.durationMinutes * 0.7));
        }
      }
    });
  });

  return progressedMicrocycle;
}

/**
 * Adjust rep ranges based on training phase
 */
function adjustRepsForPhase(currentReps: string, phase: Phase, weekNumber: number): string {
  // Parse current reps (could be "8", "8-12", "10 min", etc.)
  const isTimeBasedOrString = currentReps.includes("min") || currentReps.includes("sec") || isNaN(parseInt(currentReps.split("-")[0]));

  if (isTimeBasedOrString) {
    // Don't modify time-based exercises
    return currentReps;
  }

  // Parse rep range
  const parts = currentReps.split("-");
  const hasRange = parts.length === 2;

  if (!hasRange) {
    // Single number like "8"
    const reps = parseInt(currentReps);

    switch (phase) {
      case "accumulation":
        // Gradual increase: Week 1: 8, Week 2: 9, Week 3: 10
        const weekInPhase = ((weekNumber - 1) % 8) + 1;
        return String(reps + (weekInPhase - 1));

      case "intensification":
        // Maintain reps, prepare for heavier loads
        return currentReps;

      case "deload":
        // Reduce reps by ~30%
        return String(Math.max(3, Math.round(reps * 0.7)));

      case "realization":
        // Slightly lower reps for max strength expression
        return String(Math.max(1, Math.round(reps * 0.8)));
    }
  } else {
    // Range like "8-12"
    const low = parseInt(parts[0]);
    const high = parseInt(parts[1]);

    switch (phase) {
      case "accumulation":
        // Progress within range, then increase range
        const weekInPhase = ((weekNumber - 1) % 8) + 1;
        const newLow = low + (weekInPhase - 1);
        const newHigh = high + (weekInPhase - 1);
        return `${newLow}-${newHigh}`;

      case "intensification":
        // Lower end of range for heavier loads
        return `${low}-${Math.round((low + high) / 2)}`;

      case "deload":
        // Reduce both ends
        return `${Math.max(3, Math.round(low * 0.7))}-${Math.round(high * 0.7)}`;

      case "realization":
        // Lower reps for strength test
        return `${Math.max(1, Math.round(low * 0.7))}-${Math.round(high * 0.8)}`;
    }
  }

  return currentReps; // Fallback
}

/**
 * Generate weekly summary based on phase
 */
export function getWeeklySummary(weekNumber: number, totalWeeks: number): string {
  const progression = getWeekProgression(weekNumber, totalWeeks);

  const phaseDescriptions = {
    accumulation: `Building volume and work capacity. Focus on consistent execution and gradually increasing training stress.`,
    intensification: `Preparing for heavier loads. Maintain quality and control while body adapts to increased demands.`,
    deload: `Recovery week. Reduced volume allows your body to adapt and supercompensate. Light and controlled work.`,
    realization: `Peak performance week. Test your strength gains with challenging but achievable loads.`,
  };

  return `Week ${weekNumber}/${totalWeeks} - ${progression.phase.toUpperCase()} Phase: ${phaseDescriptions[progression.phase]}`;
}

/**
 * Get RPE guidance for the week
 */
export function getRPEGuidance(weekNumber: number, totalWeeks: number): string {
  const phase = getPhaseForWeek(weekNumber, totalWeeks);

  const rpeGuidance = {
    accumulation: "Target RPE 7-8 on primary lifts. Build sustainable training habits.",
    intensification: "Target RPE 8-9 on primary lifts. Push intensity while maintaining quality.",
    deload: "Target RPE 6-7. Focus on recovery and movement quality.",
    realization: "Target RPE 9-10 on primary lifts. Express your peak fitness safely.",
  };

  return rpeGuidance[phase];
}
