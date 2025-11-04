"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/Card";
import { PrimaryButton } from "@/components/PrimaryButton";
import { activatePlanAction, deletePlanAction } from "@/app/actions/plan";
import PlanGenerationProgress from "@/components/PlanGenerationProgress";
import { WorkoutCalendar } from "@/components/WorkoutCalendar";
import type { plans, workouts, workoutLogs as workoutLogsTable } from "@/drizzle/schema";
import { Calendar, Trash2, CheckCircle } from "lucide-react";

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
    percent: 0
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
  const timezoneLabel = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const calendarLogs = useMemo(
    () =>
      workoutLogs.map((log) => {
        const dateObj = new Date(log.sessionDate);
        const isoDate = !Number.isNaN(dateObj.getTime()) ? dateObj.toISOString().split("T")[0] : null;
        const status =
          Number(log.totalDurationMinutes ?? 0) === 0 ||
          (log.notes ?? "").toLowerCase().startsWith("skipped")
            ? "skipped"
            : "completed";

        return {
          workoutId: log.workoutId,
          sessionDate: isoDate,
          status,
        } as const;
      }),
    [workoutLogs],
  );

  useEffect(() => {
    if (activePlan?.startDate) {
      setStartDateUpdate(activePlan.startDate);
    }
  }, [activePlan?.startDate]);

  const [isGeneratingNextWeek, setIsGeneratingNextWeek] = useState(false);

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

      setSuccess(`Week ${data.weekNumber} generated successfully! (${data.phase} phase)`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate next week");
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
      percent: 0
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

        // Decode the chunk and split by newlines
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
                  percent: data.percent
                });
              } else if (data.type === 'complete') {
                setIsGenerating(false);
                const warnings = data.data.warnings?.length || 0;
                setSuccess(`Plan generated successfully! ${warnings ? `(${warnings} adjustments made)` : ""}`);
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
      setError(err instanceof Error ? err.message : "Failed to generate plan");
      setIsGenerating(false);
    }
  };

  const handleActivatePlan = async (planId: string) => {
    setIsActivating(true);
    setError(null);
    setSuccess(null);

    try {
      await activatePlanAction({ planId, startDate: selectedStartDate });
      setSuccess("Plan activated successfully!");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to activate plan");
    } finally {
      setIsActivating(false);
    }
  };

  const handleUpdateStartDate = async () => {
    if (!activePlan) return;
    if (!startDateUpdate) {
      setError("Please choose a start date");
      return;
    }

    setIsUpdatingStartDate(true);
    setError(null);
    setSuccess(null);

    try {
      await activatePlanAction({ planId: activePlan.id, startDate: startDateUpdate });
      setSuccess("Plan start date updated.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update start date");
    } finally {
      setIsUpdatingStartDate(false);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm("Are you sure you want to delete this plan?")) return;

    setError(null);
    setSuccess(null);

    try {
      await deletePlanAction(planId);
      setSuccess("Plan deleted successfully");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete plan");
    }
  };

  // Case 1: No plans exist
  if (userPlans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        {isGenerating ? (
          <PlanGenerationProgress
            stage={progressState.stage}
            message={progressState.message}
            percent={progressState.percent}
          />
        ) : (
          <Card className="max-w-md text-center">
            <Calendar className="mx-auto mb-4 h-12 w-12 text-fg2" />
            <h2 className="mb-2 text-xl font-semibold">No Training Plan Yet</h2>
            <p className="mb-6 text-sm text-fg2">
              Let&apos;s create your personalized training plan based on your profile and goals.
            </p>
            {error && (
              <div className="mb-4 rounded border border-line2 bg-bg2 p-3 text-sm text-fg1">
                {error}
              </div>
            )}
            <PrimaryButton onClick={handleGeneratePlan} loading={isGenerating}>
              Generate My Plan
            </PrimaryButton>
          </Card>
        )}
      </div>
    );
  }

  // Case 2: Plans exist but none active - show activation UI
  if (!activePlan) {
    const latestPlan = userPlans[0]; // Most recent plan

    if (isGenerating) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <PlanGenerationProgress
            stage={progressState.stage}
            message={progressState.message}
            percent={progressState.percent}
          />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {success && (
          <Card className="border-fg2 bg-bg2 p-4 text-sm text-fg0">
            <CheckCircle className="mb-2 inline h-4 w-4" /> {success}
          </Card>
        )}
        {error && (
          <Card className="border-line2 bg-bg2 p-4 text-sm text-fg1">{error}</Card>
        )}

        <Card>
          <h2 className="mb-4 text-lg font-semibold">Activate Your Plan</h2>
          <div className="mb-4">
            <h3 className="mb-2 font-medium">{latestPlan.title}</h3>
            <p className="text-sm text-fg2">{latestPlan.summary}</p>
            <div className="mt-3 flex gap-4 text-sm text-fg2">
              <span>{latestPlan.durationWeeks} weeks</span>
              <span>{latestPlan.daysPerWeek} days/week</span>
              <span>{latestPlan.minutesPerSession} min/session</span>
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="startDate" className="mb-2 block text-sm font-medium">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              value={selectedStartDate}
              onChange={(e) => setSelectedStartDate(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              className="h-12 w-full rounded border border-line1 bg-bg2 px-4 text-fg0 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <p className="mt-2 text-xs text-fg2">
              Workouts will align to this date once you activate the plan. Local timezone: {timezoneLabel}.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <PrimaryButton
              onClick={() => handleActivatePlan(latestPlan.id)}
              loading={isActivating}
              className="flex-1"
            >
              Start Plan
            </PrimaryButton>
            <button
              onClick={() => handleDeletePlan(latestPlan.id)}
              className="touch-feedback flex h-12 items-center justify-center rounded border border-line1 px-4 text-sm text-fg2 transition-all active:bg-bg2 sm:w-auto"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-medium">Want a different plan?</h3>
          <PrimaryButton onClick={handleGeneratePlan} loading={isGenerating}>
            Generate New Plan
          </PrimaryButton>
        </Card>
      </div>
    );
  }

  // Case 3: Active plan exists - show calendar view
  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <PlanGenerationProgress
          stage={progressState.stage}
          message={progressState.message}
          percent={progressState.percent}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {success && (
        <Card className="border-fg2 bg-bg2 p-4 text-sm text-fg0">
          <CheckCircle className="mb-2 inline h-4 w-4" /> {success}
        </Card>
      )}

      <Card>
        <div className="mb-4 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-semibold">{activePlan.title}</h2>
            <p className="text-sm text-fg2">{activePlan.summary}</p>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-fg2">
              <span>{activePlan.durationWeeks} weeks</span>
              <span>{activePlan.daysPerWeek} days/week</span>
              <span>Started: {activePlan.startDate || "Not set"}</span>
            </div>
            <p className="mt-2 text-xs text-fg2">
              Calendar times shown in your local timezone: {timezoneLabel}.
            </p>
          </div>
          <div className="w-full rounded border border-line1 bg-bg2 p-4 md:mt-0 md:w-auto md:min-w-[320px]">
            <h3 className="text-sm font-medium text-fg0">Adjust start date</h3>
            <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center">
              <input
                type="date"
                value={startDateUpdate}
                onChange={(e) => setStartDateUpdate(e.target.value)}
                className="h-12 rounded border border-line1 bg-bg0 px-4 text-sm text-fg0 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <PrimaryButton
                onClick={handleUpdateStartDate}
                loading={isUpdatingStartDate}
                disabled={!startDateUpdate || startDateUpdate === (activePlan.startDate || "")}
                className="w-full md:w-auto"
              >
                Update Start Date
              </PrimaryButton>
            </div>
            <p className="mt-2 text-xs text-fg2">
              We&apos;ll realign every workout in the calendar to the date you choose.
            </p>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="mt-6">
          <WorkoutCalendar
            workouts={workouts}
            weeks={activePlan.durationWeeks}
            startDate={activePlan.startDate || new Date().toISOString().split("T")[0]}
            logs={calendarLogs}
          />

          {/* Adaptive Planning Info & Generate Next Week */}
          {workouts.length > 0 && (
            <div className="mt-6 space-y-4">
              {/* Show adaptive planning message if only Week 1 exists */}
              {workouts.every(w => w.weekIndex === 0) && (
                <div className="rounded-lg border border-line1 bg-bg1 p-4">
                  <p className="text-sm text-fg1">
                    <span className="font-medium text-fg0">Adaptive Planning: </span>
                    Your plan adapts week-by-week based on performance. Complete Week 1 to unlock Week 2 generation.
                  </p>
                </div>
              )}

              {/* Show Generate Next Week button if current week has progress */}
              {(() => {
                const maxWeek = Math.max(...workouts.map(w => w.weekNumber));
                const currentWeekWorkouts = workouts.filter(w => w.weekNumber === maxWeek);
                const currentWeekLogs = calendarLogs.filter(log =>
                  currentWeekWorkouts.some(w => w.id === log.workoutId)
                );
                const hasAnyProgress = currentWeekLogs.length > 0;
                const canGenerateNext = maxWeek < activePlan.durationWeeks;

                return hasAnyProgress && canGenerateNext && (
                  <div className="rounded-lg border border-line1 bg-bg1 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-fg0">Ready for Week {maxWeek + 1}?</p>
                        <p className="mt-1 text-xs text-fg2">
                          Week {maxWeek} progress detected. Generate your next week based on performance.
                        </p>
                      </div>
                      <PrimaryButton
                        onClick={handleGenerateNextWeek}
                        loading={isGeneratingNextWeek}
                        className="ml-4 whitespace-nowrap"
                      >
                        Generate Week {maxWeek + 1}
                      </PrimaryButton>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 text-sm font-medium text-fg2">Need a new plan?</h3>
        <PrimaryButton onClick={handleGeneratePlan} loading={isGenerating}>
          Generate New Plan
        </PrimaryButton>
      </Card>
    </div>
  );
}
