/**
 * POST /api/sync/pull
 *
 * Batch download endpoint for server updates (online→offline sync)
 * Returns profiles, plans, and workouts that have been updated since last sync
 */

import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServerClient';
import { db } from '@/lib/db';
import { profiles, plans, workouts } from '@/drizzle/schema';
import { and, eq, gte } from 'drizzle-orm';

interface PullRequest {
  userId: string;
  lastSyncAt: number; // Timestamp in milliseconds
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

    const body: PullRequest = await request.json();

    // Verify user can only pull their own data
    if (body.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot pull data for another user' },
        { status: 403 }
      );
    }

    const lastSyncDate = new Date(body.lastSyncAt);

    // ========================================================================
    // 1. Fetch updated profile
    // ========================================================================
    const userProfile = await db.query.profiles.findFirst({
      where: and(
        eq(profiles.userId, user.id),
        gte(profiles.updatedAt, lastSyncDate)
      ),
    });

    // ========================================================================
    // 2. Fetch updated plans
    // ========================================================================
    const updatedPlans = await db.query.plans.findMany({
      where: and(
        eq(plans.userId, user.id),
        gte(plans.updatedAt, lastSyncDate)
      ),
    });

    // ========================================================================
    // 3. Fetch updated workouts
    // ========================================================================
    const updatedWorkouts = await db.query.workouts.findMany({
      where: and(
        eq(workouts.userId, user.id),
        gte(workouts.updatedAt, lastSyncDate)
      ),
    });

    // ========================================================================
    // Transform to local format
    // ========================================================================
    const response = {
      success: true,
      lastPullAt: Date.now(),
      data: {
        profiles: userProfile ? [mapProfileToLocal(userProfile)] : [],
        plans: updatedPlans.map(mapPlanToLocal),
        workouts: updatedWorkouts.map(mapWorkoutToLocal),
      },
      stats: {
        profiles: userProfile ? 1 : 0,
        plans: updatedPlans.length,
        workouts: updatedWorkouts.length,
        total: (userProfile ? 1 : 0) + updatedPlans.length + updatedWorkouts.length,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Pull] Batch sync error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Pull failed',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// Mappers (Server → Local format)
// ============================================================================

/* eslint-disable @typescript-eslint/no-explicit-any */

function mapProfileToLocal(serverProfile: any) {
  return {
    userId: serverProfile.userId,
    fullName: serverProfile.fullName,
    sex: serverProfile.sex,
    dateOfBirth: serverProfile.dateOfBirth,
    heightCm: serverProfile.heightCm,
    weightKg: serverProfile.weightKg,
    unitSystem: serverProfile.unitSystem,
    hasPcos: serverProfile.hasPcos,
    experienceLevel: serverProfile.experienceLevel,
    scheduleDaysPerWeek: serverProfile.scheduleDaysPerWeek,
    scheduleMinutesPerSession: serverProfile.scheduleMinutesPerSession,
    scheduleWeeks: serverProfile.scheduleWeeks,
    preferredDays: serverProfile.preferredDays || [],
    equipment: serverProfile.equipment || [],
    avoidList: serverProfile.avoidList || [],
    noHighImpact: serverProfile.noHighImpact,
    goalBias: serverProfile.goalBias,
    coachTone: serverProfile.coachTone,
    coachTodayEnabled: serverProfile.coachTodayEnabled,
    coachDebriefEnabled: serverProfile.coachDebriefEnabled,
    coachWeeklyEnabled: serverProfile.coachWeeklyEnabled,
    coachNotes: serverProfile.coachNotes,
    timezone: serverProfile.timezone,
    createdAt: new Date(serverProfile.createdAt).getTime(),
    updatedAt: new Date(serverProfile.updatedAt).getTime(),
    _isDirty: false,
    _syncedAt: Date.now(),
  };
}

function mapPlanToLocal(serverPlan: any) {
  return {
    id: serverPlan.id,
    userId: serverPlan.userId,
    title: serverPlan.title,
    durationWeeks: serverPlan.durationWeeks,
    workoutsPerWeek: serverPlan.workoutsPerWeek,
    startDate: serverPlan.startDate,
    endDate: serverPlan.endDate,
    active: serverPlan.active,
    payload: serverPlan.payload || {},
    createdAt: new Date(serverPlan.createdAt).getTime(),
    updatedAt: new Date(serverPlan.updatedAt).getTime(),
    _isDirty: false,
    _syncedAt: Date.now(),
  };
}

function mapWorkoutToLocal(serverWorkout: any) {
  return {
    id: serverWorkout.id,
    userId: serverWorkout.userId,
    planId: serverWorkout.planId,
    weekIndex: serverWorkout.weekIndex,
    dayIndex: serverWorkout.dayIndex,
    sessionDate: serverWorkout.sessionDate,
    title: serverWorkout.title,
    kind: serverWorkout.kind || 'strength',
    focus: serverWorkout.focus,
    durationMinutes: serverWorkout.durationMinutes,
    isDeload: serverWorkout.isDeload || false,
    payload: serverWorkout.payload || {},
    createdAt: new Date(serverWorkout.createdAt).getTime(),
    updatedAt: new Date(serverWorkout.updatedAt).getTime(),
    _isDirty: false,
    _syncedAt: Date.now(),
  };
}

/* eslint-enable @typescript-eslint/no-explicit-any */
