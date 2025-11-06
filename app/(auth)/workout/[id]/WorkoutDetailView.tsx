"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ExerciseLogger, type LoggerResult } from "@/app/(auth)/dashboard/ExerciseLogger";
import { PrimaryButton } from "@/components/PrimaryButton";
import { WorkoutEditor } from "@/components/WorkoutEditor";
import type { workouts, WorkoutPayload } from "@/drizzle/schema";
import { Edit2, TrendingUp, Award, Calendar, Clock, BarChart3, Zap } from "lucide-react";

type Workout = typeof workouts.$inferSelect;

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

type ExerciseStats = {
  exerciseId: string;
  sessions: Array<{
    date: string;
    sets: Array<{ weight: number; reps: number; rpe?: number }>;
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

type WorkoutStats = {
  hasHistory: boolean;
  sessions: SessionSummary[];
  exerciseStats: Record<string, ExerciseStats>;
  overallStats: {
    totalSessions: number;
    totalVolume: number;
    avgDuration: number;
    avgRpe: number;
  };
};

interface WorkoutDetailViewProps {
  workout: Workout;
}

export function WorkoutDetailView({ workout }: WorkoutDetailViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLogging, setIsLogging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [stats, setStats] = useState<WorkoutStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const workoutPayload = workout.payload as WorkoutPayload;
  const today = new Date().toISOString().split("T")[0];
  const isPast = workout.sessionDate ? workout.sessionDate < today : false;
  const isFuture = workout.sessionDate ? workout.sessionDate > today : false;
  const isToday = workout.sessionDate ? workout.sessionDate === today : false;

  // Auto-start logger if ?start=true query param is present
  useEffect(() => {
    if (searchParams.get('start') === 'true' && !isPast) {
      setIsLogging(true);
    }
  }, [searchParams, isPast]);

  // Fetch workout stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/workouts/${workout.id}/stats`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch workout stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, [workout.id]);

  const handleLoggerComplete = (result: LoggerResult) => {
    void result;
    setIsLogging(false);
    router.refresh();
  };

  if (isLogging) {
    return (
      <ExerciseLogger
        workout={workout}
        onComplete={handleLoggerComplete}
        onCancel={() => setIsLogging(false)}
      />
    );
  }

  // Calculate total exercises
  const totalExercises =
    workoutPayload.blocks?.reduce((sum, block) => sum + (block.exercises?.length ?? 0), 0) ?? 0;

  // Helper to format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Get exercise name from workout payload
  const getExerciseName = (exerciseId: string) => {
    for (const block of workoutPayload.blocks || []) {
      const exercise = block.exercises?.find((ex) => ex.id === exerciseId);
      if (exercise) return exercise.name || exerciseId;
    }
    return exerciseId;
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-text-muted text-sm mb-4 hover:text-text-primary transition"
        >
          ← Back
        </button>

        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              {workout.title}
            </h1>
            <div className="flex gap-4 text-sm text-text-muted">
              {workout.sessionDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(workout.sessionDate).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              )}
              <span>Week {(workout.weekIndex || 0) + 1}</span>
              {workout.isDeload && (
                <span className="text-xs font-medium text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded">
                  Deload Week
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Contextual Action Button */}
        {isToday && (
          <div className="mb-6">
            <PrimaryButton
              onClick={() => setIsLogging(true)}
              className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-600 hover:to-indigo-600"
            >
              <Zap className="h-5 w-5 mr-2 inline" />
              Start Today's Workout
            </PrimaryButton>
          </div>
        )}

        {isFuture && (
          <div className="mb-6">
            <div className="w-full py-4 text-center rounded-lg border-2 border-indigo-500/30 bg-indigo-500/5">
              <div className="flex items-center justify-center gap-2 text-indigo-400 mb-1">
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-medium">Scheduled for</span>
              </div>
              <div className="text-lg font-semibold text-white">
                {new Date(workout.sessionDate!).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>
          </div>
        )}

        {isPast && !stats?.hasHistory && (
          <div className="mb-6">
            <div className="w-full py-4 text-center rounded-lg border border-gray-700 bg-gray-800/50">
              <span className="text-sm text-gray-400">This workout was scheduled for the past</span>
            </div>
          </div>
        )}
      </div>

      {/* Overall Stats Cards */}
      {stats?.hasHistory && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-cyan-400" />
            Performance Overview
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-surface-1 border border-surface-border rounded-lg p-4">
              <div className="text-text-muted text-xs uppercase tracking-wide mb-1">
                Total Sessions
              </div>
              <div className="text-2xl font-bold text-text-primary">
                {stats.overallStats.totalSessions}
              </div>
            </div>
            <div className="bg-surface-1 border border-surface-border rounded-lg p-4">
              <div className="text-text-muted text-xs uppercase tracking-wide mb-1">
                Total Volume
              </div>
              <div className="text-2xl font-bold text-text-primary">
                {(stats.overallStats.totalVolume / 1000).toFixed(1)}
                <span className="text-sm text-text-muted ml-1">tons</span>
              </div>
            </div>
            <div className="bg-surface-1 border border-surface-border rounded-lg p-4">
              <div className="text-text-muted text-xs uppercase tracking-wide mb-1">
                Avg Duration
              </div>
              <div className="text-2xl font-bold text-text-primary">
                {stats.overallStats.avgDuration}
                <span className="text-sm text-text-muted ml-1">min</span>
              </div>
            </div>
            <div className="bg-surface-1 border border-surface-border rounded-lg p-4">
              <div className="text-text-muted text-xs uppercase tracking-wide mb-1">
                Avg RPE
              </div>
              <div className="text-2xl font-bold text-text-primary">
                {stats.overallStats.avgRpe || "—"}
                <span className="text-sm text-text-muted ml-1">/10</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Sessions */}
      {stats?.hasHistory && stats.sessions.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
            <Clock className="h-5 w-5 text-cyan-400" />
            Recent Sessions
          </h2>
          <div className="space-y-3">
            {stats.sessions.map((session) => (
              <div
                key={session.logId}
                className="bg-surface-1 border border-surface-border rounded-lg p-4 hover:bg-surface-2 transition"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-medium text-text-primary">
                      {formatDate(session.date)}
                    </div>
                    <div className="text-xs text-text-muted mt-0.5">
                      {session.exerciseCount} exercises • {session.totalSets} sets
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-cyan-400">
                      {session.totalVolume.toLocaleString()} kg
                    </div>
                    <div className="text-xs text-text-muted">
                      {session.duration} min
                      {session.rpeLastSet && ` • ${session.rpeLastSet} RPE`}
                    </div>
                  </div>
                </div>
                {session.notes && (
                  <div className="text-xs text-text-secondary mt-2 pt-2 border-t border-surface-border">
                    {session.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exercise PRs */}
      {stats?.hasHistory && Object.keys(stats.exerciseStats).length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-400" />
            Personal Records
          </h2>
          <div className="space-y-3">
            {Object.entries(stats.exerciseStats).map(([exerciseId, exerciseData]) => (
              <div
                key={exerciseId}
                className="bg-surface-1 border border-surface-border rounded-lg p-4"
              >
                <div className="font-medium text-text-primary mb-3">
                  {getExerciseName(exerciseId)}
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <div className="text-text-muted text-xs mb-1">Max Weight</div>
                    <div className="font-semibold text-text-primary">
                      {exerciseData.personalRecords.maxWeight.value} kg
                    </div>
                    <div className="text-xs text-text-muted">
                      {exerciseData.personalRecords.maxWeight.reps} reps
                    </div>
                  </div>
                  <div>
                    <div className="text-text-muted text-xs mb-1">Max Volume</div>
                    <div className="font-semibold text-text-primary">
                      {exerciseData.personalRecords.maxVolume.value} kg
                    </div>
                    <div className="text-xs text-text-muted">
                      {formatDate(exerciseData.personalRecords.maxVolume.date)}
                    </div>
                  </div>
                  <div>
                    <div className="text-text-muted text-xs mb-1">Max Reps</div>
                    <div className="font-semibold text-text-primary">
                      {exerciseData.personalRecords.maxReps.value} reps
                    </div>
                    <div className="text-xs text-text-muted">
                      @ {exerciseData.personalRecords.maxReps.weight} kg
                    </div>
                  </div>
                </div>

                {/* Mini volume chart */}
                {exerciseData.sessions.length > 1 && (
                  <div className="mt-4 pt-3 border-t border-surface-border">
                    <div className="text-xs text-text-muted mb-2 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Volume Trend
                    </div>
                    <div className="flex items-end gap-1 h-12">
                      {exerciseData.sessions.slice(0, 5).reverse().map((session, idx) => {
                        const maxVolume = Math.max(
                          ...exerciseData.sessions.map((s) => s.totalVolume)
                        );
                        const height = (session.totalVolume / maxVolume) * 100;
                        return (
                          <div
                            key={idx}
                            className="flex-1 bg-gradient-to-t from-cyan-500 to-indigo-500 rounded-t"
                            style={{ height: `${height}%` }}
                            title={`${session.totalVolume} kg on ${formatDate(session.date)}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Workout Details (Collapsible) */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-text-primary mb-3">
          Workout Details
        </h2>
        <div className="bg-surface-1 border border-surface-border rounded-lg p-4 mb-3">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-text-muted text-xs mb-1">Duration</div>
              <div className="text-text-primary font-medium">
                {workout.durationMinutes} min
              </div>
            </div>
            <div>
              <div className="text-text-muted text-xs mb-1">Exercises</div>
              <div className="text-text-primary font-medium">{totalExercises}</div>
            </div>
            <div>
              <div className="text-text-muted text-xs mb-1">Focus</div>
              <div className="text-text-primary font-medium capitalize">
                {workoutPayload.focus?.replace(/_/g, " ") || "Training"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Workout Blocks */}
      <div className="space-y-4 mb-6">
        {workoutPayload.blocks?.map((block, blockIndex) => (
          <div
            key={blockIndex}
            className="bg-surface-0 border border-surface-border rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-text-primary">{block.title}</h3>
              <span className="text-xs text-text-muted uppercase tracking-wide">
                {block.type}
              </span>
            </div>

            <div className="space-y-3">
              {block.exercises?.map((exercise, exIndex) => (
                <div
                  key={exIndex}
                  className="bg-surface-1 rounded-md p-3 border border-surface-border"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-medium text-text-primary mb-1">
                        {exercise.name || exercise.id}
                      </div>
                      <div className="text-sm text-text-muted">
                        {exercise.equipment && (
                          <span className="capitalize">
                            {exercise.equipment.replace(/_/g, " ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 text-sm">
                    <div>
                      <span className="text-text-muted">Sets:</span>{" "}
                      <span className="text-text-primary font-medium">
                        {exercise.sets}
                      </span>
                    </div>
                    <div>
                      <span className="text-text-muted">Reps:</span>{" "}
                      <span className="text-text-primary font-medium">
                        {exercise.reps}
                      </span>
                    </div>
                    {exercise.tempo && (
                      <div>
                        <span className="text-text-muted">Tempo:</span>{" "}
                        <span className="text-text-primary font-medium">
                          {exercise.tempo}
                        </span>
                      </div>
                    )}
                    {exercise.restSeconds && (
                      <div>
                        <span className="text-text-muted">Rest:</span>{" "}
                        <span className="text-text-primary font-medium">
                          {exercise.restSeconds}s
                        </span>
                      </div>
                    )}
                  </div>

                  {exercise.cues && exercise.cues.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-surface-border">
                      <div className="text-xs text-text-muted mb-1">Form Cues:</div>
                      <ul className="text-xs text-text-secondary space-y-0.5">
                        {exercise.cues.map((cue, cueIndex) => (
                          <li key={cueIndex}>• {cue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={() => setIsEditing(true)}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-surface-1 hover:bg-surface-2 text-text-primary rounded-lg border border-surface-border transition"
        >
          <Edit2 className="h-5 w-5" />
          Edit Workout
        </button>
      </div>

      {/* Workout Editor Modal */}
      <WorkoutEditor
        workout={workout}
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        onSave={() => {
          setIsEditing(false);
          router.refresh();
        }}
      />
    </div>
  );
}
