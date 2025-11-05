import { z } from "zod";

/**
 * Validation schemas for nutrition API endpoints
 */

// Meal type enum
export const mealTypeSchema = z.enum(["breakfast", "lunch", "dinner", "snack"]);

// Source enum
export const mealSourceSchema = z.enum(["manual", "ai", "photo", "voice"]);

// Log meal request
export const logMealRequestSchema = z.object({
  mealDate: z.string(), // ISO date string (YYYY-MM-DD)
  mealTime: z.string(), // ISO timestamp
  mealType: mealTypeSchema,
  description: z.string().min(1, "Description is required").max(1000),
  photoUrl: z.string().optional(),
  calories: z.number().int().min(0).max(10000).optional(),
  proteinGrams: z.number().min(0).max(500).optional(),
  carbsGrams: z.number().min(0).max(1000).optional(),
  fatGrams: z.number().min(0).max(500).optional(),
  fiberGrams: z.number().min(0).max(200).optional(),
  notes: z.string().max(500).optional(),
  source: mealSourceSchema.default("manual"),
});

export type LogMealRequest = z.infer<typeof logMealRequestSchema>;

// Update meal request
export const updateMealRequestSchema = z.object({
  mealDate: z.string().optional(),
  mealTime: z.string().optional(),
  mealType: mealTypeSchema.optional(),
  description: z.string().min(1).max(1000).optional(),
  photoUrl: z.string().optional(),
  calories: z.number().int().min(0).max(10000).optional(),
  proteinGrams: z.number().min(0).max(500).optional(),
  carbsGrams: z.number().min(0).max(1000).optional(),
  fatGrams: z.number().min(0).max(500).optional(),
  fiberGrams: z.number().min(0).max(200).optional(),
  notes: z.string().max(500).optional(),
});

export type UpdateMealRequest = z.infer<typeof updateMealRequestSchema>;

// Log water request
export const logWaterRequestSchema = z.object({
  logDate: z.string(), // ISO date string (YYYY-MM-DD)
  amountMl: z.number().int().min(1).max(5000), // 1ml to 5L
});

export type LogWaterRequest = z.infer<typeof logWaterRequestSchema>;

// Nutrition goals request
export const nutritionGoalsRequestSchema = z.object({
  targetCalories: z.number().int().min(500).max(10000).optional(),
  targetProteinGrams: z.number().min(0).max(500).optional(),
  targetCarbsGrams: z.number().min(0).max(1000).optional(),
  targetFatGrams: z.number().min(0).max(500).optional(),
  targetWaterLiters: z.number().min(0).max(10).optional(),
  calculationMethod: z.enum(["manual", "ai_recommended"]).optional(),
});

export type NutritionGoalsRequest = z.infer<typeof nutritionGoalsRequestSchema>;

// AI meal analysis request
export const analyzeMealRequestSchema = z.object({
  mealDescription: z.string().min(1, "Meal description is required").max(1000),
});

export type AnalyzeMealRequest = z.infer<typeof analyzeMealRequestSchema>;

// AI meal analysis response
export const analyzeMealResponseSchema = z.object({
  estimatedNutrition: z.object({
    calories: z.number().int(),
    proteinGrams: z.number(),
    carbsGrams: z.number(),
    fatGrams: z.number(),
    fiberGrams: z.number().optional(),
  }),
  breakdown: z.array(z.string()),
  suggestion: z.string().optional(),
});

export type AnalyzeMealResponse = z.infer<typeof analyzeMealResponseSchema>;

// Daily nutrition summary response
export const dailyNutritionSummarySchema = z.object({
  date: z.string(),
  totalCalories: z.number(),
  totalProtein: z.number(),
  totalCarbs: z.number(),
  totalFat: z.number(),
  totalFiber: z.number(),
  totalWaterMl: z.number(),
  mealsLogged: z.number(),
  meals: z.array(
    z.object({
      id: z.string(),
      mealType: mealTypeSchema,
      mealTime: z.string(),
      description: z.string(),
      calories: z.number().nullable(),
      proteinGrams: z.number().nullable(),
      carbsGrams: z.number().nullable(),
      fatGrams: z.number().nullable(),
      fiberGrams: z.number().nullable(),
      notes: z.string().nullable(),
    }),
  ),
});

export type DailyNutritionSummary = z.infer<typeof dailyNutritionSummarySchema>;

// Coach brief response
export const nutritionCoachBriefSchema = z.object({
  headline: z.string(),
  bullets: z.array(z.string()).max(3),
  prompts: z.array(z.string()).max(2).optional(),
});

export type NutritionCoachBrief = z.infer<typeof nutritionCoachBriefSchema>;
