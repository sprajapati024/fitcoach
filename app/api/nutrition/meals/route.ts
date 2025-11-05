import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { meals } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq, and, gte, lte } from "drizzle-orm";
import { logMealRequestSchema, updateMealRequestSchema } from "@/lib/nutritionValidation";
import { updateDailyNutritionSummary } from "@/lib/nutritionService";

/**
 * GET /api/nutrition/meals
 * Fetch user's meals within a date range
 */
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const mealDate = searchParams.get("date");

    let query = db.select().from(meals).where(eq(meals.userId, user.id));

    if (mealDate) {
      // Get meals for a specific date
      const dayMeals = await query.where(eq(meals.mealDate, mealDate)).orderBy(meals.mealTime);
      return NextResponse.json({ meals: dayMeals });
    }

    if (startDate && endDate) {
      // Get meals within date range
      const rangeMeals = await query
        .where(
          and(
            eq(meals.userId, user.id),
            gte(meals.mealDate, startDate),
            lte(meals.mealDate, endDate),
          ),
        )
        .orderBy(meals.mealDate, meals.mealTime);
      return NextResponse.json({ meals: rangeMeals });
    }

    // Default: get today's meals
    const today = new Date().toISOString().split("T")[0];
    const todayMeals = await query.where(eq(meals.mealDate, today)).orderBy(meals.mealTime);

    return NextResponse.json({ meals: todayMeals });
  } catch (error) {
    console.error("Error fetching meals:", error);
    return NextResponse.json({ error: "Failed to fetch meals" }, { status: 500 });
  }
}

/**
 * POST /api/nutrition/meals
 * Log a new meal
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = logMealRequestSchema.parse(body);

    // Insert meal
    const [insertedMeal] = await db
      .insert(meals)
      .values({
        userId: user.id,
        mealDate: validatedData.mealDate,
        mealTime: new Date(validatedData.mealTime),
        mealType: validatedData.mealType,
        description: validatedData.description,
        photoUrl: validatedData.photoUrl,
        calories: validatedData.calories,
        proteinGrams: validatedData.proteinGrams?.toString(),
        carbsGrams: validatedData.carbsGrams?.toString(),
        fatGrams: validatedData.fatGrams?.toString(),
        fiberGrams: validatedData.fiberGrams?.toString(),
        notes: validatedData.notes,
        source: validatedData.source,
      })
      .returning();

    // Update daily summary
    await updateDailyNutritionSummary(user.id, validatedData.mealDate);

    return NextResponse.json({
      success: true,
      meal: insertedMeal,
      message: "Meal logged successfully",
    });
  } catch (error) {
    console.error("Error logging meal:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid meal data", details: error }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to log meal" }, { status: 500 });
  }
}

/**
 * PATCH /api/nutrition/meals/:id
 * Update an existing meal
 */
export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mealId = searchParams.get("id");

    if (!mealId) {
      return NextResponse.json({ error: "Meal ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = updateMealRequestSchema.parse(body);

    // Verify meal belongs to user
    const [existingMeal] = await db
      .select()
      .from(meals)
      .where(and(eq(meals.id, mealId), eq(meals.userId, user.id)))
      .limit(1);

    if (!existingMeal) {
      return NextResponse.json({ error: "Meal not found" }, { status: 404 });
    }

    // Update meal
    const [updatedMeal] = await db
      .update(meals)
      .set({
        ...(validatedData.mealDate && { mealDate: validatedData.mealDate }),
        ...(validatedData.mealTime && { mealTime: new Date(validatedData.mealTime) }),
        ...(validatedData.mealType && { mealType: validatedData.mealType }),
        ...(validatedData.description && { description: validatedData.description }),
        ...(validatedData.photoUrl !== undefined && { photoUrl: validatedData.photoUrl }),
        ...(validatedData.calories !== undefined && { calories: validatedData.calories }),
        ...(validatedData.proteinGrams !== undefined && {
          proteinGrams: validatedData.proteinGrams?.toString(),
        }),
        ...(validatedData.carbsGrams !== undefined && {
          carbsGrams: validatedData.carbsGrams?.toString(),
        }),
        ...(validatedData.fatGrams !== undefined && {
          fatGrams: validatedData.fatGrams?.toString(),
        }),
        ...(validatedData.fiberGrams !== undefined && {
          fiberGrams: validatedData.fiberGrams?.toString(),
        }),
        ...(validatedData.notes !== undefined && { notes: validatedData.notes }),
      })
      .where(eq(meals.id, mealId))
      .returning();

    // Update daily summary
    const mealDate = validatedData.mealDate || existingMeal.mealDate;
    await updateDailyNutritionSummary(user.id, mealDate);

    // If date changed, update old date summary too
    if (validatedData.mealDate && validatedData.mealDate !== existingMeal.mealDate) {
      await updateDailyNutritionSummary(user.id, existingMeal.mealDate);
    }

    return NextResponse.json({
      success: true,
      meal: updatedMeal,
      message: "Meal updated successfully",
    });
  } catch (error) {
    console.error("Error updating meal:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid meal data", details: error }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update meal" }, { status: 500 });
  }
}

/**
 * DELETE /api/nutrition/meals/:id
 * Delete a meal
 */
export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mealId = searchParams.get("id");

    if (!mealId) {
      return NextResponse.json({ error: "Meal ID is required" }, { status: 400 });
    }

    // Verify meal belongs to user and get date for summary update
    const [existingMeal] = await db
      .select()
      .from(meals)
      .where(and(eq(meals.id, mealId), eq(meals.userId, user.id)))
      .limit(1);

    if (!existingMeal) {
      return NextResponse.json({ error: "Meal not found" }, { status: 404 });
    }

    // Delete meal
    await db.delete(meals).where(eq(meals.id, mealId));

    // Update daily summary
    await updateDailyNutritionSummary(user.id, existingMeal.mealDate);

    return NextResponse.json({
      success: true,
      message: "Meal deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting meal:", error);
    return NextResponse.json({ error: "Failed to delete meal" }, { status: 500 });
  }
}
