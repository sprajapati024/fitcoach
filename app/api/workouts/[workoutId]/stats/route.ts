import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServerClient';
import { db } from '@/lib/db';
import { workouts, workoutLogs, workoutLogSets } from '@/drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';

type ExerciseStats = {
  exerciseId: string;
  sessions: Array<{
    date: string;
    sets: Array<{
      weight: number;
      reps: number;
      rpe?: number;
    }>;
    totalVolume: number;
    maxWeight: number;
    avgRpe?: number;
  }>;
  personalRecords: {
    maxWeight: { value: number; date: string; reps: number };
    maxVolume: { value: number; date: string };
    maxReps: { value: number; date: string; weight: number };
  };
};

type SessionSummary = {
  logId: string;
  date: string;
  performedAt: string;
  duration: number;
  rpeLastSet?: number;
  totalVolume: number;
  totalSets: number;
  notes?: string;
  exerciseCount: number;
};

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

    // Fetch last 10 workout logs (we'll show 5, but fetch more for better stats)
    const logs = await db
      .select()
      .from(workoutLogs)
      .where(and(eq(workoutLogs.workoutId, workoutId), eq(workoutLogs.userId, user.id)))
      .orderBy(desc(workoutLogs.performedAt))
      .limit(10);

    if (logs.length === 0) {
      return NextResponse.json({
        hasHistory: false,
        sessions: [],
        exerciseStats: {},
        overallStats: {
          totalSessions: 0,
          totalVolume: 0,
          avgDuration: 0,
          avgRpe: 0,
        },
      });
    }

    // Fetch all sets for these logs
    const logIds = logs.map((log) => log.id);
    const allSets = await db
      .select()
      .from(workoutLogSets)
      .where(
        // Using IN clause - need to construct this properly
        eq(workoutLogSets.logId, logIds[0])
      );

    // Fetch sets for all logs (doing multiple queries since Drizzle's IN might be tricky)
    const setsPromises = logIds.map((logId) =>
      db.select().from(workoutLogSets).where(eq(workoutLogSets.logId, logId))
    );
    const setsResults = await Promise.all(setsPromises);
    const allSetsFlat = setsResults.flat();

    // Group sets by log
    const setsByLog = new Map<string, typeof allSetsFlat>();
    for (const set of allSetsFlat) {
      if (!setsByLog.has(set.logId)) {
        setsByLog.set(set.logId, []);
      }
      setsByLog.get(set.logId)!.push(set);
    }

    // Build session summaries
    const sessions: SessionSummary[] = logs.slice(0, 5).map((log) => {
      const sets = setsByLog.get(log.id) || [];
      const totalVolume = sets.reduce((sum, set) => {
        const weight = parseFloat(set.weightKg);
        if (isNaN(weight)) return sum;
        return sum + weight * set.reps;
      }, 0);
      const uniqueExercises = new Set(sets.map((s) => s.exerciseId)).size;

      return {
        logId: log.id,
        date: log.sessionDate,
        performedAt: log.performedAt.toISOString(),
        duration: log.totalDurationMinutes || 0,
        rpeLastSet: log.rpeLastSet ? parseFloat(log.rpeLastSet) : undefined,
        totalVolume: Math.round(totalVolume),
        totalSets: sets.length,
        notes: log.notes || undefined,
        exerciseCount: uniqueExercises,
      };
    });

    // Build per-exercise stats
    const exerciseStats: Record<string, ExerciseStats> = {};

    // Get unique exercise IDs from the workout payload
    const workoutPayload = workout.payload as any;
    const exerciseIds = new Set<string>();
    if (workoutPayload?.blocks) {
      for (const block of workoutPayload.blocks) {
        if (block.exercises) {
          for (const ex of block.exercises) {
            exerciseIds.add(ex.id);
          }
        }
      }
    }

    // Build stats for each exercise
    for (const exerciseId of exerciseIds) {
      const exerciseSets = allSetsFlat.filter((set) => set.exerciseId === exerciseId);

      if (exerciseSets.length === 0) continue;

      // Group by session
      const sessionMap = new Map<string, typeof exerciseSets>();
      for (const set of exerciseSets) {
        if (!sessionMap.has(set.logId)) {
          sessionMap.set(set.logId, []);
        }
        sessionMap.get(set.logId)!.push(set);
      }

      // Build session data
      const sessionsData = logs
        .map((log) => {
          const sets = sessionMap.get(log.id);
          if (!sets || sets.length === 0) return null;

          const volume = sets.reduce((sum, set) => {
            const weight = parseFloat(set.weightKg);
            if (isNaN(weight)) return sum;
            return sum + weight * set.reps;
          }, 0);
          const weights = sets.map((s) => parseFloat(s.weightKg)).filter((w) => !isNaN(w));
          const maxWeight = weights.length > 0 ? Math.max(...weights) : 0;
          const rpes = sets.filter((s) => s.rpe).map((s) => parseFloat(s.rpe!)).filter((r) => !isNaN(r));
          const avgRpe = rpes.length > 0 ? rpes.reduce((a, b) => a + b, 0) / rpes.length : undefined;

          return {
            date: log.sessionDate,
            sets: sets.map((s) => ({
              weight: parseFloat(s.weightKg) || 0,
              reps: s.reps,
              rpe: s.rpe ? parseFloat(s.rpe) : undefined,
            })),
            totalVolume: Math.round(volume),
            maxWeight,
            avgRpe: avgRpe ? Math.round(avgRpe * 10) / 10 : undefined,
          };
        })
        .filter((s) => s !== null) as ExerciseStats['sessions'];

      // Calculate PRs
      const allWeights = exerciseSets
        .map((s) => ({
          weight: parseFloat(s.weightKg),
          reps: s.reps,
          logId: s.logId,
        }))
        .filter((w) => !isNaN(w.weight));
      const allVolumes = Array.from(sessionMap.entries()).map(([logId, sets]) => ({
        volume: sets.reduce((sum, s) => {
          const weight = parseFloat(s.weightKg);
          if (isNaN(weight)) return sum;
          return sum + weight * s.reps;
        }, 0),
        logId,
      }));
      const allReps = exerciseSets
        .map((s) => ({
          reps: s.reps,
          weight: parseFloat(s.weightKg) || 0,
          logId: s.logId,
        }));

      const maxWeightEntry = allWeights.length > 0
        ? allWeights.reduce((max, curr) => (curr.weight > max.weight ? curr : max))
        : { weight: 0, reps: 0, logId: logs[0]?.id || '' };
      const maxVolumeEntry = allVolumes.length > 0
        ? allVolumes.reduce((max, curr) => (curr.volume > max.volume ? curr : max))
        : { volume: 0, logId: logs[0]?.id || '' };
      const maxRepsEntry = allReps.length > 0
        ? allReps.reduce((max, curr) => (curr.reps > max.reps ? curr : max))
        : { reps: 0, weight: 0, logId: logs[0]?.id || '' };

      const getLogDate = (logId: string) =>
        logs.find((l) => l.id === logId)?.sessionDate || '';

      exerciseStats[exerciseId] = {
        exerciseId,
        sessions: sessionsData.slice(0, 5),
        personalRecords: {
          maxWeight: {
            value: maxWeightEntry.weight,
            date: getLogDate(maxWeightEntry.logId),
            reps: maxWeightEntry.reps,
          },
          maxVolume: {
            value: Math.round(maxVolumeEntry.volume),
            date: getLogDate(maxVolumeEntry.logId),
          },
          maxReps: {
            value: maxRepsEntry.reps,
            date: getLogDate(maxRepsEntry.logId),
            weight: maxRepsEntry.weight,
          },
        },
      };
    }

    // Calculate overall stats
    const totalSessions = logs.length;
    const totalVolume = sessions.reduce((sum, s) => sum + s.totalVolume, 0);
    const avgDuration =
      sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length;
    const rpes = sessions.filter((s) => s.rpeLastSet).map((s) => s.rpeLastSet!);
    const avgRpe = rpes.length > 0 ? rpes.reduce((a, b) => a + b, 0) / rpes.length : 0;

    return NextResponse.json({
      hasHistory: true,
      sessions,
      exerciseStats,
      overallStats: {
        totalSessions,
        totalVolume: Math.round(totalVolume),
        avgDuration: Math.round(avgDuration),
        avgRpe: Math.round(avgRpe * 10) / 10,
      },
    });
  } catch (error) {
    console.error('[Workout Stats] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch workout stats' }, { status: 500 });
  }
}
