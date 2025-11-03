import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";
import { db } from "@/lib/db";
import { coachCache, plans, profiles } from "@/drizzle/schema";
import { buildWeeklyContext, buildWeeklyPrompt } from "@/lib/ai/weekly-context-builder";
import { coachSystemPrompt } from "@/lib/ai/prompts";
import { callCoach } from "@/lib/ai/client";
import { coachResponseSchema, type CoachResponse } from "@/lib/validation";

export async function GET(request: Request) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get("planId");
    const weekNumberStr = searchParams.get("weekNumber");

    if (!planId || !weekNumberStr) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required parameters: planId and weekNumber",
        },
        { status: 400 },
      );
    }

    const weekNumber = parseInt(weekNumberStr, 10);
    if (isNaN(weekNumber) || weekNumber < 1 || weekNumber > 16) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid weekNumber: must be between 1 and 16",
        },
        { status: 400 },
      );
    }

    // Verify plan belongs to user
    const plan = await db.query.plans.findFirst({
      where: eq(plans.id, planId),
    });

    if (!plan || plan.userId !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Plan not found or unauthorized",
        },
        { status: 404 },
      );
    }

    // Check cache first
    const cacheKey = `${planId}-week-${weekNumber}`;
    const cached = await db.query.coachCache.findFirst({
      where: and(
        eq(coachCache.userId, user.id),
        eq(coachCache.context, "weekly"),
        eq(coachCache.cacheKey, cacheKey),
      ),
    });

    if (cached?.payload) {
      return NextResponse.json({
        success: true,
        review: cached.payload as CoachResponse,
        weekNumber,
        cached: true,
      });
    }

    // Get user profile
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

    // Build weekly context
    const context = await buildWeeklyContext({
      planId,
      weekNumber,
      userProfile: profile,
    });

    // Build prompt
    const userPrompt = buildWeeklyPrompt({
      planId,
      weekNumber,
      context,
    });

    // Call AI coach
    const coachResult = await callCoach({
      systemPrompt: coachSystemPrompt,
      userPrompt,
      schema: coachResponseSchema,
      maxTokens: 600,
    });

    if (!coachResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: coachResult.error,
          fallback: `Week ${weekNumber} complete! Review your logs to track progress.`,
        },
        { status: 500 },
      );
    }

    const payload = coachResult.data;

    // Cache for 7 days
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);

    await db
      .insert(coachCache)
      .values({
        userId: user.id,
        planId,
        context: "weekly",
        cacheKey,
        targetDate: null,
        payload,
        expiresAt: expires,
      })
      .onConflictDoUpdate({
        target: [coachCache.userId, coachCache.context, coachCache.cacheKey],
        set: {
          planId,
          payload,
          expiresAt: expires,
        },
      });

    return NextResponse.json({
      success: true,
      review: payload,
      weekNumber,
      cached: false,
    });
  } catch (error) {
    console.error("[Coach Weekly] error", error);
    return NextResponse.json(
      {
        success: false,
        error: "Unable to generate weekly review.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
