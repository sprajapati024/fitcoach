"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deletePlanAction } from "@/app/actions/plan";
import { updateCustomInstructionsAction } from "@/app/actions/profile";
import type { profiles, plans } from "@/drizzle/schema";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ProfileEditor } from "./ProfileEditor";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { Download } from "lucide-react";

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
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

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
    <div className="space-y-3">
      {/* Install Prompt Modal */}
      {showInstallPrompt && <InstallPrompt onClose={() => setShowInstallPrompt(false)} />}

      {/* Install App Section */}
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
        <h2 className="mb-2 text-base font-semibold text-white">Install App</h2>
        <p className="mb-4 text-sm text-gray-400">
          Install FitCoach on your home screen for the best experience
        </p>
        <button
          onClick={() => setShowInstallPrompt(true)}
          className="inline-flex items-center gap-2 h-11 px-5 rounded-full border border-gray-700 bg-gray-800 text-sm font-medium text-white transition-all hover:bg-gray-700 active:scale-95"
        >
          <Download className="h-4 w-4" />
          Install FitCoach
        </button>
      </div>

      {/* Profile Editor */}
      <ProfileEditor profile={profile} />

      {/* Custom Instructions Section */}
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
        <h2 className="mb-2 text-base font-semibold text-white">
          Plan Generation Preferences
        </h2>
        <p className="mb-4 text-sm text-gray-400">
          Add custom instructions to personalize your workout plans
        </p>

        <div className="space-y-3">
          <label htmlFor="customInstructions" className="block text-sm font-medium text-gray-300">
            Custom Instructions for Workout Plans
          </label>
          <textarea
            id="customInstructions"
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            placeholder="E.g., Focus on posterior chain, avoid overhead movements, prefer dumbbell variations..."
            className="w-full rounded-md border border-gray-700 bg-gray-800 p-3 text-sm text-white placeholder:text-gray-500 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
            rows={4}
            maxLength={maxChars + 50} // Allow typing a bit over to show error
          />
          <div className="flex items-center justify-between">
            <span className={`text-xs ${isOverLimit ? "text-red-400" : "text-gray-400"}`}>
              {charCount}/{maxChars} characters
            </span>
            {saveSuccess && (
              <span className="text-xs text-green-400">✓ Saved successfully</span>
            )}
            {saveError && (
              <span className="text-xs text-red-400">{saveError}</span>
            )}
          </div>
          <p className="text-xs text-gray-500">
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
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
        <h2 className="mb-2 text-base font-semibold text-white">My Workout Plans</h2>
        <p className="mb-4 text-sm text-gray-400">
          Manage your training plans
        </p>

        {userPlans.length === 0 ? (
          <p className="text-sm text-gray-500">No workout plans yet. Generate one from the Plan page!</p>
        ) : (
          <div className="space-y-3">
            {userPlans.map((plan) => (
              <div
                key={plan.id}
                className="flex items-center justify-between rounded-md border border-gray-700 bg-gray-800 p-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium text-white">{plan.title}</h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium uppercase ${
                        plan.status === "active"
                          ? "bg-green-500/20 text-green-500"
                          : plan.status === "draft"
                          ? "bg-yellow-500/20 text-yellow-500"
                          : "bg-gray-500/20 text-gray-500"
                      }`}
                    >
                      {plan.status}
                    </span>
                  </div>
                  <div className="mt-1 flex gap-4 text-xs text-gray-500">
                    <span>{plan.durationWeeks} weeks</span>
                    <span>{plan.daysPerWeek} days/week</span>
                    <span>
                      Created {new Date(plan.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {deleteConfirmId === plan.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Delete this plan?</span>
                    <button
                      onClick={() => handleDeletePlan(plan.id)}
                      disabled={isPending}
                      className="rounded-full bg-red-500 px-3 py-1 text-xs font-medium text-white shadow-[0_2px_6px_rgba(239,68,68,0.4)] transition-all hover:bg-red-600 active:scale-95 disabled:opacity-50"
                    >
                      {isPending ? "Deleting..." : "Confirm"}
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      disabled={isPending}
                      className="rounded-full border border-gray-700 px-3 py-1 text-xs font-medium text-gray-400 transition-all hover:bg-gray-700 active:scale-95"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirmId(plan.id)}
                    className="rounded-full border border-gray-700 px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-gray-400 transition-all hover:border-red-500 hover:text-red-500 active:scale-95"
                  >
                    Delete
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {userPlans.length > 0 && (
          <p className="mt-4 text-xs text-gray-500">
            ⚠️ Deleting a plan will permanently remove all workouts and logs. This action cannot be undone.
          </p>
        )}
      </div>
    </div>
  );
}
