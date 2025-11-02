import type { PeriodizationFramework, PeriodizationBlock } from "@/drizzle/schema";

/**
 * Block type guidelines for training phases
 */
export const BLOCK_GUIDELINES = {
  accumulation: {
    volumeGuidelines: "High volume to build work capacity and muscle",
    intensityGuidelines: "Moderate intensity to allow for recovery",
    repRangeGuidelines: "Strength: 8-12 reps, Accessory: 12-15 reps",
    rpeGuidelines: "Strength: RPE 7-8, Accessory: RPE 7-8",
    description: "Build volume tolerance and movement proficiency",
  },
  intensification: {
    volumeGuidelines: "Moderate volume with focus on quality",
    intensityGuidelines: "High intensity to build strength",
    repRangeGuidelines: "Strength: 4-8 reps, Accessory: 8-12 reps",
    rpeGuidelines: "Strength: RPE 8-9, Accessory: RPE 8",
    description: "Increase load and intensity for strength gains",
  },
  deload: {
    volumeGuidelines: "Low volume (40% reduction) for recovery",
    intensityGuidelines: "Moderate intensity (15% load reduction)",
    repRangeGuidelines: "Strength: 6-8 reps, Accessory: 8-10 reps",
    rpeGuidelines: "Strength: RPE 6-7, Accessory: RPE 6",
    description: "Active recovery to dissipate fatigue and prepare for next block",
  },
  realization: {
    volumeGuidelines: "Low volume to maintain freshness",
    intensityGuidelines: "Peak intensity for performance",
    repRangeGuidelines: "Strength: 3-6 reps, Accessory: 6-8 reps",
    rpeGuidelines: "Strength: RPE 9+, Accessory: RPE 8",
    description: "Peak performance phase with maximum loads",
  },
} as const;

/**
 * Generate periodization framework based on experience level and goals
 */
export function generatePeriodizationFramework(
  totalWeeks: number,
  experienceLevel: "beginner" | "intermediate",
  goalBias: "strength" | "balanced" | "hypertrophy" | "fat_loss"
): PeriodizationFramework {
  if (experienceLevel === "beginner") {
    return generateBeginnerFramework(totalWeeks, goalBias);
  }
  return generateIntermediateFramework(totalWeeks, goalBias);
}

/**
 * Beginner framework: Simple linear progression with deload weeks
 */
function generateBeginnerFramework(
  totalWeeks: number,
  goalBias: "strength" | "balanced" | "hypertrophy" | "fat_loss"
): PeriodizationFramework {
  const blocks: PeriodizationBlock[] = [];
  let blockNumber = 1;
  let currentWeek = 1;

  // Determine deload weeks (week 4, week 8, etc.)
  const deloadWeeks = getDeloadWeeks(totalWeeks);

  while (currentWeek <= totalWeeks) {
    // Check if this is a deload week
    if (deloadWeeks.includes(currentWeek)) {
      blocks.push({
        blockNumber: blockNumber++,
        blockType: "deload",
        startWeek: currentWeek,
        endWeek: currentWeek,
        volumeTarget: "low",
        intensityTarget: "moderate",
        repRanges: {
          strength: "8-10",
          accessory: "10-12",
        },
        rpeTargets: {
          strength: 6,
          accessory: 6,
        },
      });
      currentWeek++;
    } else {
      // Accumulation block (build volume)
      // Find next deload or end of program
      const nextDeload = deloadWeeks.find((w) => w > currentWeek);
      const endWeek = nextDeload ? nextDeload - 1 : totalWeeks;

      blocks.push({
        blockNumber: blockNumber++,
        blockType: "accumulation",
        startWeek: currentWeek,
        endWeek: endWeek,
        volumeTarget: "high",
        intensityTarget: goalBias === "strength" ? "moderate" : "low",
        repRanges: {
          strength: goalBias === "hypertrophy" ? "10-12" : "8-12",
          accessory: "12-15",
        },
        rpeTargets: {
          strength: 7,
          accessory: 7,
        },
      });
      currentWeek = endWeek + 1;
    }
  }

  return {
    totalWeeks,
    blocks,
  };
}

/**
 * Intermediate framework: Block periodization with accumulation → intensification → deload cycles
 */
