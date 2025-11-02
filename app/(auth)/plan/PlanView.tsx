"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/Card";
import { PrimaryButton } from "@/components/PrimaryButton";
import { activatePlanAction, deletePlanAction } from "@/app/actions/plan";
import PlanGenerationProgress from "@/components/PlanGenerationProgress";
import { WorkoutCalendar } from "@/components/WorkoutCalendar";
import type { plans, workouts } from "@/drizzle/schema";
import { Calendar, Trash2, CheckCircle } from "lucide-react";

type Plan = typeof plans.$inferSelect;
type Workout = typeof workouts.$inferSelect;

interface PlanViewProps {
  activePlan: Plan | null;
  userPlans: Plan[];
  workouts: Workout[];
}

interface ProgressState {
  stage: string;
  message: string;
  percent: number;
}

export function PlanView({ activePlan, userPlans, workouts }: PlanViewProps) {
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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
              Let's create your personalized training plan based on your profile and goals.
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
              className="h-12 w-full rounded border border-line1 bg-bg2 px-4 text-fg0 focus:border-fg0 focus:outline-none"
            />
          </div>

          <div className="flex gap-3">
            <PrimaryButton
              onClick={() => handleActivatePlan(latestPlan.id)}
              loading={isActivating}
              className="flex-1"
            >
              Start Plan
            </PrimaryButton>
            <button
              onClick={() => handleDeletePlan(latestPlan.id)}
              className="rounded border border-line1 px-4 text-sm text-fg2 hover:bg-bg2"
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
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">{activePlan.title}</h2>
            <p className="text-sm text-fg2">{activePlan.summary}</p>
            <div className="mt-2 flex gap-4 text-sm text-fg2">
              <span>{activePlan.durationWeeks} weeks</span>
              <span>{activePlan.daysPerWeek} days/week</span>
              <span>Started: {activePlan.startDate || "Not set"}</span>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="mt-6">
          <WorkoutCalendar
            workouts={workouts}
            weeks={activePlan.durationWeeks}
            daysPerWeek={activePlan.daysPerWeek}
            startDate={activePlan.startDate || new Date().toISOString().split("T")[0]}
          />
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
