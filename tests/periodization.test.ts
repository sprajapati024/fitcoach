import { describe, expect, it } from "vitest";
import {
  generatePeriodizationFramework,
  getCurrentBlock,
  getBlockGuidelines,
  describePeriodizationFramework,
  getBlockProgress,
  BLOCK_GUIDELINES,
} from "@/lib/periodization";

describe("periodization", () => {
  describe("generatePeriodizationFramework", () => {
    describe("beginner level", () => {
      it("generates simple linear progression for 4-week program", () => {
        const framework = generatePeriodizationFramework(4, "beginner", "balanced");

        expect(framework.totalWeeks).toBe(4);
        expect(framework.blocks.length).toBe(2); // Accumulation (weeks 1-3) + Deload (week 4)

        // First block should be accumulation
        expect(framework.blocks[0].blockType).toBe("accumulation");
        expect(framework.blocks[0].startWeek).toBe(1);
        expect(framework.blocks[0].endWeek).toBe(3);
        expect(framework.blocks[0].volumeTarget).toBe("high");

        // Second block should be deload
        expect(framework.blocks[1].blockType).toBe("deload");
        expect(framework.blocks[1].startWeek).toBe(4);
        expect(framework.blocks[1].endWeek).toBe(4);
        expect(framework.blocks[1].volumeTarget).toBe("low");
      });

      it("generates correct rep ranges for hypertrophy goal", () => {
        const framework = generatePeriodizationFramework(4, "beginner", "hypertrophy");

        const accumulationBlock = framework.blocks[0];
        expect(accumulationBlock.repRanges.strength).toBe("10-12");
        expect(accumulationBlock.repRanges.accessory).toBe("12-15");
      });

      it("generates correct rep ranges for strength goal", () => {
        const framework = generatePeriodizationFramework(4, "beginner", "strength");

        const accumulationBlock = framework.blocks[0];
        expect(accumulationBlock.repRanges.strength).toBe("8-12");
        expect(accumulationBlock.intensityTarget).toBe("moderate");
      });

      it("places deload weeks correctly for 8-week program", () => {
        const framework = generatePeriodizationFramework(8, "beginner", "balanced");

        const deloadBlocks = framework.blocks.filter((b) => b.blockType === "deload");
        expect(deloadBlocks.length).toBe(2); // Week 4 and week 8
        expect(deloadBlocks[0].startWeek).toBe(4);
        expect(deloadBlocks[1].startWeek).toBe(8);
      });

      it("handles 12-week program with correct structure", () => {
        const framework = generatePeriodizationFramework(12, "beginner", "balanced");

        expect(framework.totalWeeks).toBe(12);
        const deloadBlocks = framework.blocks.filter((b) => b.blockType === "deload");
        expect(deloadBlocks.length).toBe(3); // Week 4, 8, 12
      });
    });

    describe("intermediate level", () => {
      it("generates block periodization for 8-week program", () => {
        const framework = generatePeriodizationFramework(8, "intermediate", "balanced");

        expect(framework.totalWeeks).toBe(8);
        expect(framework.blocks.length).toBeGreaterThan(2);

        // Should have accumulation, intensification, and deload blocks
        const blockTypes = framework.blocks.map((b) => b.blockType);
        expect(blockTypes).toContain("accumulation");
        expect(blockTypes).toContain("intensification");
        expect(blockTypes).toContain("deload");
      });

      it("creates proper accumulation → intensification → deload cycles", () => {
        const framework = generatePeriodizationFramework(12, "intermediate", "balanced");

        // Check first cycle pattern
        expect(framework.blocks[0].blockType).toBe("accumulation");
        expect(framework.blocks[1].blockType).toBe("intensification");
        expect(framework.blocks[2].blockType).toBe("deload");

        // Verify blocks are contiguous (no gaps in weeks)
        for (let i = 0; i < framework.blocks.length - 1; i++) {
          expect(framework.blocks[i + 1].startWeek).toBe(
            framework.blocks[i].endWeek + 1
          );
        }
      });

      it("uses appropriate RPE targets for intensification phase", () => {
        const framework = generatePeriodizationFramework(8, "intermediate", "strength");

        const intensificationBlock = framework.blocks.find(
          (b) => b.blockType === "intensification"
        );
        expect(intensificationBlock).toBeDefined();
        expect(intensificationBlock!.rpeTargets.strength).toBeGreaterThan(8);
        expect(intensificationBlock!.intensityTarget).toBe("high");
      });

      it("adjusts rep ranges based on goal", () => {
        const hypertrophy = generatePeriodizationFramework(
          8,
          "intermediate",
          "hypertrophy"
        );
        const strength = generatePeriodizationFramework(8, "intermediate", "strength");

        const hypAccum = hypertrophy.blocks.find((b) => b.blockType === "accumulation");
        const strAccum = strength.blocks.find((b) => b.blockType === "accumulation");

        expect(hypAccum!.repRanges.strength).toBe("10-12");
        expect(strAccum!.repRanges.strength).toBe("8-12");
      });

      it("handles short programs correctly", () => {
        const framework = generatePeriodizationFramework(4, "intermediate", "balanced");

        expect(framework.totalWeeks).toBe(4);
        // Should still create a meaningful structure even with short duration
        expect(framework.blocks.length).toBeGreaterThanOrEqual(2);
      });
    });

    describe("all goals", () => {
      it("generates framework for fat_loss goal", () => {
        const framework = generatePeriodizationFramework(8, "intermediate", "fat_loss");

        expect(framework.totalWeeks).toBe(8);
        expect(framework.blocks.length).toBeGreaterThan(0);
      });

      it("ensures all weeks are covered", () => {
        const framework = generatePeriodizationFramework(10, "intermediate", "balanced");

        // Collect all weeks covered by blocks
        const coveredWeeks = new Set<number>();
        framework.blocks.forEach((block) => {
          for (let week = block.startWeek; week <= block.endWeek; week++) {
            coveredWeeks.add(week);
          }
        });

        // Should cover weeks 1-10
        expect(coveredWeeks.size).toBe(10);
        expect(Math.min(...coveredWeeks)).toBe(1);
        expect(Math.max(...coveredWeeks)).toBe(10);
      });
    });
  });

  describe("getCurrentBlock", () => {
    it("returns correct block for given week", () => {
      const framework = generatePeriodizationFramework(8, "intermediate", "balanced");

      const week1Block = getCurrentBlock(framework, 1);
      expect(week1Block).toBeDefined();
      expect(week1Block!.startWeek).toBeLessThanOrEqual(1);
      expect(week1Block!.endWeek).toBeGreaterThanOrEqual(1);
    });

    it("returns null for invalid week number", () => {
      const framework = generatePeriodizationFramework(4, "beginner", "balanced");

      const invalidBlock = getCurrentBlock(framework, 10);
      expect(invalidBlock).toBeNull();
    });

    it("handles week 0 gracefully", () => {
      const framework = generatePeriodizationFramework(4, "beginner", "balanced");

      const block = getCurrentBlock(framework, 0);
      expect(block).toBeNull();
    });

    it("correctly identifies deload weeks", () => {
      const framework = generatePeriodizationFramework(8, "beginner", "balanced");

      const week4Block = getCurrentBlock(framework, 4);
      expect(week4Block).toBeDefined();
      expect(week4Block!.blockType).toBe("deload");
    });
  });

  describe("getBlockGuidelines", () => {
    it("returns correct guidelines for accumulation phase", () => {
      const guidelines = getBlockGuidelines("accumulation");

      expect(guidelines.volumeGuidelines).toContain("High volume");
      expect(guidelines.intensityGuidelines).toContain("Moderate intensity");
      expect(guidelines.repRangeGuidelines).toBeDefined();
      expect(guidelines.rpeGuidelines).toBeDefined();
    });

    it("returns correct guidelines for intensification phase", () => {
      const guidelines = getBlockGuidelines("intensification");

      expect(guidelines.volumeGuidelines).toContain("Moderate volume");
      expect(guidelines.intensityGuidelines).toContain("High intensity");
    });

    it("returns correct guidelines for deload phase", () => {
      const guidelines = getBlockGuidelines("deload");

      expect(guidelines.volumeGuidelines).toContain("Low volume");
      expect(guidelines.description).toContain("recovery");
    });

    it("returns correct guidelines for realization phase", () => {
      const guidelines = getBlockGuidelines("realization");

      expect(guidelines.intensityGuidelines).toContain("Peak intensity");
      expect(guidelines.volumeGuidelines).toContain("Low volume");
    });
  });

  describe("describePeriodizationFramework", () => {
    it("generates readable description of framework", () => {
      const framework = generatePeriodizationFramework(4, "beginner", "balanced");
      const description = describePeriodizationFramework(framework);

      expect(description).toContain("4-week program");
      expect(description).toContain("Weeks 1-3"); // Multi-week format
      expect(description).toContain("accumulation");
      expect(description).toContain("high volume");
    });

    it("handles single-week blocks", () => {
      const framework = generatePeriodizationFramework(8, "beginner", "balanced");
      const description = describePeriodizationFramework(framework);

      expect(description).toContain("Week 4"); // Deload week
    });

    it("handles multi-week blocks", () => {
      const framework = generatePeriodizationFramework(12, "intermediate", "balanced");
      const description = describePeriodizationFramework(framework);

      // With 12 weeks, should have some multi-week blocks
      expect(description).toContain("12-week program");
      expect(description.length).toBeGreaterThan(50); // Should have substantial content
    });
  });

  describe("getBlockProgress", () => {
    it("calculates progress at start of block", () => {
      const block = {
        blockNumber: 1,
        blockType: "accumulation" as const,
        startWeek: 1,
        endWeek: 3,
        volumeTarget: "high" as const,
        intensityTarget: "moderate" as const,
        repRanges: { strength: "8-12", accessory: "12-15" },
        rpeTargets: { strength: 7, accessory: 7 },
      };

      const progress = getBlockProgress(block, 1);
      expect(progress).toBe(0); // Just started
    });

    it("calculates progress at middle of block", () => {
      const block = {
        blockNumber: 1,
        blockType: "accumulation" as const,
        startWeek: 1,
        endWeek: 4,
        volumeTarget: "high" as const,
        intensityTarget: "moderate" as const,
        repRanges: { strength: "8-12", accessory: "12-15" },
        rpeTargets: { strength: 7, accessory: 7 },
      };

      const progress = getBlockProgress(block, 3);
      expect(progress).toBeCloseTo(0.5, 1); // Halfway through
    });

    it("calculates progress at end of block", () => {
      const block = {
        blockNumber: 1,
        blockType: "accumulation" as const,
        startWeek: 1,
        endWeek: 3,
        volumeTarget: "high" as const,
        intensityTarget: "moderate" as const,
        repRanges: { strength: "8-12", accessory: "12-15" },
        rpeTargets: { strength: 7, accessory: 7 },
      };

      const progress = getBlockProgress(block, 3);
      expect(progress).toBeCloseTo(0.67, 1); // 2/3 complete
    });

    it("caps progress at 1.0", () => {
      const block = {
        blockNumber: 1,
        blockType: "deload" as const,
        startWeek: 4,
        endWeek: 4,
        volumeTarget: "low" as const,
        intensityTarget: "moderate" as const,
        repRanges: { strength: "6-8", accessory: "8-10" },
        rpeTargets: { strength: 6, accessory: 6 },
      };

      const progress = getBlockProgress(block, 5); // Beyond block
      expect(progress).toBe(1);
    });

    it("returns 0 for weeks before block starts", () => {
      const block = {
        blockNumber: 2,
        blockType: "accumulation" as const,
        startWeek: 5,
        endWeek: 7,
        volumeTarget: "high" as const,
        intensityTarget: "moderate" as const,
        repRanges: { strength: "8-12", accessory: "12-15" },
        rpeTargets: { strength: 7, accessory: 7 },
      };

      const progress = getBlockProgress(block, 3);
      expect(progress).toBe(0);
    });
  });

  describe("BLOCK_GUIDELINES constant", () => {
    it("contains all required block types", () => {
      expect(BLOCK_GUIDELINES.accumulation).toBeDefined();
      expect(BLOCK_GUIDELINES.intensification).toBeDefined();
      expect(BLOCK_GUIDELINES.deload).toBeDefined();
      expect(BLOCK_GUIDELINES.realization).toBeDefined();
    });

    it("has consistent structure for all block types", () => {
      const blockTypes = [
        "accumulation",
        "intensification",
        "deload",
        "realization",
      ] as const;

      blockTypes.forEach((type) => {
        const guidelines = BLOCK_GUIDELINES[type];
        expect(guidelines.volumeGuidelines).toBeDefined();
        expect(guidelines.intensityGuidelines).toBeDefined();
        expect(guidelines.repRangeGuidelines).toBeDefined();
        expect(guidelines.rpeGuidelines).toBeDefined();
        expect(guidelines.description).toBeDefined();
      });
    });
  });
});
