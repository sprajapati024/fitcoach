import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { nutritionGoals, profiles } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { nutritionGoalsRequestSchema } from "@/lib/nutritionValidation";
import { calculateRecommendedGoals } from "@/lib/nutritionService";

/**
 * GET /api/nutrition/goals
 * Get user's nutrition goals
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [userGoals] = await db
      .select()
      .from(nutritionGoals)
      .where(eq(nutritionGoals.userId, user.id))
      .limit(1);

    if (!userGoals) {
      return NextResponse.json({ goals: null, message: "No goals set" });
    }

    return NextResponse.json({ goals: userGoals });
  } catch (error) {
    console.error("Error fetching nutrition goals:", error);
    return NextResponse.json({ error: "Failed to fetch goals" }, { status: 500 });
  }
}

/**
 * POST /api/nutrition/goals
 * Set or update nutrition goals
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = nutritionGoalsRequestSchema.parse(body);

    // Check if goals already exist
    const [existingGoals] = await db
      .select()
      .from(nutritionGoals)
      .where(eq(nutritionGoals.userId, user.id))
      .limit(1);

    if (existingGoals) {
      // Update existing goals
      const [updatedGoals] = await db
        .update(nutritionGoals)
        .set({
          ...(validatedData.targetCalories !== undefined && {
            targetCalories: validatedData.targetCalories,
          }),
          ...(validatedData.targetProteinGrams !== undefined && {
            targetProteinGrams: validatedData.targetProteinGrams?.toString(),
          }),
          ...(validatedData.targetCarbsGrams !== undefined && {
            targetCarbsGrams: validatedData.targetCarbsGrams?.toString(),
          }),
          ...(validatedData.targetFatGrams !== undefined && {
            targetFatGrams: validatedData.targetFatGrams?.toString(),
          }),
          ...(validatedData.targetWaterLiters !== undefined && {
            targetWaterLiters: validatedData.targetWaterLiters?.toString(),
          }),
          ...(validatedData.calculationMethod && {
            calculationMethod: validatedData.calculationMethod,
          }),
          updatedAt: new Date(),
        })
        .where(eq(nutritionGoals.id, existingGoals.id))
        .returning();

      return NextResponse.json({
        success: true,
        goals: updatedGoals,
        message: "Goals updated successfully",
      });
    } else {
      // Insert new goals
      const [insertedGoals] = await db
        .insert(nutritionGoals)
        .values({
          userId: user.id,
          targetCalories: validatedData.targetCalories,
          targetProteinGrams: validatedData.targetProteinGrams?.toString(),
          targetCarbsGrams: validatedData.targetCarbsGrams?.toString(),
          targetFatGrams: validatedData.targetFatGrams?.toString(),
          targetWaterLiters: validatedData.targetWaterLiters?.toString(),
          calculationMethod: validatedData.calculationMethod || "manual",
        })
        .returning();

      return NextResponse.json({
        success: true,
        goals: insertedGoals,
        message: "Goals set successfully",
      });
    }
  } catch (error) {
    console.error("Error setting nutrition goals:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid goals data", details: error }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to set goals" }, { status: 500 });
  }
}
