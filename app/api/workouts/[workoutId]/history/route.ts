import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServerClient';
import { db } from '@/lib/db';
import { workouts, workoutLogs, workoutLogSets } from '@/drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';

/**
 * Retrieve the most recent workout history for the specified workout belonging to the authenticated user.
 *
 * Returns a JSON response with one of the following shapes:
 * - When there is no history:
 *   `{ hasHistory: false, lastSession: null, exercises: {} }`
 * - When a last session exists:
 *   `{
 *     hasHistory: true,
 *     lastSession: {
 *       date: string,
 *       performedAt: string,
 *       rpeLastSet?: number,
 *       totalDurationMinutes?: number
 *     },
 *     exercises: Record<string, Array<{ set: number; weight: number; reps: number; rpe?: number }>>
 *   }`
 *
 * Also returns HTTP 401 if the user is not authenticated, 404 if the workout does not belong to the user, and 500 on internal errors.
 *
 * @returns A JSON response describing whether history exists and, if so, the last session metadata and grouped exercise sets.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ workoutId: string }> }
) {
  try {
    const { workoutId } = await context.params;

    // Authenticate user
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify workout belongs to user
    const [workout] = await db
      .select()
      .from(workouts)
      .where(and(eq(workouts.id, workoutId), eq(workouts.userId, user.id)))
      .limit(1);

    if (!workout) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
    }

    // Find the most recent workout log for this workout
    const [lastLog] = await db
      .select()
      .from(workoutLogs)
      .where(and(eq(workoutLogs.workoutId, workoutId), eq(workoutLogs.userId, user.id)))
      .orderBy(desc(workoutLogs.performedAt))
      .limit(1);

    if (!lastLog) {
      // No history available
      return NextResponse.json({
        hasHistory: false,
        lastSession: null,
        exercises: {},
      });
    }

    // Fetch all sets from the last log
    const sets = await db
      .select()
      .from(workoutLogSets)
      .where(eq(workoutLogSets.logId, lastLog.id));

    // Group sets by exercise
    const exerciseData: Record<
      string,
      Array<{ set: number; weight: number; reps: number; rpe?: number }>
    > = {};

    for (const set of sets) {
      if (!exerciseData[set.exerciseId]) {
        exerciseData[set.exerciseId] = [];
      }
      exerciseData[set.exerciseId].push({
        set: set.setIndex,
        weight: parseFloat(set.weightKg),
        reps: set.reps,
        rpe: set.rpe ? parseFloat(set.rpe) : undefined,
      });
    }

    // Sort sets by set number
    for (const exerciseId in exerciseData) {
      exerciseData[exerciseId].sort((a, b) => a.set - b.set);
    }

    return NextResponse.json({
      hasHistory: true,
      lastSession: {
        date: lastLog.sessionDate,
        performedAt: lastLog.performedAt,
        rpeLastSet: lastLog.rpeLastSet ? parseFloat(lastLog.rpeLastSet) : undefined,
        totalDurationMinutes: lastLog.totalDurationMinutes,
      },
      exercises: exerciseData,
    });
  } catch (error) {
    console.error('[Workout History] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch workout history' }, { status: 500 });
  }
}