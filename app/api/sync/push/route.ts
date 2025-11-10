/**
 * POST /api/sync/push
 *
 * Batch upload endpoint for dirty records (offline→online sync)
 * Receives workout logs, meals, and profile updates from client IndexedDB
 */

import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServerClient';
import { db } from '@/lib/db';
import { workoutLogs, workoutLogSets, meals, profiles } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import type { LocalWorkoutLog, LocalMeal, LocalProfile } from '@/lib/db/schema.local';

interface PushRequest {
  workoutLogs: LocalWorkoutLog[];
  meals: LocalMeal[];
  profiles: LocalProfile[];
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body: PushRequest = await request.json();
    const synced: {
      workoutLogs: string[];
      meals: string[];
      profiles: string[];
    } = {
      workoutLogs: [],
      meals: [],
      profiles: [],
    };
    const errors: string[] = [];

    // ========================================================================
    // 1. Sync Workout Logs
    // ========================================================================
    for (const log of body.workoutLogs || []) {
      try {
        // Verify ownership
        if (log.userId !== user.id) {
          errors.push(`Workout log ${log.id}: ownership mismatch`);
          continue;
        }

        // Insert or update workout log
        const existingLog = await db.query.workoutLogs.findFirst({
          where: eq(workoutLogs.id, log.id),
        });

        if (existingLog) {
          // Update existing log (conflict resolution: last-write-wins)
          await db.update(workoutLogs).set({
            totalDurationMinutes: log.totalDurationMinutes,
            rpeLastSet: log.rpeLastSet ? String(log.rpeLastSet) : null,
            notes: log.notes,
            performedAt: new Date(log.performedAt),
          }).where(eq(workoutLogs.id, log.id));
        } else {
          // Insert new log
          await db.insert(workoutLogs).values({
            id: log.id,
            userId: log.userId,
            planId: log.planId,
            workoutId: log.workoutId,
            sessionDate: log.sessionDate,
            totalDurationMinutes: log.totalDurationMinutes,
            rpeLastSet: log.rpeLastSet ? String(log.rpeLastSet) : null,
            notes: log.notes,
            performedAt: new Date(log.performedAt),
          });
        }

        synced.workoutLogs.push(log.id);
      } catch (error) {
        console.error('[Push] Workout log sync error:', error);
        errors.push(`Workout log ${log.id}: ${error instanceof Error ? error.message : 'failed'}`);
      }
    }

    // ========================================================================
    // 2. Sync Meals
    // ========================================================================
    for (const meal of body.meals || []) {
      try {
        // Verify ownership
        if (meal.userId !== user.id) {
          errors.push(`Meal ${meal.id}: ownership mismatch`);
          continue;
        }

        // Insert or update meal
        const existingMeal = await db.query.meals.findFirst({
          where: eq(meals.id, meal.id),
        });

        if (existingMeal) {
          // Update existing meal
          await db.update(meals).set({
            mealDate: meal.mealDate,
            mealTime: new Date(meal.mealTime),
            mealType: meal.mealType,
            description: meal.description,
            photoUrl: meal.photoUrl,
            calories: meal.calories,
            proteinGrams: meal.proteinGrams,
            carbsGrams: meal.carbsGrams,
            fatGrams: meal.fatGrams,
            fiberGrams: meal.fiberGrams,
            notes: meal.notes,
          }).where(eq(meals.id, meal.id));
        } else {
          // Insert new meal
          await db.insert(meals).values({
            id: meal.id,
            userId: meal.userId,
            mealDate: meal.mealDate,
            mealTime: new Date(meal.mealTime),
            mealType: meal.mealType,
            description: meal.description,
            photoUrl: meal.photoUrl,
            calories: meal.calories,
            proteinGrams: meal.proteinGrams,
            carbsGrams: meal.carbsGrams,
            fatGrams: meal.fatGrams,
            fiberGrams: meal.fiberGrams,
            notes: meal.notes,
            source: meal.source || 'manual',
          });
        }

        synced.meals.push(meal.id);
      } catch (error) {
        console.error('[Push] Meal sync error:', error);
        errors.push(`Meal ${meal.id}: ${error instanceof Error ? error.message : 'failed'}`);
      }
    }

    // ========================================================================
    // 3. Sync Profiles
    // ========================================================================
    for (const profile of body.profiles || []) {
      try {
        // Verify ownership
        if (profile.userId !== user.id) {
          errors.push(`Profile ${profile.userId}: ownership mismatch`);
          continue;
        }

        // Update profile (profiles are always updates, never inserts from client)
        await db.update(profiles).set({
          fullName: profile.fullName,
          sex: profile.sex,
          dateOfBirth: profile.dateOfBirth,
          heightCm: profile.heightCm,
          weightKg: profile.weightKg,
          unitSystem: profile.unitSystem,
          hasPcos: profile.hasPcos,
          experienceLevel: profile.experienceLevel,
          scheduleDaysPerWeek: profile.scheduleDaysPerWeek,
          scheduleMinutesPerSession: profile.scheduleMinutesPerSession,
          scheduleWeeks: profile.scheduleWeeks,
          preferredDays: profile.preferredDays,
          equipment: profile.equipment,
          avoidList: profile.avoidList,
          noHighImpact: profile.noHighImpact,
          goalBias: profile.goalBias,
          coachTone: profile.coachTone,
          coachTodayEnabled: profile.coachTodayEnabled,
          coachDebriefEnabled: profile.coachDebriefEnabled,
          coachWeeklyEnabled: profile.coachWeeklyEnabled,
          coachNotes: profile.coachNotes,
          timezone: profile.timezone,
        }).where(eq(profiles.userId, profile.userId));

        synced.profiles.push(profile.userId);
      } catch (error) {
        console.error('[Push] Profile sync error:', error);
        errors.push(`Profile ${profile.userId}: ${error instanceof Error ? error.message : 'failed'}`);
      }
    }

    // ========================================================================
    // Response
    // ========================================================================
    const totalSynced =
      synced.workoutLogs.length + synced.meals.length + synced.profiles.length;
    const totalErrors = errors.length;

    return NextResponse.json({
      success: totalErrors === 0,
      synced,
      stats: {
        workoutLogs: synced.workoutLogs.length,
        meals: synced.meals.length,
        profiles: synced.profiles.length,
        total: totalSynced,
      },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('[Push] Batch sync error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Sync failed',
      },
      { status: 500 }
    );
  }
}