function generateIntermediateFramework(
  totalWeeks: number,
  goalBias: "strength" | "balanced" | "hypertrophy" | "fat_loss"
): PeriodizationFramework {
  const blocks: PeriodizationBlock[] = [];
  let blockNumber = 1;
  let currentWeek = 1;

  // Block cycle length based on total weeks
  const blockCycleLength = totalWeeks >= 12 ? 4 : 3; // 4-week blocks for 12+ weeks, 3-week for shorter

  while (currentWeek <= totalWeeks) {
    const remainingWeeks = totalWeeks - currentWeek + 1;

    if (remainingWeeks >= blockCycleLength) {
      // Full cycle: accumulation → intensification → deload
      const accumulationWeeks = Math.floor(blockCycleLength / 2);
      const intensificationWeeks = blockCycleLength - accumulationWeeks - 1;

      // Accumulation block
      blocks.push({
        blockNumber: blockNumber++,
        blockType: "accumulation",
        startWeek: currentWeek,
        endWeek: currentWeek + accumulationWeeks - 1,
        volumeTarget: "high",
        intensityTarget: goalBias === "strength" ? "moderate" : "low",
        repRanges: {
          strength: goalBias === "hypertrophy" ? "10-12" : "8-12",
          accessory: "12-15",
        },
        rpeTargets: {
          strength: 7.5,
          accessory: 7.5,
        },
      });
      currentWeek += accumulationWeeks;

      // Intensification block (if we have weeks left)
      if (intensificationWeeks > 0 && currentWeek <= totalWeeks) {
        blocks.push({
          blockNumber: blockNumber++,
          blockType: "intensification",
          startWeek: currentWeek,
          endWeek: currentWeek + intensificationWeeks - 1,
          volumeTarget: "moderate",
          intensityTarget: "high",
          repRanges: {
            strength: goalBias === "hypertrophy" ? "8-10" : "4-8",
            accessory: "8-12",
          },
          rpeTargets: {
            strength: 8.5,
            accessory: 8,
          },
        });
        currentWeek += intensificationWeeks;
      }

      // Deload week
      if (currentWeek <= totalWeeks) {
        blocks.push({
          blockNumber: blockNumber++,
          blockType: "deload",
          startWeek: currentWeek,
          endWeek: currentWeek,
          volumeTarget: "low",
          intensityTarget: "moderate",
          repRanges: {
            strength: "6-8",
            accessory: "8-10",
          },
          rpeTargets: {
            strength: 6.5,
            accessory: 6,
          },
        });
        currentWeek++;
      }
    } else {
      // Remaining weeks < full cycle - finish with appropriate blocks
      if (remainingWeeks >= 2) {
        // Accumulation + deload
        blocks.push({
          blockNumber: blockNumber++,
          blockType: "accumulation",
          startWeek: currentWeek,
          endWeek: currentWeek + remainingWeeks - 2,
          volumeTarget: "high",
          intensityTarget: "moderate",
          repRanges: {
            strength: "8-12",
            accessory: "12-15",
          },
          rpeTargets: {
            strength: 7.5,
            accessory: 7.5,
          },
        });
        currentWeek += remainingWeeks - 1;

        // Final deload
        blocks.push({
          blockNumber: blockNumber++,
          blockType: "deload",
          startWeek: currentWeek,
          endWeek: currentWeek,
          volumeTarget: "low",
          intensityTarget: "moderate",
          repRanges: {
            strength: "6-8",
            accessory: "8-10",
          },
          rpeTargets: {
            strength: 6.5,
            accessory: 6,
          },
        });
        currentWeek++;
      } else {
        // Just 1 week left - make it accumulation
        blocks.push({
          blockNumber: blockNumber++,
          blockType: "accumulation",
          startWeek: currentWeek,
          endWeek: currentWeek,
          volumeTarget: "high",
          intensityTarget: "moderate",
          repRanges: {
            strength: "8-12",
            accessory: "12-15",
          },
          rpeTargets: {
            strength: 7.5,
            accessory: 7.5,
          },
        });
        currentWeek++;
      }
    }
  }

  return {
    totalWeeks,
    blocks,
  };
}

/**
 * Determine which weeks should be deload weeks
 * Based on simple pattern: every 4th week
 */
function getDeloadWeeks(totalWeeks: number): number[] {
  const deloadWeeks: number[] = [];

  // Deload every 4 weeks starting from week 4
  for (let week = 4; week <= totalWeeks; week += 4) {
    deloadWeeks.push(week);
  }

  return deloadWeeks;
}

/**
 * Get the periodization block for a specific week
 */
export function getCurrentBlock(
  framework: PeriodizationFramework,
  weekNumber: number
): PeriodizationBlock | null {
  return (
    framework.blocks.find(
      (block) => weekNumber >= block.startWeek && weekNumber <= block.endWeek
    ) || null
  );
}

/**
 * Get training guidelines for a specific block type
 */
export function getBlockGuidelines(blockType: PeriodizationBlock["blockType"]) {
  return BLOCK_GUIDELINES[blockType];
}

/**
 * Get a human-readable description of the periodization framework
 */
export function describePeriodizationFramework(
  framework: PeriodizationFramework
): string {
  const blockSummaries = framework.blocks.map((block) => {
    const weekRange =
      block.startWeek === block.endWeek
        ? `Week ${block.startWeek}`
        : `Weeks ${block.startWeek}-${block.endWeek}`;
    return `${weekRange}: ${block.blockType} (${block.volumeTarget} volume, ${block.intensityTarget} intensity)`;
  });

  return `${framework.totalWeeks}-week program:\n${blockSummaries.join("\n")}`;
}

/**
 * Calculate progress through the current block (0-1)
 */
export function getBlockProgress(
  block: PeriodizationBlock,
  currentWeek: number
): number {
  const blockLength = block.endWeek - block.startWeek + 1;
  const weeksCompleted = currentWeek - block.startWeek;
  return Math.min(Math.max(weeksCompleted / blockLength, 0), 1);
}
