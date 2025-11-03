import { createSupabaseServerClient } from "@/lib/supabaseServerClient";
import { db } from "@/lib/db";
import { plans, workouts, workoutLogs } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";

export async function DELETE(request: Request) {
  try {
    // Authenticate user
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { planId } = body;

    if (!planId || typeof planId !== "string") {
      return Response.json({ error: "Invalid plan ID" }, { status: 400 });
    }

    // Verify plan ownership
    const [plan] = await db
      .select()
      .from(plans)
      .where(and(eq(plans.id, planId), eq(plans.userId, user.id)))
      .limit(1);

    if (!plan) {
      return Response.json(
        { error: "Plan not found or unauthorized" },
        { status: 404 }
      );
    }

    // Delete plan and associated data in transaction
    await db.transaction(async (tx) => {
      // Get all workout IDs for this plan
      const planWorkouts = await tx
        .select({ id: workouts.id })
        .from(workouts)
        .where(eq(workouts.planId, planId));

      const workoutIds = planWorkouts.map((w) => w.id);

      // Delete workout logs for all workouts in this plan
      if (workoutIds.length > 0) {
        for (const workoutId of workoutIds) {
          await tx
            .delete(workoutLogs)
            .where(eq(workoutLogs.workoutId, workoutId));
        }
      }

      // Delete all workouts for this plan
      await tx.delete(workouts).where(eq(workouts.planId, planId));

      // Delete the plan itself
      await tx.delete(plans).where(eq(plans.id, planId));
    });

    console.log(`[Delete Plan] Successfully deleted plan: ${planId}`);

    return Response.json({
      success: true,
      message: "Plan deleted successfully",
    });
  } catch (error) {
    console.error("[Delete Plan] Error:", error);
    return Response.json(
      {
        error: "Failed to delete plan",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
