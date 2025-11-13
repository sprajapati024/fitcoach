"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import type { profiles, PreferredDay } from "@/drizzle/schema";
import { updateFullProfileAction } from "@/app/actions/profile";

type Profile = typeof profiles.$inferSelect;

interface TrainingFormProps {
  profile: Profile | null;
}

const EQUIPMENT_OPTIONS = [
  "Barbell",
  "Dumbbells",
  "Kettlebells",
  "Resistance Bands",
  "Pull-up Bar",
  "Bench",
  "Squat Rack",
  "Cable Machine",
  "Bodyweight Only",
];

const DAY_OPTIONS: Array<{ value: PreferredDay; label: string }> = [
  { value: "mon", label: "Mon" },
  { value: "tue", label: "Tue" },
  { value: "wed", label: "Wed" },
  { value: "thu", label: "Thu" },
  { value: "fri", label: "Fri" },
  { value: "sat", label: "Sat" },
  { value: "sun", label: "Sun" },
];

export function TrainingForm({ profile }: TrainingFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [formData, setFormData] = useState({
    goalBias: profile?.goalBias || "balanced",
    experienceLevel: profile?.experienceLevel || "beginner",
    scheduleDaysPerWeek: profile?.scheduleDaysPerWeek?.toString() || "3",
    scheduleMinutesPerSession: profile?.scheduleMinutesPerSession?.toString() || "60",
    scheduleWeeks: profile?.scheduleWeeks?.toString() || "8",
    preferredDays: (profile?.preferredDays as PreferredDay[]) || [],
    equipment: (profile?.equipment as string[]) || [],
    avoidList: profile?.avoidList?.join(", ") || "",
    noHighImpact: profile?.noHighImpact || false,
    hasPcos: profile?.hasPcos || false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const parsedScheduleDays = parseInt(formData.scheduleDaysPerWeek);
      const parsedScheduleMinutes = parseInt(formData.scheduleMinutesPerSession);
      const parsedScheduleWeeks = parseInt(formData.scheduleWeeks);

      if (isNaN(parsedScheduleDays)) {
        throw new Error("Invalid schedule days per week");
      }
      if (isNaN(parsedScheduleMinutes)) {
        throw new Error("Invalid schedule minutes per session");
      }
      if (isNaN(parsedScheduleWeeks)) {
        throw new Error("Invalid schedule weeks");
      }

      await updateFullProfileAction({
        goalBias: formData.goalBias as any,
        experienceLevel: formData.experienceLevel as any,
        scheduleDaysPerWeek: parsedScheduleDays,
        scheduleMinutesPerSession: parsedScheduleMinutes,
        scheduleWeeks: parsedScheduleWeeks,
        preferredDays: formData.preferredDays,
        equipment: formData.equipment,
        avoidList: formData.avoidList.split(",").map((s) => s.trim()).filter(Boolean),
        noHighImpact: formData.noHighImpact,
        hasPcos: formData.hasPcos,
      });

      setSaveMessage({ type: "success", text: "Training settings updated successfully!" });
      router.refresh();
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      setSaveMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to update training settings",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleEquipment = (item: string) => {
    setFormData((prev) => ({
      ...prev,
      equipment: prev.equipment.includes(item)
        ? prev.equipment.filter((e) => e !== item)
        : [...prev.equipment, item],
    }));
  };

  const togglePreferredDay = (day: PreferredDay) => {
    setFormData((prev) => ({
      ...prev,
      preferredDays: prev.preferredDays.includes(day)
        ? prev.preferredDays.filter((d) => d !== day)
        : [...prev.preferredDays, day],
    }));
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
        <h1 className="text-lg font-semibold text-white mt-1">Training Setup</h1>
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
        {/* Goals & Experience */}
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Goals & Experience</h2>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">Primary Goal</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "strength", label: "Strength" },
                  { value: "balanced", label: "Balanced" },
                  { value: "hypertrophy", label: "Muscle" },
                  { value: "fat_loss", label: "Fat Loss" },
                ].map((goal) => (
                  <button
                    key={goal.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, goalBias: goal.value })}
                    className={`min-h-[44px] rounded-xl border px-4 py-3 text-sm font-medium transition-all active:scale-98 ${
                      formData.goalBias === goal.value
                        ? "border-cyan-500 bg-cyan-500/10 text-cyan-500"
                        : "border-gray-800 bg-gray-900 text-gray-400 active:bg-gray-800"
                    }`}
                  >
                    {goal.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">Experience Level</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, experienceLevel: "beginner" })}
                  className={`min-h-[44px] rounded-xl border px-4 py-3 text-sm font-medium transition-all active:scale-98 ${
                    formData.experienceLevel === "beginner"
                      ? "border-cyan-500 bg-cyan-500/10 text-cyan-500"
                      : "border-gray-800 bg-gray-900 text-gray-400 active:bg-gray-800"
                  }`}
                >
                  Beginner
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, experienceLevel: "intermediate" })}
                  className={`min-h-[44px] rounded-xl border px-4 py-3 text-sm font-medium transition-all active:scale-98 ${
                    formData.experienceLevel === "intermediate"
                      ? "border-cyan-500 bg-cyan-500/10 text-cyan-500"
                      : "border-gray-800 bg-gray-900 text-gray-400 active:bg-gray-800"
                  }`}
                >
                  Intermediate
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Training Schedule</h2>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Days/Week</label>
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="7"
                  value={formData.scheduleDaysPerWeek}
                  onChange={(e) => setFormData({ ...formData, scheduleDaysPerWeek: e.target.value })}
                  className="w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-3.5 text-base text-white transition-all focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Mins/Session</label>
                <input
                  type="number"
                  inputMode="numeric"
                  min="15"
                  max="180"
                  step="15"
                  value={formData.scheduleMinutesPerSession}
                  onChange={(e) => setFormData({ ...formData, scheduleMinutesPerSession: e.target.value })}
                  className="w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-3.5 text-base text-white transition-all focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Weeks</label>
                <input
                  type="number"
                  inputMode="numeric"
                  min="4"
                  max="16"
                  value={formData.scheduleWeeks}
                  onChange={(e) => setFormData({ ...formData, scheduleWeeks: e.target.value })}
                  className="w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-3.5 text-base text-white transition-all focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>
            </div>

            <div>
              <label className="mb-3 block text-sm font-medium text-gray-300">Preferred Training Days</label>
              <div className="flex flex-wrap gap-2">
                {DAY_OPTIONS.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => togglePreferredDay(day.value)}
                    className={`min-h-[44px] min-w-[60px] rounded-xl border px-4 py-2 text-sm font-medium transition-all active:scale-98 ${
                      formData.preferredDays.includes(day.value)
                        ? "border-cyan-500 bg-cyan-500/10 text-cyan-500"
                        : "border-gray-800 bg-gray-900 text-gray-400 active:bg-gray-800"
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Equipment */}
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Available Equipment</h2>

          <div className="flex flex-wrap gap-2">
            {EQUIPMENT_OPTIONS.map((equipment) => (
              <button
                key={equipment}
                type="button"
                onClick={() => toggleEquipment(equipment)}
                className={`min-h-[44px] rounded-xl border px-4 py-2 text-sm font-medium transition-all active:scale-98 ${
                  formData.equipment.includes(equipment)
                    ? "border-cyan-500 bg-cyan-500/10 text-cyan-500"
                    : "border-gray-800 bg-gray-900 text-gray-400 active:bg-gray-800"
                }`}
              >
                {equipment}
              </button>
            ))}
          </div>
        </div>

        {/* Restrictions */}
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Restrictions</h2>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Exercises to Avoid
              </label>
              <input
                type="text"
                value={formData.avoidList}
                onChange={(e) => setFormData({ ...formData, avoidList: e.target.value })}
                className="w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-3.5 text-base text-white transition-all focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                placeholder="e.g. deadlifts, overhead press"
              />
              <p className="mt-1 text-xs text-gray-400">
                Comma-separated list of exercises to avoid
              </p>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3 min-h-[44px]">
                <input
                  type="checkbox"
                  checked={formData.noHighImpact}
                  onChange={(e) => setFormData({ ...formData, noHighImpact: e.target.checked })}
                  className="h-5 w-5 rounded border-gray-700 bg-gray-800 text-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                />
                <span className="text-sm text-white">Avoid high-impact movements</span>
              </label>

              <label className="flex items-center gap-3 min-h-[44px]">
                <input
                  type="checkbox"
                  checked={formData.hasPcos}
                  onChange={(e) => setFormData({ ...formData, hasPcos: e.target.checked })}
                  className="h-5 w-5 rounded border-gray-700 bg-gray-800 text-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                />
                <div>
                  <span className="block text-sm font-medium text-gray-300">I have PCOS</span>
                  <span className="text-xs text-gray-400">Adjusts nutrition recommendations</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Sticky Save Button */}
        <div className="sticky bottom-20 pt-6">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full min-h-[44px] rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 py-4 text-base font-semibold text-white shadow-lg transition-transform active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
