import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { plans, workouts, profiles } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { createPlanId, createMicrocycleId } from "@/lib/ids";
import { generateWorkouts } from "@/lib/calendar";
import type { PlanMicrocycle, PreferredDay } from "@/drizzle/schema";

/**
 * POST /api/plan/custom
 * Create a custom workout plan manually
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      summary,
      durationWeeks,
      daysPerWeek,
      minutesPerSession,
      preferredDays,
      startDate,
      microcycle,
    } = body as {
      title: string;
      summary?: string;
      durationWeeks: number;
      daysPerWeek: number;
      minutesPerSession: number;
      preferredDays: PreferredDay[];
      startDate?: string;
      microcycle: Omit<PlanMicrocycle, "id" | "weeks">;
    };

    // Validate required fields
    if (
      !title ||
      !durationWeeks ||
      !daysPerWeek ||
      !minutesPerSession ||
      !microcycle ||
      !microcycle.pattern
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: title, durationWeeks, daysPerWeek, minutesPerSession, microcycle",
        },
        { status: 400 }
      );
    }

    // Validate ranges
    if (
      durationWeeks < 1 ||
      durationWeeks > 16 ||
      daysPerWeek < 3 ||
      daysPerWeek > 6
    ) {
      return NextResponse.json(
        { error: "Invalid duration or days per week" },
        { status: 400 }
      );
    }

    // Validate microcycle pattern
    if (
      !Array.isArray(microcycle.pattern) ||
      microcycle.pattern.length === 0
    ) {
      return NextResponse.json(
        { error: "Microcycle must have at least one workout pattern" },
        { status: 400 }
      );
    }

    // Validate pattern count matches daysPerWeek
    if (microcycle.pattern.length !== daysPerWeek) {
      return NextResponse.json(
        {
          error: `Pattern count (${microcycle.pattern.length}) must match days per week (${daysPerWeek})`,
        },
        { status: 400 }
      );
    }

    // Validate preferredDays count matches daysPerWeek
    if (!preferredDays || preferredDays.length !== daysPerWeek) {
      return NextResponse.json(
        {
          error: `Preferred days count (${preferredDays?.length || 0}) must match days per week (${daysPerWeek})`,
        },
        { status: 400 }
      );
    }

    // Validate each pattern has blocks with exercises
    for (let i = 0; i < microcycle.pattern.length; i++) {
      const pattern = microcycle.pattern[i];
      if (!pattern.blocks || !Array.isArray(pattern.blocks)) {
        return NextResponse.json(
          { error: `Day ${i + 1} must have blocks defined` },
          { status: 400 }
        );
      }

      for (let j = 0; j < pattern.blocks.length; j++) {
        const block = pattern.blocks[j];
        if (
          !block.exercises ||
          !Array.isArray(block.exercises) ||
          block.exercises.length === 0
        ) {
          return NextResponse.json(
            {
              error: `Day ${i + 1} - ${block.title || `Block ${j + 1}`} must have at least one exercise`,
            },
            { status: 400 }
          );
        }
      }
    }

    // Validate start date is not in the past (if provided)
    if (startDate) {
      const today = new Date().toISOString().split("T")[0];
      if (startDate < today) {
        return NextResponse.json(
          { error: "Start date cannot be in the past" },
          { status: 400 }
        );
      }
    }

    // Get user profile for timezone and other settings
    const [userProfile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, user.id))
      .limit(1);

    if (!userProfile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    // Create plan ID and microcycle ID
    const planId = createPlanId();
    const microcycleId = createMicrocycleId();

    // Build full microcycle with ID and weeks
    const fullMicrocycle: PlanMicrocycle = {
      id: microcycleId,
      weeks: durationWeeks,
      daysPerWeek: microcycle.daysPerWeek,
      pattern: microcycle.pattern,
    };

    // Create empty calendar (will be populated when start date is set)
    const emptyCalendar = {
      planId,
      weeks: [],
    };

    // Create the plan
    const [insertedPlan] = await db
      .insert(plans)
      .values({
        id: planId,
        userId: user.id,
        title,
        summary: summary || `Custom ${daysPerWeek}-day workout plan`,
        status: "draft",
        active: false,
        startDate: startDate || null,
        durationWeeks: durationWeeks,
        daysPerWeek: daysPerWeek,
        minutesPerSession: minutesPerSession,
        preferredDays: preferredDays || [],
        microcycle: fullMicrocycle as any,
        calendar: emptyCalendar as any,
        generatedBy: "custom",
        plannerVersion: null,
      })
      .returning();

    // Generate workout instances if start date is provided
    let generatedWorkouts: typeof workouts.$inferSelect[] = [];
    if (startDate) {
      const workoutInserts = generateWorkouts(fullMicrocycle, {
        planId,
        userId: user.id,
        startDate,
        weeks: durationWeeks,
        daysPerWeek: daysPerWeek,
        preferredDays: preferredDays?.map((d) => d) || [],
      });

      generatedWorkouts = await db
        .insert(workouts)
        .values(workoutInserts)
        .returning();
    }

    return NextResponse.json({
      success: true,
      plan: insertedPlan,
      workoutsCount: generatedWorkouts.length,
      message: startDate
        ? "Custom plan created and workouts generated"
        : "Custom plan created. Set a start date to generate workouts.",
    });
  } catch (error) {
    console.error("Error creating custom plan:", error);
    return NextResponse.json(
      {
        error: "Failed to create custom plan",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
