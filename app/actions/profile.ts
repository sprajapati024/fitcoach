"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { onboardingSchema, type OnboardingInput } from "@/lib/validation";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";
import { users, profiles, coachCache } from "@/drizzle/schema";
import { convertHeightToCm, convertWeightToKg } from "@/lib/unitConversion";
import { eq } from "drizzle-orm";

export async function saveProfileAction(form: OnboardingInput) {
  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    throw new Error("Unable to resolve authenticated user");
  }

  const parsed = onboardingSchema.parse(form);
  const userId = userData.user.id;

  const heightCm = convertHeightToCm(parsed.height);
  const weightKg = convertWeightToKg(parsed.weight);

  await db.transaction(async (tx) => {
    await tx
      .insert(users)
      .values({
        id: userId,
        email: userData.user.email ?? "",
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.user.email ?? "",
        },
      });

    await tx
      .insert(profiles)
      .values({
        userId,
        fullName: parsed.fullName,
        sex: parsed.sex,
        unitSystem: parsed.unitSystem,
        hasPcos: parsed.hasPcos,
        experienceLevel: parsed.experienceLevel,
        scheduleDaysPerWeek: parsed.schedule.daysPerWeek,
        scheduleMinutesPerSession: parsed.schedule.minutesPerSession,
        scheduleWeeks: parsed.schedule.programWeeks,
        preferredDays: parsed.schedule.preferredDays,
        equipment: parsed.equipment,
        avoidList: parsed.avoidList,
        noHighImpact: parsed.noHighImpact,
        goalBias: parsed.goalBias,
        coachTone: parsed.coachTone,
        coachTodayEnabled: parsed.coachTodayEnabled,
        coachDebriefEnabled: parsed.coachDebriefEnabled,
        coachWeeklyEnabled: parsed.coachWeeklyEnabled,
        coachNotes: parsed.coachNotes,
        heightCm: heightCm.toString(),
        weightKg: weightKg.toString(),
        timezone: parsed.timezone,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: profiles.userId,
        set: {
          fullName: parsed.fullName,
          sex: parsed.sex,
          unitSystem: parsed.unitSystem,
          hasPcos: parsed.hasPcos,
          experienceLevel: parsed.experienceLevel,
          scheduleDaysPerWeek: parsed.schedule.daysPerWeek,
          scheduleMinutesPerSession: parsed.schedule.minutesPerSession,
          scheduleWeeks: parsed.schedule.programWeeks,
          preferredDays: parsed.schedule.preferredDays,
          equipment: parsed.equipment,
          avoidList: parsed.avoidList,
          noHighImpact: parsed.noHighImpact,
          goalBias: parsed.goalBias,
          coachTone: parsed.coachTone,
          coachTodayEnabled: parsed.coachTodayEnabled,
          coachDebriefEnabled: parsed.coachDebriefEnabled,
          coachWeeklyEnabled: parsed.coachWeeklyEnabled,
          coachNotes: parsed.coachNotes,
          heightCm: heightCm.toString(),
          weightKg: weightKg.toString(),
          timezone: parsed.timezone,
          updatedAt: new Date(),
        },
      });
  });

  // Revalidate to ensure middleware sees the new profile
  revalidatePath("/plan");
  revalidatePath("/dashboard");
  revalidatePath("/onboarding");

  redirect("/plan");
}

/**
 * Update custom instructions (coach notes) for plan generation
 */
export async function updateCustomInstructionsAction(coachNotes: string) {
  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    throw new Error("Unable to resolve authenticated user");
  }

  const userId = userData.user.id;

  // Validate coach notes length (max 500 characters)
  if (coachNotes.length > 500) {
    throw new Error("Custom instructions must be 500 characters or less");
  }

  // Update profile with custom instructions
  await db
    .update(profiles)
    .set({
      coachNotes: coachNotes.trim() || null, // Store null if empty
      updatedAt: new Date(),
    })
    .where(eq(profiles.userId, userId));

  // Revalidate settings and plan pages
  revalidatePath("/settings");
  revalidatePath("/plan");

  return { success: true };
}

/**
 * Get user profile for settings page
 */
export async function getUserProfileAction() {
  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return null;
  }

  const userId = userData.user.id;

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);

  return profile || null;
}

/**
 * Update full user profile from settings page
 */
export async function updateFullProfileAction(data: {
  fullName?: string;
  sex?: string;
  dateOfBirth?: string;
  heightCm?: number;
  weightKg?: number;
  unitSystem?: string;
  goalBias?: string;
  experienceLevel?: string;
  scheduleDaysPerWeek?: number;
  scheduleMinutesPerSession?: number;
  scheduleWeeks?: number;
  preferredDays?: string[];
  equipment?: string[];
  avoidList?: string[];
  noHighImpact?: boolean;
  hasPcos?: boolean;
  coachTone?: string;
  coachTodayEnabled?: boolean;
  coachDebriefEnabled?: boolean;
  coachWeeklyEnabled?: boolean;
  timezone?: string;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    throw new Error("Unable to resolve authenticated user");
  }

  const userId = userData.user.id;

  // Clear all coach cache entries for this user when saving settings
  // This ensures fresh coach messages with the updated preference
  try {
    await db.delete(coachCache).where(eq(coachCache.userId, userId));
  } catch (error) {
    // Cache deletion is not critical, continue with profile update
    console.warn("Failed to clear coach cache:", error);
  }

  // Update profile
  await db
    .update(profiles)
    .set({
      fullName: data.fullName,
      sex: data.sex as any,
      dateOfBirth: data.dateOfBirth,
      heightCm: data.heightCm?.toString(),
      weightKg: data.weightKg?.toString(),
      unitSystem: data.unitSystem as any,
      goalBias: data.goalBias as any,
      experienceLevel: data.experienceLevel as any,
      scheduleDaysPerWeek: data.scheduleDaysPerWeek,
      scheduleMinutesPerSession: data.scheduleMinutesPerSession,
      scheduleWeeks: data.scheduleWeeks,
      preferredDays: data.preferredDays as any,
      equipment: data.equipment as any,
      avoidList: data.avoidList as any,
      noHighImpact: data.noHighImpact,
      hasPcos: data.hasPcos,
      coachTone: data.coachTone as any,
      coachTodayEnabled: data.coachTodayEnabled,
      coachDebriefEnabled: data.coachDebriefEnabled,
      coachWeeklyEnabled: data.coachWeeklyEnabled,
      timezone: data.timezone,
      updatedAt: new Date(),
    })
    .where(eq(profiles.userId, userId));

  // Revalidate relevant pages
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/plan");
  revalidatePath("/nutrition");

  return { success: true };
}
