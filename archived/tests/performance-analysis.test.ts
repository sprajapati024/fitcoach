import { describe, expect, it, vi } from "vitest";

// Mock the database module to avoid DATABASE_URL requirement
vi.mock("@/lib/db", () => ({
  db: {},
}));

import {
  generateProgressionRecommendations,
  summarizeWeekForAI,
  calculateWeekOverWeekChanges,
  isWeekReadyForAnalysis,
  type ProgressionRecommendation,
} from "@/lib/performance-analysis";
import type { WeekPerformanceMetrics, PeriodizationBlock } from "@/drizzle/schema";

// Helper to create test performance metrics
function createPerformanceMetrics(
  overrides: Partial<WeekPerformanceMetrics> = {}
): WeekPerformanceMetrics {
  return {
    completionRate: 80,
    avgRPE: 7.5,
    totalVolume: 300,
    totalTonnage: 12000,
    exerciseBreakdown: {
      squat: { sets: 12, reps: 36, avgWeight: 100 },
      bench: { sets: 12, reps: 36, avgWeight: 70 },
    },
    ...overrides,
  };
}

// Helper to create test periodization block
function createPeriodizationBlock(
  type: "accumulation" | "intensification" | "deload" | "realization" = "accumulation"
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
    realization: {
      volumeTarget: "low" as const,
      intensityTarget: "high" as const,
      rpeTargets: { strength: 9, accessory: 8 },
      repRanges: { strength: "3-6", accessory: "6-8" },
    },
  };

  const config = configs[type];

  return {
    blockNumber: 1,
    blockType: type,
    startWeek: 1,
    endWeek: 3,
    ...config,
  };
}

