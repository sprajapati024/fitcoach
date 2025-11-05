"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deletePlanAction } from "@/app/actions/plan";
import { updateCustomInstructionsAction } from "@/app/actions/profile";
import type { profiles, plans } from "@/drizzle/schema";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ProfileEditor } from "./ProfileEditor";

type Profile = typeof profiles.$inferSelect;
type Plan = typeof plans.$inferSelect;

interface SettingsViewProps {
  profile: Profile | null;
  userPlans: Plan[];
}

export function SettingsView({ profile, userPlans }: SettingsViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [customInstructions, setCustomInstructions] = useState(profile?.coachNotes || "");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleSaveInstructions = () => {
    setSaveSuccess(false);
    setSaveError(null);

    startTransition(async () => {
      try {
        await updateCustomInstructionsAction(customInstructions);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } catch (error) {
        setSaveError(error instanceof Error ? error.message : "Failed to save");
      }
    });
  };

  const handleDeletePlan = (planId: string) => {
    startTransition(async () => {
      try {
        await deletePlanAction(planId);
        setDeleteConfirmId(null);
        // Refresh the page to show updated plan list
        router.refresh();
      } catch (error) {
        console.error("Failed to delete plan:", error);
        alert("Failed to delete plan. Please try again.");
      }
    });
  };

  const charCount = customInstructions.length;
  const maxChars = 500;
  const isOverLimit = charCount > maxChars;

  return (
    <div className="space-y-8">
      {/* Profile Editor */}
      <ProfileEditor profile={profile} />

      {/* Custom Instructions Section */}
      <div className="rounded-lg border border-surface-border bg-surface-0 p-6">
        <h2 className="mb-2 text-lg font-semibold text-text-primary">
          Plan Generation Preferences
        </h2>
        <p className="mb-4 text-sm text-text-muted">
          Add custom instructions to personalize your workout plans
        </p>

        <div className="space-y-3">
          <label htmlFor="customInstructions" className="block text-sm font-medium text-text-secondary">
            Custom Instructions for Workout Plans
          </label>
          <textarea
            id="customInstructions"
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            placeholder="E.g., Focus on posterior chain, avoid overhead movements, prefer dumbbell variations..."
            className="w-full rounded-md border border-surface-border bg-surface-1 p-3 text-sm text-text-primary placeholder:text-text-muted transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
            rows={4}
            maxLength={maxChars + 50} // Allow typing a bit over to show error
          />
          <div className="flex items-center justify-between">
            <span className={`text-xs ${isOverLimit ? "text-error" : "text-text-muted"}`}>
              {charCount}/{maxChars} characters
            </span>
            {saveSuccess && (
              <span className="text-xs text-success">✓ Saved successfully</span>
            )}
            {saveError && (
              <span className="text-xs text-error">{saveError}</span>
            )}
          </div>
          <p className="text-xs text-fg3">
            These instructions will be included when generating your workout plans.
            Be specific about preferences, limitations, or focus areas.
          </p>

          <PrimaryButton
            onClick={handleSaveInstructions}
            disabled={isPending || isOverLimit}
            loading={isPending}
          >
            Save Preferences
          </PrimaryButton>
        </div>
      </div>

      {/* My Workout Plans Section */}
      <div className="rounded-lg border border-surface-border bg-surface-0 p-6">
        <h2 className="mb-2 text-lg font-semibold text-text-primary">My Workout Plans</h2>
        <p className="mb-4 text-sm text-text-muted">
          Manage your training plans
        </p>

        {userPlans.length === 0 ? (
          <p className="text-sm text-fg3">No workout plans yet. Generate one from the Plan page!</p>
        ) : (
          <div className="space-y-3">
            {userPlans.map((plan) => (
              <div
                key={plan.id}
                className="flex items-center justify-between rounded-md border border-surface-border bg-surface-1 p-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium text-text-primary">{plan.title}</h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium uppercase ${
                        plan.status === "active"
                          ? "bg-green-500/20 text-green-500"
                          : plan.status === "draft"
                          ? "bg-yellow-500/20 text-yellow-500"
                          : "bg-fg3/20 text-fg3"
                      }`}
                    >
                      {plan.status}
                    </span>
                  </div>
                  <div className="mt-1 flex gap-4 text-xs text-fg3">
                    <span>{plan.durationWeeks} weeks</span>
                    <span>{plan.daysPerWeek} days/week</span>
                    <span>
                      Created {new Date(plan.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {deleteConfirmId === plan.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-muted">Delete this plan?</span>
                    <button
                      onClick={() => handleDeletePlan(plan.id)}
                      disabled={isPending}
                      className="touch-feedback rounded-full bg-red-500 px-3 py-1 text-xs font-medium text-white shadow-[0_2px_6px_rgba(239,68,68,0.4)] transition-all active:bg-red-600 disabled:opacity-50"
                    >
                      {isPending ? "Deleting..." : "Confirm"}
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      disabled={isPending}
                      className="touch-feedback rounded-full border border-surface-border px-3 py-1 text-xs font-medium text-text-muted transition-all active:bg-surface-2"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirmId(plan.id)}
                    className="touch-feedback rounded-full border border-surface-border px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-text-muted transition-all active:border-red-500 active:text-red-500"
                  >
                    Delete
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {userPlans.length > 0 && (
          <p className="mt-4 text-xs text-fg3">
            ⚠️ Deleting a plan will permanently remove all workouts and logs. This action cannot be undone.
          </p>
        )}
      </div>
    </div>
  );
}
