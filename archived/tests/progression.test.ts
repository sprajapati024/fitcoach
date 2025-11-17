import { describe, expect, it } from "vitest";
import {
  calculateExerciseProgression,
  applyDeloadModifications,
  calculateWeeklyVolumeLandmarks,
  estimateOneRepMax,
  calculateWeightForReps,
  type LoggedSet,
  type WeeklyLogSummary,
  type ProgressionTargetOutput,
} from "@/lib/progression";
import type { PeriodizationBlock } from "@/drizzle/schema";
import type { ProgressionRecommendation } from "@/lib/performance-analysis";

// Helpers
function createPeriodizationBlock(
  type: "accumulation" | "intensification" | "deload" = "accumulation"
): PeriodizationBlock {
  const configs = {
    accumulation: {
      volumeTarget: "high" as const,
      intensityTarget: "moderate" as const,
      rpeTargets: { strength: 7.5, accessory: 7.5 },
      repRanges: { strength: "8-12", accessory: "12-15" },
    },
    intensification: {
      volumeTarget: "moderate" as const,
      intensityTarget: "high" as const,
      rpeTargets: { strength: 8.5, accessory: 8 },
      repRanges: { strength: "4-8", accessory: "8-12" },
    },
    deload: {
      volumeTarget: "low" as const,
      intensityTarget: "moderate" as const,
      rpeTargets: { strength: 6.5, accessory: 6 },
      repRanges: { strength: "6-8", accessory: "8-10" },
    },
  };

  return {
    blockNumber: 1,
    blockType: type,
    startWeek: 1,
    endWeek: 3,
    ...configs[type],
  };
}

function createProgressionRecommendation(
  type: "progress" | "maintain" | "regress"
): ProgressionRecommendation {
  return {
    shouldProgress: type === "progress",
    shouldMaintain: type === "maintain",
    shouldRegress: type === "regress",
    reasoning: `User should ${type}`,
    recommendations: [`Recommendation for ${type}`],
    confidenceScore: 0.8,
  };
}

