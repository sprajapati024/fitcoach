import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userExercises } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

/**
 * GET /api/exercises
 * Fetch user's saved exercises
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const exercises = await db
      .select()
      .from(userExercises)
      .where(eq(userExercises.userId, user.id));

    return NextResponse.json({ exercises });
  } catch (error) {
    console.error("Error fetching user exercises:", error);
    return NextResponse.json(
      { error: "Failed to fetch exercises" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/exercises
 * Add an exercise to user's library
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      exerciseId,
      name,
      description,
      instructions,
      imageUrl,
      videoUrl,
      gifUrl,
      equipment,
      bodyParts,
      targetMuscles,
      secondaryMuscles,
      exerciseType,
      source,
      isPcosSafe,
      impactLevel,
    } = body;

    // Check if exercise already exists for this user
    const existing = await db
      .select()
      .from(userExercises)
      .where(
        and(
          eq(userExercises.userId, user.id),
          eq(userExercises.exerciseId, exerciseId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Exercise already in your library" },
        { status: 400 }
      );
    }

    // Insert new exercise
    const [inserted] = await db
      .insert(userExercises)
      .values({
        userId: user.id,
        exerciseId,
        name,
        description,
        instructions: instructions || [],
        imageUrl,
        videoUrl,
        gifUrl,
        equipment: equipment || [],
        bodyParts: bodyParts || [],
        targetMuscles: targetMuscles || [],
        secondaryMuscles: secondaryMuscles || [],
        exerciseType,
        source: source || "exercisedb",
        isPcosSafe: isPcosSafe ?? true,
        impactLevel,
      })
      .returning();

    return NextResponse.json({
      success: true,
      exercise: inserted,
    });
  } catch (error) {
    console.error("Error adding exercise:", error);
    return NextResponse.json(
      { error: "Failed to add exercise" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/exercises
 * Remove an exercise from user's library
 */
export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const exerciseId = searchParams.get("exerciseId");

    if (!exerciseId) {
      return NextResponse.json(
        { error: "exerciseId is required" },
        { status: 400 }
      );
    }

    await db
      .delete(userExercises)
      .where(
        and(
          eq(userExercises.userId, user.id),
          eq(userExercises.exerciseId, exerciseId)
        )
      );

    return NextResponse.json({
      success: true,
      message: "Exercise removed from library",
    });
  } catch (error) {
    console.error("Error removing exercise:", error);
    return NextResponse.json(
      { error: "Failed to remove exercise" },
      { status: 500 }
    );
  }
}
