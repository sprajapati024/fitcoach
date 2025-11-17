import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { dailyNutritionSummaries, meals, nutritionGoals, nutritionCoachCache, profiles } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { getNutritionCoachSystemPrompt, dailySummaryPromptTemplate } from "@/lib/ai/prompts";
import { callCoach } from "@/lib/ai/client";
import { coachResponseSchema, type CoachResponse } from "@/lib/validation";

function isoToday(): string {
  const now = new Date();
  const utc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  return utc.toISOString().split("T")[0]!;
}

/**
 * GET /api/coach/nutrition/today
 * Returns daily nutrition coach brief
 * Query params:
 *   - date: YYYY-MM-DD format (defaults to today)
 *   - refresh: boolean (force cache refresh)
 */
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const forceRefresh = searchParams.get("refresh") === "true";
    const targetDate = dateParam || isoToday();

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(targetDate)) {
      return NextResponse.json({ error: "Invalid date format. Use YYYY-MM-DD" }, { status: 400 });
    }

    // Get user profile for coach tone preference
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, user.id),
    });

    const userCoachTone = (profile?.coachTone as "analyst" | "flirty") || "analyst";

    // Cache key includes date and tone
    const cacheKey = `${targetDate}-${userCoachTone}`;

    // Check cache (skip if refresh requested)
    if (!forceRefresh) {
      const cached = await db.query.nutritionCoachCache.findFirst({
        where: and(
          eq(nutritionCoachCache.userId, user.id),
          eq(nutritionCoachCache.context, "daily_summary"),
          eq(nutritionCoachCache.cacheKey, cacheKey),
        ),
      });

      // Check if cache is still valid (1 hour TTL)
      if (cached?.payload && cached.expiresAt) {
        const now = new Date();
        if (new Date(cached.expiresAt) > now) {
          return NextResponse.json({
            success: true,
            coach: cached.payload as CoachResponse,
            cached: true,
            date: targetDate,
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
          headline: "Let's set your nutrition goals first!",
          bullets: [
            "Setting personalized nutrition targets will help you track progress and stay consistent.",
            "Head to Settings to configure your calorie and macro goals based on your training and lifestyle.",
          ],
          prompts: ["What are your main nutrition goals right now?"],
        },
        cached: false,
        date: targetDate,
        tone: userCoachTone,
        requiresGoals: true,
      });
    }

    // Fetch daily summary
    const [summary] = await db
      .select()
      .from(dailyNutritionSummaries)
      .where(
        and(
          eq(dailyNutritionSummaries.userId, user.id),
          eq(dailyNutritionSummaries.summaryDate, targetDate),
        ),
      )
      .limit(1);

    // Fetch meals for the date
    const dayMeals = await db
      .select()
      .from(meals)
      .where(and(eq(meals.userId, user.id), eq(meals.mealDate, targetDate)))
      .orderBy(meals.mealTime);

    // Check if no meals logged
    if (!dayMeals || dayMeals.length === 0) {
      const encouragementMessage = userCoachTone === "flirty"
        ? {
            headline: "Ready to fuel your day? Let's log that first meal! 💪",
            bullets: [
              "Start tracking your nutrition today - even one meal helps build the habit!",
              "Log what you eat to get personalized insights and stay on track with your goals.",
            ],
            prompts: ["What are you having for your next meal?"],
          }
        : {
            headline: "No meals logged yet today. Start tracking to get insights.",
            bullets: [
              "Log your first meal to begin tracking daily macros and progress.",
              `Protein target: ${goals.targetProteinGrams}g | Calories: ${goals.targetCalories}`,
            ],
            prompts: ["What did you eat so far today?"],
          };

      return NextResponse.json({
        success: true,
        coach: encouragementMessage,
        cached: false,
        date: targetDate,
        tone: userCoachTone,
        noMeals: true,
      });
    }

    // Prepare nutrition data for prompt
    const totalCalories = summary?.totalCalories || 0;
    const totalProtein = parseFloat(summary?.totalProtein?.toString() || "0") || 0;
    const totalCarbs = summary?.totalCarbs ? parseFloat(summary.totalCarbs.toString()) : undefined;
    const totalFat = summary?.totalFat ? parseFloat(summary.totalFat.toString()) : undefined;
    const totalFiber = summary?.totalFiber ? parseFloat(summary.totalFiber.toString()) : undefined;
    const totalWaterMl = summary?.totalWaterMl || 0;

    // Convert water to oz (1 ml = 0.033814 oz)
    const totalWaterOz = Math.round(totalWaterMl * 0.033814);
    const waterTargetOz = goals.targetWaterLiters ? Math.round(parseFloat(goals.targetWaterLiters.toString()) * 33.814) : undefined;

    // Prepare user data for prompt
    const userData = {
      name: profile?.fullName || undefined,
      proteinTarget: parseFloat(goals.targetProteinGrams.toString()),
      calorieTarget: goals.targetCalories,
      carbTarget: goals.targetCarbsGrams ? parseFloat(goals.targetCarbsGrams.toString()) : undefined,
      fatTarget: goals.targetFatGrams ? parseFloat(goals.targetFatGrams.toString()) : undefined,
      fiberTarget: 25, // Default fiber target
      waterTarget: waterTargetOz,
    };

    const nutritionData = {
      date: targetDate,
      calories: totalCalories,
      protein: totalProtein,
      carbs: totalCarbs,
      fat: totalFat,
      fiber: totalFiber,
      water: totalWaterOz,
      meals: dayMeals.map((meal) => ({
        name: meal.description || "Meal",
        time: meal.mealTime ? new Date(meal.mealTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : undefined,
        calories: parseInt(meal.calories?.toString() || "0") || 0,
        protein: parseFloat(meal.proteinGrams?.toString() || "0") || 0,
        foods: meal.notes ? [meal.notes] : undefined,
      })),
    };

    // Generate coach brief using OpenAI
    const systemPrompt = getNutritionCoachSystemPrompt(userCoachTone);
    const userPrompt = dailySummaryPromptTemplate(userData, nutritionData);

    const coachResult = await callCoach({
      systemPrompt,
      userPrompt,
      schema: coachResponseSchema,
      maxTokens: 400,
    });

    if (!coachResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: coachResult.error,
          fallback: "Keep tracking your nutrition and stay consistent with your goals!",
        },
        { status: 500 },
      );
    }

    const payload = coachResult.data;

    // Cache response for 1 hour
    const expires = new Date();
    expires.setTime(expires.getTime() + 60 * 60 * 1000); // 1 hour from now

    await db
      .insert(nutritionCoachCache)
      .values({
        userId: user.id,
        context: "daily_summary",
        cacheKey: cacheKey,
        targetDate: targetDate,
        payload,
        expiresAt: expires,
      })
      .onConflictDoUpdate({
        target: [nutritionCoachCache.userId, nutritionCoachCache.context, nutritionCoachCache.cacheKey],
        set: {
          targetDate: targetDate,
          payload,
          expiresAt: expires,
        },
      });

    return NextResponse.json({
      success: true,
      coach: payload,
      cached: false,
      date: targetDate,
      tone: userCoachTone,
    });
  } catch (error) {
    console.error("[Nutrition Coach Today] error", error);
    return NextResponse.json(
      {
        success: false,
        error: "Unable to load nutrition coach brief.",
        fallback: "Keep tracking your nutrition and stay consistent with your goals!",
      },
      { status: 500 },
    );
  }
}
