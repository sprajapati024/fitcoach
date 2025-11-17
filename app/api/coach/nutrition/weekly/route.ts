import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { nutritionGoals, nutritionCoachCache, profiles } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { getNutritionCoachSystemPrompt, weeklyReviewPromptTemplate } from "@/lib/ai/prompts";
import { callCoach } from "@/lib/ai/client";
import { coachResponseSchema, type CoachResponse } from "@/lib/validation";
import { getWeeklyNutritionTrends } from "@/lib/nutritionService";

/**
 * Get Monday of the current week (ISO week starting Monday)
 */
function getMonday(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split("T")[0]!;
}

/**
 * Get Sunday of the current week (ISO week ending Sunday)
 */
function getSunday(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() + (7 - day); // Days until Sunday
  const sunday = new Date(d.setDate(diff));
  return sunday.toISOString().split("T")[0]!;
}

/**
 * GET /api/coach/nutrition/weekly
 * Returns weekly nutrition review
 * Query params:
 *   - startDate: YYYY-MM-DD format (defaults to last Monday)
 *   - endDate: YYYY-MM-DD format (defaults to last Sunday)
 *   - refresh: boolean (force cache refresh)
 */
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get("refresh") === "true";

    // Default to current week (Monday-Sunday)
    const now = new Date();
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const startDate = startDateParam || getMonday(now);
    const endDate = endDateParam || getSunday(now);

    // Validate date formats
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return NextResponse.json({ error: "Invalid date format. Use YYYY-MM-DD" }, { status: 400 });
    }

    // Get user profile for coach tone preference
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, user.id),
    });

    const userCoachTone = (profile?.coachTone as "analyst" | "flirty") || "analyst";

    // Cache key includes date range and tone
    const cacheKey = `${startDate}-${endDate}-${userCoachTone}`;

    // Check cache (skip if refresh requested)
    if (!forceRefresh) {
      const cached = await db.query.nutritionCoachCache.findFirst({
        where: and(
          eq(nutritionCoachCache.userId, user.id),
          eq(nutritionCoachCache.context, "weekly_review"),
          eq(nutritionCoachCache.cacheKey, cacheKey),
        ),
      });

      // Check if cache is still valid (7 days TTL)
      if (cached?.payload && cached.expiresAt) {
        const now = new Date();
        if (new Date(cached.expiresAt) > now) {
          return NextResponse.json({
            success: true,
            coach: cached.payload as CoachResponse,
            weekStats: null, // Could enhance to include stats in cache
            cached: true,
            startDate,
            endDate,
            tone: userCoachTone,
          });
        }
      }
    }

    // Fetch nutrition goals
    const [goals] = await db
      .select()
      .from(nutritionGoals)
      .where(eq(nutritionGoals.userId, user.id))
      .limit(1);

    // Check if user has set goals
    if (!goals || !goals.targetCalories || !goals.targetProteinGrams) {
      return NextResponse.json({
        success: true,
        coach: {
          headline: "Set your nutrition goals to get weekly insights!",
          bullets: [
            "Weekly reviews help you spot patterns and optimize your nutrition strategy.",
            "Configure your targets in Settings to unlock personalized weekly coaching.",
          ],
          prompts: ["What nutrition goals do you want to achieve this week?"],
        },
        cached: false,
        startDate,
        endDate,
        tone: userCoachTone,
        requiresGoals: true,
      });
    }

    // Fetch weekly nutrition trends
    const trends = await getWeeklyNutritionTrends(user.id, startDate, endDate);

    // Check if no data logged this week
    if (!trends || trends.daysWithMeals === 0) {
      const encouragementMessage = userCoachTone === "flirty"
        ? {
            headline: "New week, fresh start! Let's get those meals logged! ✨",
            bullets: [
              "Consistency is key - tracking your nutrition helps you hit your goals faster.",
              "Start today and build momentum for the week ahead!",
            ],
            prompts: ["What's your nutrition focus for this week?"],
          }
        : {
            headline: "No nutrition data logged this week. Start tracking to get insights.",
            bullets: [
              "Log meals daily to track weekly trends and adherence patterns.",
              `Weekly targets: ${goals.targetProteinGrams}g protein | ${goals.targetCalories} calories per day`,
            ],
            prompts: ["What's preventing you from tracking this week?"],
          };

      return NextResponse.json({
        success: true,
        coach: encouragementMessage,
        weekStats: trends,
        cached: false,
        startDate,
        endDate,
        tone: userCoachTone,
        noData: true,
      });
    }

    // Calculate targets
    const proteinTarget = parseFloat(goals.targetProteinGrams.toString());
    const calorieTarget = goals.targetCalories;
    const carbTarget = goals.targetCarbsGrams ? parseFloat(goals.targetCarbsGrams.toString()) : undefined;
    const fatTarget = goals.targetFatGrams ? parseFloat(goals.targetFatGrams.toString()) : undefined;
    const fiberTarget = 25; // Default fiber target
    const waterTargetLiters = goals.targetWaterLiters ? parseFloat(goals.targetWaterLiters.toString()) : undefined;
    const waterTargetOz = waterTargetLiters ? Math.round(waterTargetLiters * 33.814) : undefined;

    // Calculate daily breakdown and target hits
    const dailyBreakdown = trends.dailySummaries.map((summary) => {
      const summaryProtein = parseFloat(summary.totalProtein?.toString() || "0") || 0;
      const summaryCalories = parseInt(summary.totalCalories?.toString() || "0") || 0;

      const hitProteinTarget = summaryProtein >= proteinTarget * 0.9; // 90% threshold
      const hitCalorieTarget = summaryCalories >= calorieTarget * 0.85 && summaryCalories <= calorieTarget * 1.15; // 85-115% range

      return {
        date: summary.summaryDate,
        calories: summaryCalories,
        protein: summaryProtein,
        hitProteinTarget,
        hitCalorieTarget,
      };
    });

    const proteinTargetHits = dailyBreakdown.filter((d) => d.hitProteinTarget).length;
    const calorieTargetHits = dailyBreakdown.filter((d) => d.hitCalorieTarget).length;

    // Prepare week data for prompt
    const weekData = {
      weekStart: startDate,
      weekEnd: endDate,
      avgCalories: trends.avgCalories,
      avgProtein: trends.avgProtein,
      avgCarbs: undefined, // Could enhance nutritionService to calculate this
      avgFat: undefined,
      avgFiber: undefined,
      avgWater: trends.avgWater ? trends.avgWater * 33.814 : undefined, // Convert L to oz
      daysLogged: trends.daysWithMeals,
      proteinTargetHits,
      calorieTargetHits,
      targets: {
        calories: calorieTarget,
        protein: proteinTarget,
        carbs: carbTarget,
        fat: fatTarget,
        fiber: fiberTarget,
        water: waterTargetOz,
      },
      dailyBreakdown,
      notes: undefined,
    };

    // Generate coach brief using OpenAI
    const systemPrompt = getNutritionCoachSystemPrompt(userCoachTone);
    const userPrompt = weeklyReviewPromptTemplate(weekData);

    const coachResult = await callCoach({
      systemPrompt,
      userPrompt,
      schema: coachResponseSchema,
      maxTokens: 500,
    });

    if (!coachResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: coachResult.error,
          fallback: "Keep up the consistency! Review your weekly trends and adjust as needed.",
        },
        { status: 500 },
      );
    }

    const payload = coachResult.data;

    // Cache response for 7 days
    const expires = new Date();
    expires.setTime(expires.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    await db
      .insert(nutritionCoachCache)
      .values({
        userId: user.id,
        context: "weekly_review",
        cacheKey: cacheKey,
        targetDate: startDate, // Use start date as target
        payload,
        expiresAt: expires,
      })
      .onConflictDoUpdate({
        target: [nutritionCoachCache.userId, nutritionCoachCache.context, nutritionCoachCache.cacheKey],
        set: {
          targetDate: startDate,
          payload,
          expiresAt: expires,
        },
      });

    return NextResponse.json({
      success: true,
      coach: payload,
      weekStats: {
        daysLogged: trends.daysWithMeals,
        avgCalories: trends.avgCalories,
        avgProtein: trends.avgProtein,
        adherence: trends.adherence,
        proteinTargetHits,
        calorieTargetHits,
      },
      cached: false,
      startDate,
      endDate,
      tone: userCoachTone,
    });
  } catch (error) {
    console.error("[Nutrition Coach Weekly] error", error);
    return NextResponse.json(
      {
        success: false,
        error: "Unable to load weekly nutrition review.",
        fallback: "Keep up the consistency! Review your weekly trends and adjust as needed.",
      },
      { status: 500 },
    );
  }
}
