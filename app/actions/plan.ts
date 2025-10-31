"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";
import { plans, workouts } from "@/drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { planActivateSchema } from "@/lib/validation";

/**
 * Generate a new plan for the authenticated user
 * Calls the API route to trigger plan generation
 */
export async function generatePlanAction() {
  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    throw new Error("Unable to resolve authenticated user");
  }

  // Get cookies to forward to API
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  // Call the plan generation API with authentication cookies
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/plan/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": cookieHeader,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to generate plan");
  }

  const result = await response.json();

  // Revalidate plan page
  revalidatePath("/plan");

  return result;
}

/**
 * Activate a plan with a start date
 */
export async function activatePlanAction(input: { planId: string; startDate: string }) {
  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    throw new Error("Unable to resolve authenticated user");
  }

  // Validate input
  const parsed = planActivateSchema.parse(input);
  const userId = userData.user.id;

  // Update plan in transaction
  await db.transaction(async (tx) => {
    // Deactivate all other plans for this user
    await tx
      .update(plans)
      .set({ active: false })
      .where(and(eq(plans.userId, userId), eq(plans.active, true)));

    // Activate the selected plan
    await tx
      .update(plans)
      .set({
        active: true,
        startDate: parsed.startDate,
        status: "active",
      })
      .where(and(eq(plans.id, parsed.planId), eq(plans.userId, userId)));
  });

  // Revalidate plan and dashboard pages
  revalidatePath("/plan");
  revalidatePath("/dashboard");

  return { success: true };
}

/**
 * Get the active plan for the authenticated user
 */
export async function getActivePlanAction() {
  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return null;
  }

  const userId = userData.user.id;

  const [activePlan] = await db
    .select()
    .from(plans)
    .where(and(eq(plans.userId, userId), eq(plans.active, true)))
    .limit(1);

  return activePlan || null;
}

/**
 * Get all plans for the authenticated user
 */
export async function getUserPlansAction() {
  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return [];
  }

  const userId = userData.user.id;

  const userPlans = await db
    .select()
    .from(plans)
    .where(eq(plans.userId, userId))
    .orderBy(desc(plans.createdAt));

  return userPlans;
}

/**
 * Get a specific plan by ID (auth check included)
 */
export async function getPlanByIdAction(planId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return null;
  }

  const userId = userData.user.id;

  const [plan] = await db
    .select()
    .from(plans)
    .where(and(eq(plans.id, planId), eq(plans.userId, userId)))
    .limit(1);

  return plan || null;
}

/**
 * Get all workouts for a specific plan
 */
export async function getPlanWorkoutsAction(planId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return [];
  }

  const userId = userData.user.id;

  // Verify the plan belongs to the user
  const [plan] = await db
    .select()
    .from(plans)
    .where(and(eq(plans.id, planId), eq(plans.userId, userId)))
    .limit(1);

  if (!plan) {
    throw new Error("Plan not found or unauthorized");
  }

  // Get all workouts for this plan
  const planWorkouts = await db
    .select()
    .from(workouts)
    .where(eq(workouts.planId, planId))
    .orderBy(workouts.dayIndex);

  return planWorkouts;
}

/**
 * Delete a plan (and cascade delete workouts)
 */
export async function deletePlanAction(planId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    throw new Error("Unable to resolve authenticated user");
  }

  const userId = userData.user.id;

  // Delete plan (workouts will cascade delete due to foreign key)
  await db
    .delete(plans)
    .where(and(eq(plans.id, planId), eq(plans.userId, userId)));

  revalidatePath("/plan");

  return { success: true };
}