describe("progression", () => {
  describe("calculateExerciseProgression", () => {
    it("returns baseline for no previous data", () => {
      const block = createPeriodizationBlock("accumulation");
      const recommendation = createProgressionRecommendation("maintain");

      const result = calculateExerciseProgression("squat", [], block, recommendation);

      expect(result.exerciseId).toBe("squat");
      expect(result.currentWeight).toBe(0);
      expect(result.currentReps).toBe(0);
      expect(result.recommendedReps).toBe("8-12");
      expect(result.targetRPE).toBe(7.5);
      expect(result.progressionType).toBe("maintain");
      expect(result.notes).toContain("No previous data");
    });

    describe("with progression recommendation", () => {
      it("increases weight when hitting top of rep range", () => {
        const logs: LoggedSet[] = [
          { weightKg: 100, reps: 12, rpe: 7 }, // Hit top of 8-12 range
        ];
        const block = createPeriodizationBlock("accumulation");
        const recommendation = createProgressionRecommendation("progress");

        const result = calculateExerciseProgression("squat", logs, block, recommendation);

        expect(result.progressionType).toBe("increase");
        expect(result.recommendedWeight).toBeGreaterThan(100);
        expect(result.recommendedReps).toBe(8); // Reset to bottom of range
        expect(result.notes).toContain("Increase weight");
      });

      it("uses smaller increments for lighter weights", () => {
        const heavyLogs: LoggedSet[] = [{ weightKg: 100, reps: 12, rpe: 7 }];
        const lightLogs: LoggedSet[] = [{ weightKg: 40, reps: 12, rpe: 7 }];
        const block = createPeriodizationBlock("accumulation");
        const recommendation = createProgressionRecommendation("progress");

        const heavyResult = calculateExerciseProgression(
          "squat",
          heavyLogs,
          block,
          recommendation
        );
        const lightResult = calculateExerciseProgression(
          "curl",
          lightLogs,
          block,
          recommendation
        );

        const heavyIncrease = heavyResult.recommendedWeight - 100;
        const lightIncrease = lightResult.recommendedWeight - 40;

        expect(heavyIncrease).toBe(2.5); // Smaller increment for heavier weight
        expect(lightIncrease).toBe(5); // Larger increment for lighter weight
      });

      it("increases weight when RPE is significantly below target", () => {
        const logs: LoggedSet[] = [
          { weightKg: 80, reps: 10, rpe: 5.5 }, // RPE well below 7.5 target
        ];
        const block = createPeriodizationBlock("accumulation");
        const recommendation = createProgressionRecommendation("progress");

        const result = calculateExerciseProgression("bench", logs, block, recommendation);

        expect(result.progressionType).toBe("increase");
        expect(result.recommendedWeight).toBe(82.5); // +2.5kg
        expect(result.notes).toContain("RPE");
      });

      it("suggests rep progression in middle of range", () => {
        const logs: LoggedSet[] = [
          { weightKg: 100, reps: 10, rpe: 7.5 }, // Middle of 8-12 range
        ];
        const block = createPeriodizationBlock("accumulation");
        const recommendation = createProgressionRecommendation("progress");

        const result = calculateExerciseProgression("squat", logs, block, recommendation);

        expect(result.progressionType).toBe("increase");
        expect(result.recommendedWeight).toBe(100); // Keep weight same
        expect(result.notes).toContain("progressing reps");
      });
    });

    describe("with maintenance recommendation", () => {
      it("maintains current loads", () => {
        const logs: LoggedSet[] = [{ weightKg: 100, reps: 10, rpe: 7.5 }];
        const block = createPeriodizationBlock("accumulation");
        const recommendation = createProgressionRecommendation("maintain");

        const result = calculateExerciseProgression("squat", logs, block, recommendation);

        expect(result.progressionType).toBe("maintain");
        expect(result.recommendedWeight).toBe(100);
        expect(result.notes).toContain("Maintain current weights");
      });
    });

    describe("with regression recommendation", () => {
      it("reduces weight by 10%", () => {
        const logs: LoggedSet[] = [{ weightKg: 100, reps: 8, rpe: 9 }];
        const block = createPeriodizationBlock("accumulation");
        const recommendation = createProgressionRecommendation("regress");

        const result = calculateExerciseProgression("squat", logs, block, recommendation);

        expect(result.progressionType).toBe("decrease");
        expect(result.recommendedWeight).toBeCloseTo(90, 0); // 10% reduction
        expect(result.notes).toContain("Reduce weight by ~10%");
      });

      it("rounds weight to nearest 0.5kg", () => {
        const logs: LoggedSet[] = [{ weightKg: 87, reps: 8, rpe: 9 }];
        const block = createPeriodizationBlock("accumulation");
        const recommendation = createProgressionRecommendation("regress");

        const result = calculateExerciseProgression("squat", logs, block, recommendation);

        // 87 * 0.9 = 78.3, rounded to 78.5
        expect(result.recommendedWeight).toBe(78.5);
      });
    });

    describe("deload modifications", () => {
      it("applies 15% reduction during deload week", () => {
        const logs: LoggedSet[] = [{ weightKg: 100, reps: 10, rpe: 7 }];
        const block = createPeriodizationBlock("deload");
        const recommendation = createProgressionRecommendation("maintain");

        const result = calculateExerciseProgression("squat", logs, block, recommendation);

        expect(result.progressionType).toBe("decrease");
        expect(result.recommendedWeight).toBe(85); // 100 * 0.85
        expect(result.notes).toContain("Deload week");
      });
    });

    describe("best set selection", () => {
      it("selects set with highest weight × reps product", () => {
        const logs: LoggedSet[] = [
          { weightKg: 80, reps: 12, rpe: 7 }, // 960
          { weightKg: 100, reps: 10, rpe: 8 }, // 1000 - BEST
          { weightKg: 90, reps: 11, rpe: 7.5 }, // 990
        ];
        const block = createPeriodizationBlock("accumulation");
        const recommendation = createProgressionRecommendation("maintain");

        const result = calculateExerciseProgression("squat", logs, block, recommendation);

        expect(result.currentWeight).toBe(100);
        expect(result.currentReps).toBe(10);
        expect(result.currentRPE).toBe(8);
      });
    });
  });

  describe("applyDeloadModifications", () => {
    it("applies default 40% volume and 15% load reduction", () => {
      const baseProgression: ProgressionTargetOutput = {
        weekIndex: 3,
        totalLoadKg: 10000,
        zone2Minutes: 100,
        focusNotes: "Progressive week",
        isDeload: false,
      };

      const result = applyDeloadModifications(baseProgression);

      expect(result.totalLoadKg).toBe(8500); // 15% reduction
      expect(result.zone2Minutes).toBe(60); // 40% reduction
      expect(result.isDeload).toBe(true);
      expect(result.focusNotes).toContain("40% volume reduction");
      expect(result.focusNotes).toContain("15% load reduction");
    });

    it("accepts custom reduction percentages", () => {
      const baseProgression: ProgressionTargetOutput = {
        weekIndex: 3,
        totalLoadKg: 10000,
        zone2Minutes: 100,
        focusNotes: "Progressive week",
        isDeload: false,
      };

      const result = applyDeloadModifications(baseProgression, 0.5, 0.2);

      expect(result.totalLoadKg).toBe(8000); // 20% reduction
      expect(result.zone2Minutes).toBe(50); // 50% reduction
      expect(result.focusNotes).toContain("50% volume reduction");
      expect(result.focusNotes).toContain("20% load reduction");
    });

    it("rounds results appropriately", () => {
      const baseProgression: ProgressionTargetOutput = {
        weekIndex: 3,
        totalLoadKg: 9500,
        zone2Minutes: 95,
        focusNotes: "Progressive week",
        isDeload: false,
      };

      const result = applyDeloadModifications(baseProgression);

      expect(Number.isInteger(result.totalLoadKg)).toBe(true);
      expect(Number.isInteger(result.zone2Minutes)).toBe(true);
    });
  });

  describe("calculateWeeklyVolumeLandmarks", () => {
    it("calculates landmarks for each week", () => {
      const logs: WeeklyLogSummary[] = [
        {
          weekIndex: 0,
          sets: [
            { weightKg: 100, reps: 10, rpe: 7 },
            { weightKg: 100, reps: 10, rpe: 7 },
          ],
        },
        {
          weekIndex: 1,
          sets: [
            { weightKg: 102.5, reps: 10, rpe: 7.5 },
            { weightKg: 102.5, reps: 10, rpe: 7.5 },
          ],
        },
      ];

      const result = calculateWeeklyVolumeLandmarks(logs, 2);

      expect(result.length).toBe(2);
      expect(result[0].weekIndex).toBe(0);
      expect(result[0].volumeLandmark).toBe(20); // 10 + 10 reps
      expect(result[0].intensityLandmark).toBe(100); // Avg weight
      expect(result[0].avgRPE).toBe(7);

      expect(result[1].weekIndex).toBe(1);
      expect(result[1].volumeLandmark).toBe(20);
      expect(result[1].intensityLandmark).toBe(102.5);
      expect(result[1].avgRPE).toBe(7.5);
    });

    it("handles weeks with no data", () => {
      const logs: WeeklyLogSummary[] = [
        {
          weekIndex: 0,
          sets: [{ weightKg: 100, reps: 10, rpe: 7 }],
        },
        // Week 1 missing
      ];

      const result = calculateWeeklyVolumeLandmarks(logs, 3);

      expect(result.length).toBe(3);
      expect(result[1].volumeLandmark).toBe(0);
      expect(result[1].intensityLandmark).toBe(0);
      expect(result[1].avgRPE).toBe(0);
    });

    it("calculates average RPE correctly", () => {
      const logs: WeeklyLogSummary[] = [
        {
          weekIndex: 0,
          sets: [
            { weightKg: 100, reps: 10, rpe: 6 },
            { weightKg: 100, reps: 10, rpe: 8 },
            { weightKg: 100, reps: 10 }, // No RPE
          ],
        },
      ];

      const result = calculateWeeklyVolumeLandmarks(logs, 1);

      expect(result[0].avgRPE).toBe(7); // (6 + 8) / 2
    });

    it("handles sets without RPE", () => {
      const logs: WeeklyLogSummary[] = [
        {
          weekIndex: 0,
          sets: [
            { weightKg: 100, reps: 10 }, // No RPE
            { weightKg: 100, reps: 10 }, // No RPE
          ],
        },
      ];

      const result = calculateWeeklyVolumeLandmarks(logs, 1);

      expect(result[0].avgRPE).toBe(0);
    });

    it("aggregates multiple log entries per week", () => {
      const logs: WeeklyLogSummary[] = [
        {
          weekIndex: 0,
          sets: [{ weightKg: 100, reps: 10, rpe: 7 }],
        },
        {
          weekIndex: 0, // Same week, different session
          sets: [{ weightKg: 100, reps: 10, rpe: 7 }],
        },
      ];

      const result = calculateWeeklyVolumeLandmarks(logs, 1);

      expect(result[0].volumeLandmark).toBe(20); // Combined
    });
  });

  describe("estimateOneRepMax", () => {
    it("returns weight for 1 rep", () => {
      const result = estimateOneRepMax(100, 1);
      expect(result).toBe(100);
    });

    it("calculates 1RM using Epley formula", () => {
      // 100kg × 10 reps should estimate ~133kg 1RM
      const result = estimateOneRepMax(100, 10);
      expect(result).toBeCloseTo(133, 0);
    });

    it("adjusts for RPE when provided", () => {
      // 100kg × 8 reps @ RPE 8 = 2 RIR
      // Equivalent to 10 reps @ RPE 10
      const withRPE = estimateOneRepMax(100, 8, 8);
      const without = estimateOneRepMax(100, 10);

      expect(withRPE).toBeCloseTo(without, 0);
    });

    it("handles RPE 10 (no reps in reserve)", () => {
      const result = estimateOneRepMax(100, 8, 10);
      expect(result).toBeCloseTo(126.7, 0);
    });

    it("returns reasonable estimates for common weights", () => {
      // Common case: 80kg × 5 reps @ RPE 8
      const result = estimateOneRepMax(80, 5, 8);

      // Should estimate around 95-105kg
      expect(result).toBeGreaterThan(90);
      expect(result).toBeLessThan(110);
    });
  });

  describe("calculateWeightForReps", () => {
    it("calculates weight for target reps at RPE 8", () => {
      const oneRM = 100;

      const for5Reps = calculateWeightForReps(oneRM, 5, 8);
      const for10Reps = calculateWeightForReps(oneRM, 10, 8);

      expect(for5Reps).toBeGreaterThan(for10Reps); // Higher weight for fewer reps
      expect(for5Reps).toBeLessThan(oneRM); // But still less than 1RM
    });

    it("accounts for RPE/RIR in calculations", () => {
      const oneRM = 100;

      const atRPE8 = calculateWeightForReps(oneRM, 5, 8); // 2 RIR
      const atRPE9 = calculateWeightForReps(oneRM, 5, 9); // 1 RIR

      expect(atRPE9).toBeGreaterThan(atRPE8); // Higher RPE = heavier weight
    });

    it("rounds to nearest 2.5kg", () => {
      const oneRM = 123.4;

      const result = calculateWeightForReps(oneRM, 5, 8);

      expect(result % 2.5).toBe(0); // Should be multiple of 2.5
    });

    it("returns reasonable weights for common scenarios", () => {
      const oneRM = 100;

      // 5 reps @ RPE 8 should be around 75-85% of 1RM
      const for5 = calculateWeightForReps(oneRM, 5, 8);
      expect(for5).toBeGreaterThan(70);
      expect(for5).toBeLessThan(90);

      // 10 reps @ RPE 8 should be around 60-70% of 1RM
      const for10 = calculateWeightForReps(oneRM, 10, 8);
      expect(for10).toBeGreaterThan(55);
      expect(for10).toBeLessThan(75);
    });

    it("uses default RPE of 8", () => {
      const oneRM = 100;

      const withDefault = calculateWeightForReps(oneRM, 5);
      const withExplicit = calculateWeightForReps(oneRM, 5, 8);

      expect(withDefault).toBe(withExplicit);
    });
  });
});
