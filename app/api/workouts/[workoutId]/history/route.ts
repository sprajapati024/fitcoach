import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServerClient';
import { db } from '@/lib/db';
import { workouts, workoutLogs, workoutLogSets } from '@/drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';

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
