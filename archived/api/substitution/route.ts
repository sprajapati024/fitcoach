import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";
import { db } from "@/lib/db";
import { profiles, substitutionEvents, workouts } from "@/drizzle/schema";
import { buildSubstitutionPrompt } from "@/lib/ai/substitution-builder";
import { substitutionSystemPrompt } from "@/lib/ai/prompts";
import { callCoach } from "@/lib/ai/client";
import { substitutionRequestSchema, substitutionResponseSchema, type SubstitutionResponse } from "@/lib/validation";
import { getExercise } from "@/lib/exerciseLibrary";

export async function POST(request: Request) {
  try {
    // Authenticate user
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = substitutionRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request",
          details: validation.error.issues,
        },
        { status: 400 },
      );
    }

    const { planId, workoutId, exerciseId, reason } = validation.data;

    // Verify workout belongs to user
    const workout = await db.query.workouts.findFirst({
      where: eq(workouts.id, workoutId),
    });

    if (!workout || workout.userId !== user.id || workout.planId !== planId) {
      return NextResponse.json(
        {
          success: false,
          error: "Workout not found or unauthorized",
        },
        { status: 404 },
      );
    }

    // Get user profile for constraints
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, user.id),
    });

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          error: "User profile not found",
        },
        { status: 404 },
      );
    }

    // Get original exercise details
    const originalExercise = getExercise(exerciseId);
    if (!originalExercise) {
      return NextResponse.json(
        {
          success: false,
          error: `Exercise not found: ${exerciseId}`,
        },
        { status: 404 },
      );
    }

    // Build prompt for AI
    const userPrompt = buildSubstitutionPrompt({
      exerciseId,
      reason,
      userProfile: profile,
    });

    // Call AI to get substitution suggestions
    const aiResult = await callCoach({
      systemPrompt: substitutionSystemPrompt,
      userPrompt,
      schema: substitutionResponseSchema,
      maxTokens: 500,
    });

    if (!aiResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: aiResult.error,
          fallback: "Unable to generate substitutions. Please try again.",
        },
        { status: 500 },
      );
    }

    const aiResponse = aiResult.data as SubstitutionResponse;

    // Enrich alternatives with full exercise details
    const enrichedAlternatives = aiResponse.alternatives.map((alt) => {
      const exercise = getExercise(alt.exerciseId);
      return {
        exerciseId: alt.exerciseId,
        exerciseName: exercise?.name || alt.exerciseId,
        equipment: exercise?.equipment || "unknown",
        movement: exercise?.movement || "unknown",
        impact: exercise?.impact || "unknown",
        isPcosFriendly: exercise?.isPcosFriendly ?? false,
        rationale: alt.rationale,
      };
    });

    // Log substitution event
    const replacementIds = enrichedAlternatives.map((alt) => alt.exerciseId);
    await db.insert(substitutionEvents).values({
      userId: user.id,
      planId,
      workoutId,
      exerciseId,
      replacementIds,
    });

    // Return response
    return NextResponse.json({
      success: true,
      originalExercise: {
        id: originalExercise.id,
        name: originalExercise.name,
        movement: originalExercise.movement,
        equipment: originalExercise.equipment,
        primaryMuscle: originalExercise.primaryMuscle,
      },
      alternatives: enrichedAlternatives,
    });
  } catch (error) {
    console.error("[Substitution API] error", error);
    return NextResponse.json(
      {
        success: false,
        error: "Unable to generate exercise substitutions.",
      },
      { status: 500 },
    );
  }
}
