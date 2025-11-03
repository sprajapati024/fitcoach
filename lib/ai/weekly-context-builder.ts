import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { periodizationFrameworks } from "@/drizzle/schema";
import { analyzeWeekPerformance, generateProgressionRecommendations } from "@/lib/performance-analysis";
import type { profiles } from "@/drizzle/schema";

type Profile = typeof profiles.$inferSelect;

interface WeeklyReviewContext {
  weekNumber: number;
  performance: {
    completionRate: number;
    avgRPE: number;
    totalVolume: number;
    totalTonnage: number;
    topExercises: Array<{
      exerciseId: string;
      sets: number;
      avgWeight: number;
    }>;
  };
  periodization: {
    currentBlock: {
      type: string;
      weekInBlock: number;
      totalBlockWeeks: number;
      volumeTarget: string;
      intensityTarget: string;
      repRanges: {
        strength: string;
        accessory: string;
      };
    };
  };
  progression: {
    shouldProgress: boolean;
    shouldMaintain: boolean;
    shouldRegress: boolean;
    reasoning: string;
    recommendations: string[];
  };
  userContext: {
    experience: string;
    tone: string;
    hasPcos: boolean;
  };
}

/**
 * Get current periodization block for a given week
 */
function getCurrentBlock(framework: any, weekNumber: number) {
  const block = framework.blocks.find(
    (b: any) => weekNumber >= b.startWeek && weekNumber <= b.endWeek,
  );
  return block || framework.blocks[0]; // Fallback to first block
}

/**
 * Build aggregated context for weekly review
 */
export async function buildWeeklyContext({
  planId,
  weekNumber,
  userProfile,
}: {
  planId: string;
  weekNumber: number;
  userProfile: Partial<Profile>;
}): Promise<string> {
  // Analyze current week performance
  const currentPerformance = await analyzeWeekPerformance(planId, weekNumber);

  // Try to get previous week performance for comparison
  let previousPerformance = null;
  if (weekNumber > 1) {
    try {
      previousPerformance = await analyzeWeekPerformance(planId, weekNumber - 1);
    } catch {
      // Previous week may not exist or not be completed
      previousPerformance = null;
    }
  }

  // Get periodization framework
  const frameworkRow = await db.query.periodizationFrameworks.findFirst({
    where: eq(periodizationFrameworks.planId, planId),
  });

  if (!frameworkRow) {
    throw new Error(`No periodization framework found for plan ${planId}`);
  }

  const framework = frameworkRow.framework;
  const currentBlock = getCurrentBlock(framework, weekNumber);

  // Generate progression recommendations
  const progressionRec = generateProgressionRecommendations(
    currentPerformance,
    previousPerformance,
    currentBlock,
  );

  // Get top 5 exercises by volume
  const exerciseBreakdown = currentPerformance.exerciseBreakdown || {};
  const topExercises = Object.entries(exerciseBreakdown)
    .sort(([, a], [, b]) => b.sets - a.sets)
    .slice(0, 5)
    .map(([exerciseId, data]) => ({
      exerciseId,
      sets: data.sets,
      avgWeight: Math.round(data.avgWeight * 100) / 100,
    }));

  // Calculate week in block
  const weekInBlock = weekNumber - currentBlock.startWeek + 1;
  const totalBlockWeeks = currentBlock.endWeek - currentBlock.startWeek + 1;

  // Build context object
  const context: WeeklyReviewContext = {
    weekNumber,
    performance: {
      completionRate: currentPerformance.completionRate,
      avgRPE: currentPerformance.avgRPE,
      totalVolume: currentPerformance.totalVolume,
      totalTonnage: currentPerformance.totalTonnage,
      topExercises,
    },
    periodization: {
      currentBlock: {
        type: currentBlock.blockType,
        weekInBlock,
        totalBlockWeeks,
        volumeTarget: currentBlock.volumeTarget,
        intensityTarget: currentBlock.intensityTarget,
        repRanges: currentBlock.repRanges,
      },
    },
    progression: {
      shouldProgress: progressionRec.shouldProgress,
      shouldMaintain: progressionRec.shouldMaintain,
      shouldRegress: progressionRec.shouldRegress,
      reasoning: progressionRec.reasoning,
      recommendations: progressionRec.recommendations,
    },
    userContext: {
      experience: userProfile.experienceLevel || "beginner",
      tone: userProfile.coachTone || "concise",
      hasPcos: userProfile.hasPcos || false,
    },
  };

  return JSON.stringify(context, null, 2);
}

/**
 * Build user prompt for weekly review
 */
export function buildWeeklyPrompt({
  planId,
  weekNumber,
  context,
}: {
  planId: string;
  weekNumber: number;
  context: string;
}): string {
  const prompt = [
    `Generate a weekly review for Week ${weekNumber} based on the athlete's performance below.`,
    "",
    "Requirements:",
    "- Keep total length <= 100 words",
    "- Use encouraging tone aligned with user preferences",
    "- Highlight completion rate and key achievements",
    "- Reference periodization block context (accumulation/intensification/deload)",
    "- Include 1-2 actionable recommendations for next week",
    "- Stay concise and motivational",
    "",
    "Return JSON only with fields:",
    "- headline: string (max 80 chars) - e.g., 'Week 2: Strong Accumulation Phase'",
    "- bullets: array of 3-4 strings (max 120 chars each) - key insights and metrics",
    "- prompts: optional array of 1-2 strings (max 80 chars each) - questions or focus areas for next week",
    "",
    "Context:",
    context,
  ].join("\n");

  return prompt;
}
