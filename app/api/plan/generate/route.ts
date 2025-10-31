import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";
import { db } from "@/lib/db";
import { profiles, plans, workouts } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { buildPlannerPrompt } from "@/lib/ai/buildPrompt";
import { callPlanner } from "@/lib/ai/client";
import { postProcessPlannerResponse } from "@/lib/ai/postProcessor";
import { plannerResponseSchema } from "@/lib/validation";
import { plannerSystemPrompt } from "@/lib/ai/prompts";
import { expandPlannerResponse } from "@/lib/calendar";
import { createPlanId } from "@/lib/ids";

export async function POST(request: Request) {
  try {
    // Authenticate user
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const [userProfile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, user.id))
      .limit(1);

    if (!userProfile) {
      return NextResponse.json(
        { error: "Profile not found. Please complete onboarding first." },
        { status: 400 }
      );
    }

    // Validate profile has required fields
    if (
      !userProfile.scheduleDaysPerWeek ||
      !userProfile.scheduleMinutesPerSession ||
      !userProfile.scheduleWeeks
    ) {
      return NextResponse.json(
        { error: "Incomplete profile. Please complete all onboarding steps." },
        { status: 400 }
      );
    }

    console.log("[Plan Generation] Starting for user:", user.id);

    // Build planner prompt
    const userPrompt = buildPlannerPrompt(userProfile);
    console.log("[Plan Generation] Prompt built, calling OpenAI...");

    // Call OpenAI planner
    const aiResult = await callPlanner({
      systemPrompt: plannerSystemPrompt,
      userPrompt,
      schema: plannerResponseSchema,
    });

    if (!aiResult.success) {
      console.error("[Plan Generation] AI call failed:", aiResult.error);
      return NextResponse.json(
        { error: `Plan generation failed: ${aiResult.error}` },
        { status: 500 }
      );
    }

    console.log("[Plan Generation] AI response received, post-processing...");

    // Post-process response (enforce PCOS guardrails, time budgets)
    const postProcessResult = postProcessPlannerResponse(aiResult.data, {
      hasPcos: userProfile.hasPcos,
      targetMinutesPerSession: userProfile.scheduleMinutesPerSession,
      daysPerWeek: userProfile.scheduleDaysPerWeek,
      noHighImpact: userProfile.noHighImpact,
    });

    if (!postProcessResult.success || !postProcessResult.data) {
      console.error("[Plan Generation] Post-processing failed:", postProcessResult.error);
      return NextResponse.json(
        { error: `Post-processing failed: ${postProcessResult.error}` },
        { status: 500 }
      );
    }

    const plannerResponse = postProcessResult.data;
    const warnings = postProcessResult.warnings || [];

    console.log("[Plan Generation] Post-processing complete. Warnings:", warnings);

    // Generate plan ID
    const planId = createPlanId();

    // Expand planner response to full calendar and workouts
    console.log("[Plan Generation] Expanding microcycle to calendar...");
    const { microcycle, calendar, workouts: workoutInstances } = expandPlannerResponse(
      plannerResponse,
      {
        planId,
        userId: user.id,
        startDate: new Date().toISOString().slice(0, 10), // Default start date (can be changed later)
        preferredDays: userProfile.preferredDays || [],
      }
    );

    console.log(
      `[Plan Generation] Generated ${workoutInstances.length} workout instances across ${calendar.weeks.length} weeks`
    );

    // Save plan to database
    console.log("[Plan Generation] Saving to database...");
    const [createdPlan] = await db
      .insert(plans)
      .values({
        userId: user.id,
        title: `FitCoach Plan - ${microcycle.weeks} weeks`,
        summary: plannerResponse.summary,
        status: "draft",
        active: false,
        durationWeeks: microcycle.weeks,
        daysPerWeek: microcycle.daysPerWeek,
        minutesPerSession: userProfile.scheduleMinutesPerSession,
        preferredDays: userProfile.preferredDays || [],
        microcycle: microcycle as any,
        calendar: calendar as any,
        plannerVersion: "o4-mini",
        generatedBy: "planner",
      })
      .returning();

    // Save workout instances
    if (workoutInstances.length > 0) {
      await db.insert(workouts).values(workoutInstances);
    }

    console.log("[Plan Generation] Success! Plan ID:", planId);

    return NextResponse.json({
      success: true,
      plan: {
        id: createdPlan.id,
        title: createdPlan.title,
        summary: createdPlan.summary,
        weeks: microcycle.weeks,
        daysPerWeek: microcycle.daysPerWeek,
        status: createdPlan.status,
        workoutCount: workoutInstances.length,
      },
      warnings,
      cues: plannerResponse.cues,
    });
  } catch (error) {
    console.error("[Plan Generation] Unexpected error:", error);
    return NextResponse.json(
      {
        error: "An unexpected error occurred during plan generation",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
