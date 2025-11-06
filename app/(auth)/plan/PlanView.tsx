'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { activatePlanAction, deletePlanAction } from '@/app/actions/plan';
import PlanGenerationProgress from '@/components/PlanGenerationProgress';
import { CompactCalendar } from './CompactCalendar';
import { CompactPlanCard } from './CompactPlanCard';
import type { plans, workouts, workoutLogs as workoutLogsTable } from '@/drizzle/schema';
import {
  Calendar,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Settings,
  Plus,
  Sparkles,
} from 'lucide-react';

type Plan = typeof plans.$inferSelect;
type Workout = typeof workouts.$inferSelect;
type WorkoutLog = typeof workoutLogsTable.$inferSelect;

interface PlanViewProps {
  activePlan: Plan | null;
  userPlans: Plan[];
  workouts: Workout[];
  workoutLogs: WorkoutLog[];
}

interface ProgressState {
  stage: string;
  message: string;
  percent: number;
}

export function PlanView({ activePlan, userPlans, workouts, workoutLogs }: PlanViewProps) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressState, setProgressState] = useState<ProgressState>({
    stage: 'initializing',
    message: 'Starting...',
    percent: 0,
  });
  const [isActivating, setIsActivating] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [startDateUpdate, setStartDateUpdate] = useState(
    activePlan?.startDate || new Date().toISOString().slice(0, 10)
  );
  const [isUpdatingStartDate, setIsUpdatingStartDate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showStartDateSettings, setShowStartDateSettings] = useState(false);
  const [isGeneratingNextWeek, setIsGeneratingNextWeek] = useState(false);

  const calendarLogs = useMemo(
    () =>
      workoutLogs.map((log) => {
        const dateObj = new Date(log.sessionDate);
        const isoDate = !Number.isNaN(dateObj.getTime())
          ? dateObj.toISOString().split('T')[0]
          : null;
        const status =
          Number(log.totalDurationMinutes ?? 0) === 0 ||
          (log.notes ?? '').toLowerCase().startsWith('skipped')
            ? 'skipped'
            : 'completed';

        return {
          workoutId: log.workoutId,
          sessionDate: isoDate,
          status,
        } as const;
      }),
    [workoutLogs]
  );

  useEffect(() => {
    if (activePlan?.startDate) {
      setStartDateUpdate(activePlan.startDate);
    }
  }, [activePlan?.startDate]);

  const handleGenerateNextWeek = async () => {
    if (!activePlan) return;

    setIsGeneratingNextWeek(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/plan/generate-next-week', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId: activePlan.id }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate next week');
      }

      setSuccess(`Week ${data.weekNumber} generated!`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate next week');
    } finally {
      setIsGeneratingNextWeek(false);
    }
  };

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    setError(null);
    setSuccess(null);
    setProgressState({
      stage: 'initializing',
      message: 'Starting plan generation...',
      percent: 0,
    });

    try {
      const response = await fetch('/api/plan/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'progress') {
                setProgressState({
                  stage: data.stage,
                  message: data.message,
                  percent: data.percent,
                });
              } else if (data.type === 'complete') {
                setIsGenerating(false);
                const warnings = data.data.warnings?.length || 0;
                setSuccess(
                  `Plan generated! ${warnings ? `(${warnings} adjustments)` : ''}`
                );
                router.refresh();
                return;
              } else if (data.type === 'error') {
                setIsGenerating(false);
                setError(data.error);
                return;
              }
            } catch (err) {
              console.error('Failed to parse SSE message:', err);
            }
          }
        }
      }

      setIsGenerating(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate plan');
      setIsGenerating(false);
    }
  };

  const handleActivatePlan = async (planId: string) => {
    setIsActivating(true);
    setError(null);
    setSuccess(null);

    try {
      await activatePlanAction({ planId, startDate: selectedStartDate });
      setSuccess('Plan activated!');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to activate plan');
    } finally {
      setIsActivating(false);
    }
  };

  const handleUpdateStartDate = async () => {
    if (!activePlan) return;
    if (!startDateUpdate) {
      setError('Please choose a start date');
      return;
    }

    setIsUpdatingStartDate(true);
    setError(null);
    setSuccess(null);

    try {
      await activatePlanAction({ planId: activePlan.id, startDate: startDateUpdate });
      setSuccess('Start date updated!');
      setShowStartDateSettings(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update start date');
    } finally {
      setIsUpdatingStartDate(false);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Delete this plan? This cannot be undone.')) return;

    setError(null);
    setSuccess(null);

    try {
      await deletePlanAction(planId);
      setSuccess('Plan deleted');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete plan');
    }
  };

  // Case 1: No plans exist
  if (userPlans.length === 0) {
    return (
      <div className="min-h-screen bg-black -mx-4 -mt-6 -mb-32 flex items-center justify-center px-3">
        {isGenerating ? (
          <PlanGenerationProgress
            stage={progressState.stage}
            message={progressState.message}
            percent={progressState.percent}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md space-y-4"
          >
            {/* Icon and message */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-cyan-500/20 to-indigo-600/20 mb-2">
                <Calendar className="h-8 w-8 text-cyan-500" />
              </div>
              <h2 className="text-lg font-semibold text-white">No Training Plan Yet</h2>
              <p className="text-sm text-gray-400">
                Let's create your personalized plan based on your profile
              </p>
            </div>

            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400"
              >
                <AlertCircle className="inline h-4 w-4 mr-2" />
                {error}
              </motion.div>
            )}

            {/* Generate button */}
            <button
              onClick={handleGeneratePlan}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 h-12 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-semibold transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="h-5 w-5" />
              Generate My Plan with AI
            </button>

            {/* Custom plan button */}
            <button
              onClick={() => router.push('/plan/custom')}
              className="w-full flex items-center justify-center gap-2 h-12 rounded-lg border border-gray-800 bg-gray-900 text-gray-300 font-medium transition active:scale-95 hover:bg-gray-800"
            >
              <Plus className="h-5 w-5" />
              Create Custom Plan
            </button>
          </motion.div>
        )}
      </div>
    );
  }

  // Case 2: Plans exist but none active - show activation UI
  if (!activePlan) {
    const latestPlan = userPlans[0];

    if (isGenerating) {
      return (
        <div className="min-h-screen bg-black -mx-4 -mt-6 -mb-32 flex items-center justify-center px-3">
          <PlanGenerationProgress
            stage={progressState.stage}
            message={progressState.message}
            percent={progressState.percent}
          />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-black -mx-4 -mt-6 -mb-32">
        <main className="mx-auto max-w-md px-3 pt-4 pb-20 space-y-3">
          {/* Success message */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-400"
            >
              <CheckCircle className="inline h-4 w-4 mr-2" />
              {success}
            </motion.div>
          )}

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400"
            >
              <AlertCircle className="inline h-4 w-4 mr-2" />
              {error}
            </motion.div>
          )}

          {/* Page title */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-xl font-semibold text-white mb-1">Activate Your Plan</h1>
            <p className="text-sm text-gray-400">Choose a start date to begin</p>
          </motion.div>

          {/* Plan card */}
          <CompactPlanCard plan={latestPlan} delay={0.1} />

          {/* Start date picker */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="rounded-lg border border-gray-800 bg-gray-900 p-3 space-y-3"
          >
            <label htmlFor="startDate" className="block text-sm font-medium text-white">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              value={selectedStartDate}
              onChange={(e) => setSelectedStartDate(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              className="w-full h-12 rounded-lg border border-gray-800 bg-black px-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
            />
            <p className="text-xs text-gray-500">
              Workouts will align to this date once activated
            </p>
          </motion.div>

          {/* Activate button */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            onClick={() => handleActivatePlan(latestPlan.id)}
            disabled={isActivating}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-semibold transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start Plan
          </motion.button>
        </main>
      </div>
    );
  }

  // Case 3: Active plan exists - show calendar view
  if (isGenerating) {
    return (
      <div className="min-h-screen bg-black -mx-4 -mt-6 -mb-32 flex items-center justify-center px-3">
        <PlanGenerationProgress
          stage={progressState.stage}
          message={progressState.message}
          percent={progressState.percent}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black -mx-4 -mt-6 -mb-32">
      <main className="mx-auto max-w-md px-3 pt-4 pb-20 space-y-3">
        {/* Success message */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-400"
          >
            <CheckCircle className="inline h-4 w-4 mr-2" />
            {success}
          </motion.div>
        )}

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400"
          >
            <AlertCircle className="inline h-4 w-4 mr-2" />
            {error}
          </motion.div>
        )}

        {/* Plan header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-1"
        >
          <h1 className="text-xl font-semibold text-white">{activePlan.title}</h1>
          <p className="text-sm text-gray-400">{activePlan.summary}</p>
        </motion.div>

        {/* Calendar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="rounded-lg border border-gray-800 bg-gray-900 p-3"
        >
          <CompactCalendar
            workouts={workouts}
            weeks={activePlan.durationWeeks}
            startDate={activePlan.startDate || new Date().toISOString().split('T')[0]}
            logs={calendarLogs}
          />
        </motion.div>

        {/* Adaptive Planning Info & Generate Next Week */}
        {workouts.length > 0 && (() => {
          const maxWeek = Math.max(...workouts.map((w) => w.weekNumber));
          const currentWeekWorkouts = workouts.filter((w) => w.weekNumber === maxWeek);
          const currentWeekLogs = calendarLogs.filter((log) =>
            currentWeekWorkouts.some((w) => w.id === log.workoutId)
          );
          const hasAnyProgress = currentWeekLogs.length > 0;
          const canGenerateNext = maxWeek < activePlan.durationWeeks;
          const showAdaptiveMessage = workouts.every((w) => w.weekIndex === 0);

          return (
            <>
              {showAdaptiveMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-3"
                >
                  <p className="text-sm text-cyan-400">
                    <span className="font-medium">Adaptive Planning: </span>
                    Complete Week 1 to unlock Week 2 generation
                  </p>
                </motion.div>
              )}

              {hasAnyProgress && canGenerateNext && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="rounded-lg border border-gray-800 bg-gray-900 p-3 space-y-2"
                >
                  <div>
                    <p className="text-sm font-medium text-white">
                      Ready for Week {maxWeek + 1}?
                    </p>
                    <p className="text-xs text-gray-500">
                      Week {maxWeek} progress detected
                    </p>
                  </div>
                  <button
                    onClick={handleGenerateNextWeek}
                    disabled={isGeneratingNextWeek}
                    className="w-full flex items-center justify-center gap-2 h-10 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 text-white text-sm font-semibold transition active:scale-95 disabled:opacity-50"
                  >
                    <Sparkles className="h-4 w-4" />
                    Generate Week {maxWeek + 1}
                  </button>
                </motion.div>
              )}
            </>
          );
        })()}

        {/* Settings - Collapsible */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="rounded-lg border border-gray-800 bg-gray-900 overflow-hidden"
        >
          <button
            onClick={() => setShowStartDateSettings(!showStartDateSettings)}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-800/50 transition"
          >
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-white">Plan Settings</span>
            </div>
            {showStartDateSettings ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </button>

          <AnimatePresence>
            {showStartDateSettings && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="border-t border-gray-800"
              >
                <div className="p-3 space-y-3">
                  <div>
                    <label htmlFor="startDateUpdate" className="block text-sm font-medium text-white mb-2">
                      Adjust Start Date
                    </label>
                    <input
                      type="date"
                      id="startDateUpdate"
                      value={startDateUpdate}
                      onChange={(e) => setStartDateUpdate(e.target.value)}
                      className="w-full h-10 rounded-lg border border-gray-800 bg-black px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      All workouts will realign to this date
                    </p>
                  </div>
                  <button
                    onClick={handleUpdateStartDate}
                    disabled={
                      isUpdatingStartDate ||
                      !startDateUpdate ||
                      startDateUpdate === (activePlan.startDate || '')
                    }
                    className="w-full h-10 rounded-lg bg-gray-800 text-white text-sm font-medium transition active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-700"
                  >
                    Update Start Date
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>
    </div>
  );
}
