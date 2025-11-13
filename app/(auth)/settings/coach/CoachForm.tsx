"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import type { profiles } from "@/drizzle/schema";
import { updateFullProfileAction, updateCustomInstructionsAction } from "@/app/actions/profile";

type Profile = typeof profiles.$inferSelect;

interface CoachFormProps {
  profile: Profile | null;
}

export function CoachForm({ profile }: CoachFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [formData, setFormData] = useState({
    coachTone: profile?.coachTone || "analyst",
    coachTodayEnabled: profile?.coachTodayEnabled ?? true,
    coachDebriefEnabled: profile?.coachDebriefEnabled ?? true,
    coachWeeklyEnabled: profile?.coachWeeklyEnabled ?? true,
    timezone: profile?.timezone || "UTC",
    customInstructions: profile?.coachNotes || "",
  });

  const charCount = formData.customInstructions.length;
  const maxChars = 500;
  const isOverLimit = charCount > maxChars;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOverLimit) return;

    setIsSaving(true);
    setSaveMessage(null);

    try {
      // Update coach preferences
      await updateFullProfileAction({
        coachTone: formData.coachTone as any,
        coachTodayEnabled: formData.coachTodayEnabled,
        coachDebriefEnabled: formData.coachDebriefEnabled,
        coachWeeklyEnabled: formData.coachWeeklyEnabled,
        timezone: formData.timezone,
      });

      // Update custom instructions separately
      if (formData.customInstructions !== profile?.coachNotes) {
        await updateCustomInstructionsAction(formData.customInstructions);
      }

      setSaveMessage({ type: "success", text: "Coach settings updated successfully!" });
      router.refresh();
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      setSaveMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to update coach settings",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="pb-24">
      {/* Sticky Header with Back Button */}
      <div className="sticky top-0 z-10 bg-black/95 backdrop-blur-sm border-b border-gray-900 px-4 py-3 -mx-4 mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 active:text-gray-300 transition-colors min-h-[44px]"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="text-sm font-medium">Settings</span>
        </button>
        <h1 className="text-lg font-semibold text-white mt-1">AI Coach</h1>
      </div>

      {/* Success/Error Message */}
      {saveMessage && (
        <div
          className={`mx-4 mb-6 rounded-xl border p-4 text-sm ${
            saveMessage.type === "success"
              ? "border-green-500/40 bg-green-500/10 text-green-400"
              : "border-red-500/40 bg-red-500/10 text-red-400"
          }`}
        >
          {saveMessage.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 px-4">
        {/* Coach Tone */}
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Coach Personality</h2>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">Coach Tone</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, coachTone: "analyst" as any })}
                className={`min-h-[44px] rounded-xl border px-4 py-3 text-sm font-medium transition-all active:scale-98 ${
                  formData.coachTone === "analyst"
                    ? "border-cyan-500 bg-cyan-500/10 text-cyan-500"
                    : "border-gray-800 bg-gray-900 text-gray-400 active:bg-gray-800"
                }`}
              >
                <div>
                  <div className="font-semibold">Analyst</div>
                  <div className="text-xs text-gray-500 mt-0.5">Data-driven</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, coachTone: "flirty" as any })}
                className={`min-h-[44px] rounded-xl border px-4 py-3 text-sm font-medium transition-all active:scale-98 ${
                  formData.coachTone === "flirty"
                    ? "border-cyan-500 bg-cyan-500/10 text-cyan-500"
                    : "border-gray-800 bg-gray-900 text-gray-400 active:bg-gray-800"
                }`}
              >
                <div>
                  <div className="font-semibold">Flirty</div>
                  <div className="text-xs text-gray-500 mt-0.5">Fun & playful</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Coach Preferences */}
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Coach Messages</h2>

          <div className="space-y-3">
            <p className="text-xs text-gray-400 mb-4">Choose which coach messages you'd like to receive:</p>

            <label className="flex items-center gap-3 min-h-[44px] rounded-xl border border-gray-800 bg-gray-900 p-4 transition-colors active:bg-gray-800">
              <input
                type="checkbox"
                checked={formData.coachTodayEnabled}
                onChange={(e) => setFormData({ ...formData, coachTodayEnabled: e.target.checked })}
                className="h-5 w-5 rounded border-gray-700 bg-gray-800 text-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              />
              <div className="flex-1">
                <span className="block text-sm font-medium text-white">Daily Briefing</span>
                <span className="text-xs text-gray-400">Morning motivational message</span>
              </div>
            </label>

            <label className="flex items-center gap-3 min-h-[44px] rounded-xl border border-gray-800 bg-gray-900 p-4 transition-colors active:bg-gray-800">
              <input
                type="checkbox"
                checked={formData.coachDebriefEnabled}
                onChange={(e) => setFormData({ ...formData, coachDebriefEnabled: e.target.checked })}
                className="h-5 w-5 rounded border-gray-700 bg-gray-800 text-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              />
              <div className="flex-1">
                <span className="block text-sm font-medium text-white">Post-Workout Debrief</span>
                <span className="text-xs text-gray-400">Analysis after each workout</span>
              </div>
            </label>

            <label className="flex items-center gap-3 min-h-[44px] rounded-xl border border-gray-800 bg-gray-900 p-4 transition-colors active:bg-gray-800">
              <input
                type="checkbox"
                checked={formData.coachWeeklyEnabled}
                onChange={(e) => setFormData({ ...formData, coachWeeklyEnabled: e.target.checked })}
                className="h-5 w-5 rounded border-gray-700 bg-gray-800 text-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              />
              <div className="flex-1">
                <span className="block text-sm font-medium text-white">Weekly Review</span>
                <span className="text-xs text-gray-400">Progress summary every week</span>
              </div>
            </label>
          </div>
        </div>

        {/* Custom Instructions */}
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Custom Instructions</h2>

          <div className="space-y-3">
            <label htmlFor="customInstructions" className="block text-sm font-medium text-gray-300">
              Personalize Your Coach
            </label>
            <textarea
              id="customInstructions"
              value={formData.customInstructions}
              onChange={(e) => setFormData({ ...formData, customInstructions: e.target.value })}
              placeholder="E.g., Focus on posterior chain, avoid overhead movements, prefer dumbbell variations, motivate me with tough love..."
              className="w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-3.5 text-base text-white placeholder:text-gray-500 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 min-h-[120px]"
              rows={5}
              maxLength={maxChars + 50}
            />
            <div className="flex items-center justify-between">
              <span className={`text-xs ${isOverLimit ? "text-red-400" : "text-gray-400"}`}>
                {charCount}/{maxChars} characters
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Be specific about preferences, limitations, or focus areas for your AI coach
            </p>
          </div>
        </div>

        {/* Timezone */}
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Preferences</h2>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">Your Timezone</label>
            <input
              type="text"
              value={formData.timezone}
              onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              className="w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-3.5 text-base text-white transition-all focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              placeholder="America/New_York"
            />
            <p className="mt-1 text-xs text-gray-400">
              e.g., America/New_York, Europe/London, Asia/Tokyo
            </p>
          </div>
        </div>

        {/* Sticky Save Button */}
        <div className="sticky bottom-20 pt-6">
          <button
            type="submit"
            disabled={isSaving || isOverLimit}
            className="w-full min-h-[44px] rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 py-4 text-base font-semibold text-white shadow-lg transition-transform active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