describe("performance-analysis", () => {
  describe("generateProgressionRecommendations", () => {
    describe("accumulation phase", () => {
      it("recommends progression for high completion and low RPE", () => {
        const performance = createPerformanceMetrics({
          completionRate: 90,
          avgRPE: 5.5, // Well below target of 7.5 (need >1.5 below)
        });
        const block = createPeriodizationBlock("accumulation");

        const result = generateProgressionRecommendations(performance, null, block);

        expect(result.shouldProgress).toBe(true);
        expect(result.shouldMaintain).toBe(false);
        expect(result.shouldRegress).toBe(false);
        expect(result.reasoning).toContain("capacity for increased");
        expect(result.recommendations.length).toBeGreaterThan(0);
        expect(result.confidenceScore).toBeGreaterThan(0.7);
      });

      it("recommends maintenance for on-target performance", () => {
        const performance = createPerformanceMetrics({
          completionRate: 85,
          avgRPE: 7.5, // On target
        });
        const block = createPeriodizationBlock("accumulation");

        const result = generateProgressionRecommendations(performance, null, block);

        expect(result.shouldMaintain).toBe(true);
        expect(result.shouldProgress).toBe(false);
        expect(result.shouldRegress).toBe(false);
        expect(result.reasoning).toContain("Hitting targets");
      });

      it("recommends regression for low completion rate", () => {
        const performance = createPerformanceMetrics({
          completionRate: 45, // Low completion
          avgRPE: 8.5,
        });
        const block = createPeriodizationBlock("accumulation");

        const result = generateProgressionRecommendations(performance, null, block);

        expect(result.shouldRegress).toBe(true);
        expect(result.shouldProgress).toBe(false);
        expect(result.reasoning).toContain("Low completion");
        expect(result.recommendations).toContain("Reduce volume by 10-15%");
      });

      it("recommends maintenance for high RPE", () => {
        const performance = createPerformanceMetrics({
          completionRate: 75,
          avgRPE: 9, // Above target
        });
        const block = createPeriodizationBlock("accumulation");

        const result = generateProgressionRecommendations(performance, null, block);

        expect(result.shouldMaintain).toBe(true);
        expect(result.recommendations.some((r) => r.includes("Monitor recovery"))).toBe(
          true
        );
      });
    });

    describe("intensification phase", () => {
      it("recommends progression for good performance under heavy loads", () => {
        const performance = createPerformanceMetrics({
          completionRate: 90,
          avgRPE: 7.0, // Well below target of 8.5 (need >1.5 below)
        });
        const block = createPeriodizationBlock("intensification");

        const result = generateProgressionRecommendations(performance, null, block);

        expect(result.shouldProgress).toBe(true);
        expect(result.reasoning).toContain("Ready for load increase");
        expect(result.recommendations.some((r) => r.includes("Increase load"))).toBe(
          true
        );
      });

      it("recommends maintenance for appropriate intensity", () => {
        const performance = createPerformanceMetrics({
          completionRate: 85,
          avgRPE: 8.5, // On target
        });
        const block = createPeriodizationBlock("intensification");

        const result = generateProgressionRecommendations(performance, null, block);

        expect(result.shouldMaintain).toBe(true);
        expect(result.reasoning).toContain("Meeting intensity targets");
      });

      it("recommends regression for struggling with intensity", () => {
        const performance = createPerformanceMetrics({
          completionRate: 50,
          avgRPE: 9.5, // Way above target
        });
        const block = createPeriodizationBlock("intensification");

        const result = generateProgressionRecommendations(performance, null, block);

        expect(result.shouldRegress).toBe(true);
        expect(result.recommendations.some((r) => r.includes("Reduce loads"))).toBe(
          true
        );
      });
    });

    describe("deload phase", () => {
      it("always recommends maintenance during deload", () => {
        const performance = createPerformanceMetrics({
          completionRate: 90,
          avgRPE: 5,
        });
        const block = createPeriodizationBlock("deload");

        const result = generateProgressionRecommendations(performance, null, block);

        expect(result.shouldMaintain).toBe(true);
        expect(result.reasoning).toContain("Deload week completed");
        expect(result.confidenceScore).toBeGreaterThan(0.85);
      });

      it("suggests extra rest for low completion during deload", () => {
        const performance = createPerformanceMetrics({
          completionRate: 40,
          avgRPE: 6,
        });
        const block = createPeriodizationBlock("deload");

        const result = generateProgressionRecommendations(performance, null, block);

        expect(result.shouldMaintain).toBe(true);
        expect(
          result.recommendations.some((r) => r.includes("extra rest day"))
        ).toBe(true);
      });
    });

    describe("realization phase", () => {
      it("recognizes successful peaking", () => {
        const performance = createPerformanceMetrics({
          completionRate: 90,
          avgRPE: 9, // On target for peak phase
        });
        const block = createPeriodizationBlock("realization");

        const result = generateProgressionRecommendations(performance, null, block);

        expect(result.shouldProgress).toBe(true);
        expect(result.reasoning).toContain("Peaking successfully");
        expect(
          result.recommendations.some((r) => r.includes("performance tests"))
        ).toBe(true);
      });

      it("handles maximal loads appropriately", () => {
        const performance = createPerformanceMetrics({
          completionRate: 80,
          avgRPE: 10.5, // RPE over target (>10, so over rpeOnTarget range)
        });
        const block = createPeriodizationBlock("realization");

        const result = generateProgressionRecommendations(performance, null, block);

        expect(result.shouldMaintain).toBe(true);
        expect(
          result.recommendations.some((r) => r.includes("48-72hr rest"))
        ).toBe(true);
      });
    });

    describe("with previous performance data", () => {
      it("recognizes volume increases", () => {
        const current = createPerformanceMetrics({
          totalVolume: 350,
          completionRate: 90,
          avgRPE: 6.0, // Need low RPE to trigger progression
        });
        const previous = createPerformanceMetrics({ totalVolume: 300 });
        const block = createPeriodizationBlock("accumulation");

        const result = generateProgressionRecommendations(current, previous, block);

        // Volume increased by ~16.7%
        expect(result.shouldProgress).toBe(true);
        expect(
          result.recommendations.some((r) => r.includes("Volume is trending up"))
        ).toBe(true);
      });

      it("handles volume decreases", () => {
        const current = createPerformanceMetrics({ totalVolume: 250 });
        const previous = createPerformanceMetrics({ totalVolume: 300 });
        const block = createPeriodizationBlock("intensification");

        const result = generateProgressionRecommendations(current, previous, block);

        // Volume decreased but that's okay in intensification
        expect(result).toBeDefined();
      });
    });
  });

  describe("summarizeWeekForAI", () => {
    it("creates concise summary with all key metrics", () => {
      const performance = createPerformanceMetrics();
      const recommendations: ProgressionRecommendation = {
        shouldProgress: true,
        shouldMaintain: false,
        shouldRegress: false,
        reasoning: "Great performance this week",
        recommendations: ["Add 5kg to squats", "Increase volume by 2 sets"],
        confidenceScore: 0.85,
      };

      const summary = summarizeWeekForAI(performance, recommendations, 1, "accumulation");

      expect(summary).toContain("Week 1");
      expect(summary).toContain("accumulation");
      expect(summary).toContain("80%"); // Completion rate
      expect(summary).toContain("7.5"); // RPE
      expect(summary).toContain("300"); // Volume
      expect(summary).toContain("12000"); // Tonnage
      expect(summary).toContain("Great performance this week");
      expect(summary).toContain("Add 5kg to squats");
      expect(summary).toContain("Increase volume by 2 sets");
    });

    it("formats metrics correctly", () => {
      const performance = createPerformanceMetrics({
        completionRate: 87.5,
        avgRPE: 8.25,
        totalTonnage: 15432.75,
      });
      const recommendations: ProgressionRecommendation = {
        shouldMaintain: true,
        shouldProgress: false,
        shouldRegress: false,
        reasoning: "Maintain current approach",
        recommendations: ["Keep it steady"],
        confidenceScore: 0.8,
      };

      const summary = summarizeWeekForAI(performance, recommendations, 3, "intensification");

      expect(summary).toContain("88%"); // Rounded completion (87.5 → 88)
      expect(summary).toContain("8.3"); // Rounded RPE (8.25 → 8.3 when using toFixed(1))
      expect(summary).toContain("15433"); // Rounded tonnage
    });
  });

  describe("calculateWeekOverWeekChanges", () => {
    it("calculates positive changes correctly", () => {
      const current = createPerformanceMetrics({
        completionRate: 90,
        avgRPE: 8.0,
        totalVolume: 350,
        totalTonnage: 14000,
      });
      const previous = createPerformanceMetrics({
        completionRate: 80,
        avgRPE: 7.5,
        totalVolume: 300,
        totalTonnage: 12000,
      });

      const changes = calculateWeekOverWeekChanges(current, previous);

      expect(changes.completionRateChange).toBeCloseTo(10, 1);
      expect(changes.rpeChange).toBeCloseTo(0.5, 1);
      expect(changes.volumeChange).toBeCloseTo(16.67, 1); // (350-300)/300 * 100
      expect(changes.tonnageChange).toBeCloseTo(16.67, 1);
    });

    it("calculates negative changes correctly", () => {
      const current = createPerformanceMetrics({
        completionRate: 70,
        avgRPE: 7.0,
        totalVolume: 270,
        totalTonnage: 10800,
      });
      const previous = createPerformanceMetrics({
        completionRate: 80,
        avgRPE: 7.5,
        totalVolume: 300,
        totalTonnage: 12000,
      });

      const changes = calculateWeekOverWeekChanges(current, previous);

      expect(changes.completionRateChange).toBeCloseTo(-10, 1);
      expect(changes.rpeChange).toBeCloseTo(-0.5, 1);
      expect(changes.volumeChange).toBeCloseTo(-10, 1);
      expect(changes.tonnageChange).toBeCloseTo(-10, 1);
    });

    it("returns zeros when no previous data", () => {
      const current = createPerformanceMetrics();

      const changes = calculateWeekOverWeekChanges(current, null);

      expect(changes.completionRateChange).toBe(0);
      expect(changes.rpeChange).toBe(0);
      expect(changes.volumeChange).toBe(0);
      expect(changes.tonnageChange).toBe(0);
    });

    it("handles zero previous values safely", () => {
      const current = createPerformanceMetrics({ totalVolume: 100, totalTonnage: 4000 });
      const previous = createPerformanceMetrics({ totalVolume: 0, totalTonnage: 0 });

      const changes = calculateWeekOverWeekChanges(current, previous);

      expect(changes.volumeChange).toBe(0); // Should handle division by zero
      expect(changes.tonnageChange).toBe(0);
    });
  });

  describe("isWeekReadyForAnalysis", () => {
    it("returns true for sufficient completion", () => {
      const performance = createPerformanceMetrics({ completionRate: 70 });

      expect(isWeekReadyForAnalysis(performance)).toBe(true);
    });

    it("returns false for insufficient completion", () => {
      const performance = createPerformanceMetrics({ completionRate: 40 });

      expect(isWeekReadyForAnalysis(performance)).toBe(false);
    });

    it("uses custom minimum completion rate", () => {
      const performance = createPerformanceMetrics({ completionRate: 60 });

      expect(isWeekReadyForAnalysis(performance, 70)).toBe(false);
      expect(isWeekReadyForAnalysis(performance, 50)).toBe(true);
    });

    it("returns true at exactly minimum threshold", () => {
      const performance = createPerformanceMetrics({ completionRate: 50 });

      expect(isWeekReadyForAnalysis(performance, 50)).toBe(true);
    });

    it("returns false for 0% completion", () => {
      const performance = createPerformanceMetrics({ completionRate: 0 });

      expect(isWeekReadyForAnalysis(performance)).toBe(false);
    });

    it("returns true for 100% completion", () => {
      const performance = createPerformanceMetrics({ completionRate: 100 });

      expect(isWeekReadyForAnalysis(performance)).toBe(true);
    });
  });
});
