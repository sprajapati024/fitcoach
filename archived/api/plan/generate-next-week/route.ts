import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";
import { db } from "@/lib/db";
import { profiles, plans, workouts } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { generateNextWeek } from "@/lib/ai/agents/planner-agent";
import { preparePerformanceDataForAdaptivePlanner } from "@/lib/performance-analysis";
import { generateWeekWorkouts } from "@/lib/calendar";
import type { AdaptiveWeekResponse } from "@/lib/validation";

// Helper to determine periodization phase based on week number
function getPeriodizationPhase(weekNumber: number): "accumulation" | "intensification" | "deload" | "realization" {
  // Week 3 is deload
  if (weekNumber === 3) return "deload";

  // Week 7 is deload (for 10+ week programs)
  if (weekNumber === 7) return "deload";

  // Weeks 1-2: accumulation
  if (weekNumber <= 2) return "accumulation";

  // Weeks 4-6: intensification
  if (weekNumber >= 4 && weekNumber <= 6) return "intensification";

  // Weeks 8+: realization
  return "realization";
}

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

    // Parse request body
    const body = await request.json();
    const { planId } = body;

    if (!planId) {
      return NextResponse.json(
        { success: false, error: "Plan ID is required" },
        { status: 400 }
      );
    }

    // Get user profile
    const [userProfile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, user.id))
      .limit(1);

    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: "Profile not found" },
        { status: 404 }
      );
    }

    // Get the plan
    const [plan] = await db.select().from(plans).where(eq(plans.id, planId)).limit(1);

    if (!plan) {
      return NextResponse.json({ success: false, error: "Plan not found" }, { status: 404 });
    }

    if (plan.userId !== user.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    // Determine which week to generate
    // Find the highest week number currently in the database
    const existingWorkouts = await db
      .select()
      .from(workouts)
      .where(eq(workouts.planId, planId));

    if (existingWorkouts.length === 0) {
      return NextResponse.json(
        { success: false, error: "No workouts found for this plan. Cannot generate next week." },
        { status: 400 }
      );
    }

    const maxWeekNumber = Math.max(...existingWorkouts.map((w) => w.weekNumber));
    const nextWeekNumber = maxWeekNumber + 1;

    // Check if we've reached the plan duration
    if (nextWeekNumber > plan.durationWeeks) {
      return NextResponse.json(
        {
          success: false,
          error: `Plan is complete. All ${plan.durationWeeks} weeks have been generated.`,
        },
        { status: 400 }
      );
    }

    console.log(`[Generate Next Week] Generating week ${nextWeekNumber} for plan ${planId}`);

    // Get performance data from previous week
    const previousWeekNumber = maxWeekNumber;
    const performanceData = await preparePerformanceDataForAdaptivePlanner(
      planId,
      previousWeekNumber
    );

    console.log("[Generate Next Week] Performance data:", {
      adherence: (performanceData.overallAdherence * 100).toFixed(0) + "%",
      avgRPE: performanceData.avgRPEAcrossWeek.toFixed(1),
      workoutsCompleted: performanceData.workouts.filter(w => w.completedSets / w.targetSets >= 0.8).length,
    });

    // Determine periodization phase
    const phase = getPeriodizationPhase(nextWeekNumber);

    console.log(`[Generate Next Week] Phase: ${phase}`);

    // Call adaptive planner agent
    const aiResult = await generateNextWeek(
      userProfile,
      nextWeekNumber,
      phase,
      performanceData
    );

    if (!aiResult.success || !aiResult.data) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to generate next week from AI",
        },
        { status: 500 }
      );
    }

    const adaptiveWeek = aiResult.data as AdaptiveWeekResponse;

    console.log("[Generate Next Week] AI generated week successfully");

    // Convert adaptive week response to workout instances
    // We need to use the plan's microcycle pattern
    const microcycle = plan.microcycle as {
      id: string;
      weeks: number;
      daysPerWeek: number;
      pattern: Array<{
        dayIndex: number;
        focus: string;
        blocks: Array<any>;
      }>;
    };

    // Generate workouts for the next week using calendar utility
    const newWorkouts = generateWeekWorkouts(
      microcycle,
      nextWeekNumber,
      {
        planId,
        userId: user.id,
        startDate: plan.startDate ?? undefined,
        daysPerWeek: plan.daysPerWeek,
        preferredDays: plan.preferredDays as string[],
      }
    );

    console.log(`[Generate Next Week] Generated ${newWorkouts.length} workout instances`);

    // Save new workouts to database
    if (newWorkouts.length > 0) {
      await db.insert(workouts).values(newWorkouts);
    }

    console.log(`[Generate Next Week] Success! Week ${nextWeekNumber} created`);

    return NextResponse.json({
      success: true,
      weekNumber: nextWeekNumber,
      phase,
      workoutCount: newWorkouts.length,
      summary: adaptiveWeek.summary,
      progressionRationale: adaptiveWeek.progressionRationale,
    });
  } catch (error) {
    console.error("[Generate Next Week] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An error occurred while generating the next week",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
