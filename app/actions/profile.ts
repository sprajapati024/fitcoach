"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { onboardingSchema, type OnboardingInput } from "@/lib/validation";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";
import { users, profiles } from "@/drizzle/schema";
import { convertHeightToCm, convertWeightToKg } from "@/lib/unitConversion";

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
          updatedAt: new Date(),
        },
      });
  });

  redirect("/plan");
}
