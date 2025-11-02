import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServerClient';
import { db } from '@/lib/db';
import { workoutLogs, workoutLogSets, workouts } from '@/drizzle/schema';
import { logRequestSchema } from '@/lib/validation';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validated = logRequestSchema.parse(body);

    console.log('[Workout Log] User:', user.id, 'Workout:', validated.workoutId);

    // Fetch workout to get planId and verify ownership
    const [workout] = await db
      .select()
      .from(workouts)
      .where(
        and(
          eq(workouts.id, validated.workoutId),
          eq(workouts.userId, user.id)
        )
      )
      .limit(1);

    if (!workout) {
      return NextResponse.json(
        { error: 'Workout not found or unauthorized' },
        { status: 404 }
      );
    }

    const performedAtDate = validated.performedAt ? new Date(validated.performedAt) : new Date();
    const sessionDateStr = performedAtDate.toISOString().split('T')[0];

    // Check for duplicate log (same workout, same date)
    const [existingLog] = await db
      .select()
      .from(workoutLogs)
      .where(
        and(
          eq(workoutLogs.userId, user.id),
          eq(workoutLogs.workoutId, validated.workoutId),
          eq(workoutLogs.sessionDate, sessionDateStr)
        )
      )
      .limit(1);

    if (existingLog) {
      return NextResponse.json(
        { error: 'Workout already logged for this date' },
        { status: 409 }
      );
    }

    // Calculate total duration (placeholder - will be enhanced later)
    const totalDurationMinutes = workout.durationMinutes || 60;

    // Insert workout log
    const [log] = await db
      .insert(workoutLogs)
      .values({
        userId: user.id,
        planId: workout.planId,
        workoutId: validated.workoutId,
        sessionDate: sessionDateStr,
        performedAt: performedAtDate,
        rpeLastSet: validated.rpeLastSet ? validated.rpeLastSet.toString() : null,
        totalDurationMinutes,
        notes: validated.entries
          .filter(e => e.notes)
          .map(e => `${e.exerciseId}: ${e.notes}`)
          .join('; ') || null,
      })
      .returning();

    console.log('[Workout Log] Created log:', log.id);

    // Insert workout log sets
    if (validated.entries.length > 0) {
      const setRecords = validated.entries.map((entry) => ({
        logId: log.id,
        exerciseId: entry.exerciseId,
        setIndex: entry.set,
        reps: entry.reps,
        weightKg: entry.weight.toString(),
        rpe: entry.rpe?.toString() || null,
      }));

      await db.insert(workoutLogSets).values(setRecords);
      console.log('[Workout Log] Created', setRecords.length, 'sets');
    }

    // TODO: Trigger progression recompute if week completed
    // This will be implemented in Phase 2

    return NextResponse.json({
      success: true,
      logId: log.id,
      message: 'Workout logged successfully',
    });
  } catch (error) {
    console.error('[Workout Log] Error:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to log workout' },
      { status: 500 }
    );
  }
}
