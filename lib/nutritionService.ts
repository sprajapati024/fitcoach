import { db } from "./db";
import { meals, waterLogs, dailyNutritionSummaries, nutritionGoals } from "@/drizzle/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";

/**
 * Service functions for nutrition data management
 */

/**
 * Calculate and update daily nutrition summary for a specific date
 */
export async function updateDailyNutritionSummary(
  userId: string,
  date: string, // YYYY-MM-DD format
): Promise<void> {
  // Get all meals for the date
  const dayMeals = await db
    .select()
    .from(meals)
    .where(and(eq(meals.userId, userId), eq(meals.mealDate, date)));

  // Get all water logs for the date
  const dayWater = await db
    .select()
    .from(waterLogs)
    .where(and(eq(waterLogs.userId, userId), eq(waterLogs.logDate, date)));

  // Calculate totals
  const totalCalories = dayMeals.reduce(
    (sum, meal) => sum + (parseInt(meal.calories?.toString() || "0") || 0),
    0,
  );
  const totalProtein = dayMeals.reduce(
    (sum, meal) => sum + (parseFloat(meal.proteinGrams?.toString() || "0") || 0),
    0,
  );
  const totalCarbs = dayMeals.reduce(
    (sum, meal) => sum + (parseFloat(meal.carbsGrams?.toString() || "0") || 0),
    0,
  );
  const totalFat = dayMeals.reduce(
    (sum, meal) => sum + (parseFloat(meal.fatGrams?.toString() || "0") || 0),
    0,
  );
  const totalFiber = dayMeals.reduce(
    (sum, meal) => sum + (parseFloat(meal.fiberGrams?.toString() || "0") || 0),
    0,
  );
  const totalWaterMl = dayWater.reduce(
    (sum, log) => sum + (parseInt(log.amountMl?.toString() || "0") || 0),
    0,
  );

  // Upsert daily summary
  const existing = await db
    .select()
    .from(dailyNutritionSummaries)
    .where(
      and(
        eq(dailyNutritionSummaries.userId, userId),
        eq(dailyNutritionSummaries.summaryDate, date),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    // Update existing
    await db
      .update(dailyNutritionSummaries)
      .set({
        totalCalories,
        totalProtein: totalProtein.toFixed(1),
        totalCarbs: totalCarbs.toFixed(1),
        totalFat: totalFat.toFixed(1),
        totalFiber: totalFiber.toFixed(1),
        totalWaterMl,
        mealsLogged: dayMeals.length,
        updatedAt: new Date(),
      })
      .where(eq(dailyNutritionSummaries.id, existing[0].id));
  } else {
    // Insert new
    await db.insert(dailyNutritionSummaries).values({
      userId,
      summaryDate: date,
      totalCalories,
      totalProtein: totalProtein.toFixed(1),
      totalCarbs: totalCarbs.toFixed(1),
      totalFat: totalFat.toFixed(1),
      totalFiber: totalFiber.toFixed(1),
      totalWaterMl,
      mealsLogged: dayMeals.length,
    });
  }
}

/**
 * Get daily nutrition summary with meals
 */
export async function getDailyNutrition(userId: string, date: string) {
  const [summary] = await db
    .select()
    .from(dailyNutritionSummaries)
    .where(
      and(
        eq(dailyNutritionSummaries.userId, userId),
        eq(dailyNutritionSummaries.summaryDate, date),
      ),
    )
    .limit(1);

  const dayMeals = await db
    .select()
    .from(meals)
    .where(and(eq(meals.userId, userId), eq(meals.mealDate, date)))
    .orderBy(meals.mealTime);

  return {
    summary: summary || null,
    meals: dayMeals,
  };
}

/**
 * Get user's nutrition goals
 */
export async function getNutritionGoals(userId: string) {
  const [goals] = await db
    .select()
    .from(nutritionGoals)
    .where(eq(nutritionGoals.userId, userId))
    .limit(1);

  return goals || null;
}

/**
 * Calculate recommended nutrition goals based on user profile
 * This is a simplified version - can be enhanced with more sophisticated calculations
 */
export async function calculateRecommendedGoals(
  profile: {
    weightKg: number;
    heightCm: number;
    sex: string;
    dateOfBirth: string;
    goalBias: string;
    hasPcos: boolean;
  },
  activityLevel: "sedentary" | "moderate" | "active" = "moderate",
): Promise<{
  targetCalories: number;
  targetProteinGrams: number;
  targetCarbsGrams: number;
  targetFatGrams: number;
  targetWaterLiters: number;
}> {
  const weight = parseFloat(profile.weightKg.toString());
  const height = parseFloat(profile.heightCm.toString());
  const age = new Date().getFullYear() - new Date(profile.dateOfBirth).getFullYear();

  // Calculate BMR using Mifflin-St Jeor equation
  let bmr: number;
  if (profile.sex === "male") {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  // Apply activity multiplier
  const activityMultipliers = {
    sedentary: 1.2,
    moderate: 1.55,
    active: 1.725,
  };
  let tdee = bmr * activityMultipliers[activityLevel];

  // Adjust based on goal
  if (profile.goalBias === "fat_loss") {
    tdee *= 0.8; // 20% deficit
  } else if (profile.goalBias === "hypertrophy") {
    tdee *= 1.1; // 10% surplus
  }

  const targetCalories = Math.round(tdee);

  // Macros distribution
  let proteinPercent = 0.3; // 30%
  let carbsPercent = 0.4; // 40%
  let fatPercent = 0.3; // 30%

  // Adjust for PCOS - higher protein, lower carbs
  if (profile.hasPcos) {
    proteinPercent = 0.35;
    carbsPercent = 0.35;
    fatPercent = 0.3;
  }

  // Adjust for goal
  if (profile.goalBias === "strength" || profile.goalBias === "hypertrophy") {
    proteinPercent = 0.35;
  }

  const targetProteinGrams = Math.round((targetCalories * proteinPercent) / 4);
  const targetCarbsGrams = Math.round((targetCalories * carbsPercent) / 4);
  const targetFatGrams = Math.round((targetCalories * fatPercent) / 9);

  // Water recommendation: 30-35ml per kg body weight
  const targetWaterLiters = Math.round((weight * 0.033) * 10) / 10;

  return {
    targetCalories,
    targetProteinGrams,
    targetCarbsGrams,
    targetFatGrams,
    targetWaterLiters,
  };
}

/**
 * Get weekly nutrition trends
 */
export async function getWeeklyNutritionTrends(
  userId: string,
  startDate: string,
  endDate: string,
) {
  const summaries = await db
    .select()
    .from(dailyNutritionSummaries)
    .where(
      and(
        eq(dailyNutritionSummaries.userId, userId),
        gte(dailyNutritionSummaries.summaryDate, startDate),
        lte(dailyNutritionSummaries.summaryDate, endDate),
      ),
    )
    .orderBy(dailyNutritionSummaries.summaryDate);

  const totalDays = summaries.length;
  const daysWithMeals = summaries.filter((s) => (s.mealsLogged || 0) > 0).length;

  const avgCalories =
    totalDays > 0
      ? Math.round(
          summaries.reduce((sum, s) => sum + (parseInt(s.totalCalories?.toString() || "0") || 0), 0) /
            totalDays,
        )
      : 0;

  const avgProtein =
    totalDays > 0
      ? Math.round(
          summaries.reduce(
            (sum, s) => sum + (parseFloat(s.totalProtein?.toString() || "0") || 0),
            0,
          ) / totalDays,
        )
      : 0;

  const avgWater =
    totalDays > 0
      ? Math.round(
          summaries.reduce((sum, s) => sum + (parseInt(s.totalWaterMl?.toString() || "0") || 0), 0) /
            totalDays /
            1000,
        )
      : 0;

  return {
    totalDays,
    daysWithMeals,
    adherence: totalDays > 0 ? Math.round((daysWithMeals / totalDays) * 100) : 0,
    avgCalories,
    avgProtein,
    avgWater,
    dailySummaries: summaries,
  };
}
