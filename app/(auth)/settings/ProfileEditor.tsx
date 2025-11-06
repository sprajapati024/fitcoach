"use client";

import { useState } from "react";
import { User, Activity, Calendar, Dumbbell, Heart, MessageSquare, Globe } from "lucide-react";
import type { profiles } from "@/drizzle/schema";
import { PrimaryButton } from "@/components/PrimaryButton";
import { updateFullProfileAction } from "@/app/actions/profile";

type Profile = typeof profiles.$inferSelect;

interface ProfileEditorProps {
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

const DAY_OPTIONS = [
  { value: "mon", label: "Monday" },
  { value: "tue", label: "Tuesday" },
  { value: "wed", label: "Wednesday" },
  { value: "thu", label: "Thursday" },
  { value: "fri", label: "Friday" },
  { value: "sat", label: "Saturday" },
  { value: "sun", label: "Sunday" },
];

export function ProfileEditor({ profile }: ProfileEditorProps) {
  const [formData, setFormData] = useState({
    fullName: profile?.fullName || "",
    sex: profile?.sex || "unspecified",
    dateOfBirth: profile?.dateOfBirth || "",
    heightCm: profile?.heightCm?.toString() || "",
    weightKg: profile?.weightKg?.toString() || "",
    unitSystem: profile?.unitSystem || "metric",
    goalBias: profile?.goalBias || "balanced",
    experienceLevel: profile?.experienceLevel || "beginner",
    scheduleDaysPerWeek: profile?.scheduleDaysPerWeek?.toString() || "3",
    scheduleMinutesPerSession: profile?.scheduleMinutesPerSession?.toString() || "60",
    scheduleWeeks: profile?.scheduleWeeks?.toString() || "8",
    preferredDays: (profile?.preferredDays as string[]) || [],
    equipment: (profile?.equipment as string[]) || [],
    avoidList: profile?.avoidList?.join(", ") || "",
    noHighImpact: profile?.noHighImpact || false,
    hasPcos: profile?.hasPcos || false,
    coachTone: profile?.coachTone || "analyst",
    coachTodayEnabled: profile?.coachTodayEnabled ?? true,
    coachDebriefEnabled: profile?.coachDebriefEnabled ?? true,
    coachWeeklyEnabled: profile?.coachWeeklyEnabled ?? true,
    timezone: profile?.timezone || "UTC",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage(null);

    try {
      await updateFullProfileAction({
        ...formData,
        heightCm: formData.heightCm ? parseFloat(formData.heightCm) : undefined,
        weightKg: formData.weightKg ? parseFloat(formData.weightKg) : undefined,
        scheduleDaysPerWeek: parseInt(formData.scheduleDaysPerWeek),
        scheduleMinutesPerSession: parseInt(formData.scheduleMinutesPerSession),
        scheduleWeeks: parseInt(formData.scheduleWeeks),
        avoidList: formData.avoidList.split(",").map((s) => s.trim()).filter(Boolean),
      });

      setSaveMessage({ type: "success", text: "Profile updated successfully!" });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      setSaveMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to update profile",
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

  const togglePreferredDay = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      preferredDays: prev.preferredDays.includes(day)
        ? prev.preferredDays.filter((d) => d !== day)
        : [...prev.preferredDays, day],
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {saveMessage && (
        <div
          className={`rounded-xl border p-4 text-sm ${
            saveMessage.type === "success"
              ? "border-success/40 bg-success/10 text-success-light"
              : "border-error/40 bg-error/10 text-error-light"
          }`}
        >
          {saveMessage.text}
        </div>
      )}

      {/* Personal Information */}
      <div className="space-y-4 rounded-2xl border border-surface-border bg-surface-1 p-6">
        <div className="flex items-center gap-3 border-b border-surface-border pb-3">
          <User className="h-5 w-5 text-cyan-500" />
          <h3 className="text-lg font-semibold text-text-primary">Personal Information</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-text-primary">Full Name</label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full rounded-xl border border-surface-border bg-surface-0 px-4 py-3 text-text-primary transition-all focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-text-primary">Sex</label>
            <select
              value={formData.sex}
              onChange={(e) => setFormData({ ...formData, sex: e.target.value as any })}
              className="w-full rounded-xl border border-surface-border bg-surface-0 px-4 py-3 text-text-primary transition-all focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            >
              <option value="unspecified">Prefer not to say</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="non_binary">Non-binary</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-text-primary">Date of Birth</label>
            <input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              max={new Date().toISOString().split("T")[0]}
              className="w-full rounded-xl border border-surface-border bg-surface-0 px-4 py-3 text-text-primary transition-all focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>
        </div>
      </div>

      {/* Body Metrics */}
      <div className="space-y-4 rounded-2xl border border-surface-border bg-surface-1 p-6">
        <div className="flex items-center gap-3 border-b border-surface-border pb-3">
          <Activity className="h-5 w-5 text-cyan-500" />
          <h3 className="text-lg font-semibold text-text-primary">Body Metrics</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-text-primary">Unit System</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, unitSystem: "metric" })}
                className={`rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                  formData.unitSystem === "metric"
                    ? "border-cyan-500 bg-cyan-500/10 text-cyan-500"
                    : "border-surface-border bg-surface-0 text-text-muted hover:border-surface-border"
                }`}
              >
                Metric (kg, cm)
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, unitSystem: "imperial" })}
                className={`rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                  formData.unitSystem === "imperial"
                    ? "border-cyan-500 bg-cyan-500/10 text-cyan-500"
                    : "border-surface-border bg-surface-0 text-text-muted hover:border-surface-border"
                }`}
              >
                Imperial (lb, in)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-text-primary">
                Height ({formData.unitSystem === "metric" ? "cm" : "in"})
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.heightCm}
                onChange={(e) => setFormData({ ...formData, heightCm: e.target.value })}
                className="w-full rounded-xl border border-surface-border bg-surface-0 px-4 py-3 text-text-primary transition-all focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                placeholder="170"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-text-primary">
                Weight ({formData.unitSystem === "metric" ? "kg" : "lb"})
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.weightKg}
                onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
                className="w-full rounded-xl border border-surface-border bg-surface-0 px-4 py-3 text-text-primary transition-all focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                placeholder="70"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Training Goals */}
      <div className="space-y-4 rounded-2xl border border-surface-border bg-surface-1 p-6">
        <div className="flex items-center gap-3 border-b border-surface-border pb-3">
          <Dumbbell className="h-5 w-5 text-cyan-500" />
          <h3 className="text-lg font-semibold text-text-primary">Training Goals</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-text-primary">Primary Goal</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "strength", label: "Strength" },
                { value: "balanced", label: "Balanced" },
                { value: "hypertrophy", label: "Muscle Growth" },
                { value: "fat_loss", label: "Fat Loss" },
              ].map((goal) => (
                <button
                  key={goal.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, goalBias: goal.value as any })}
                  className={`rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                    formData.goalBias === goal.value
                      ? "border-cyan-500 bg-cyan-500/10 text-cyan-500"
                      : "border-surface-border bg-surface-0 text-text-muted hover:border-surface-border"
                  }`}
                >
                  {goal.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-text-primary">Experience Level</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, experienceLevel: "beginner" })}
                className={`rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                  formData.experienceLevel === "beginner"
                    ? "border-cyan-500 bg-cyan-500/10 text-cyan-500"
                    : "border-surface-border bg-surface-0 text-text-muted hover:border-surface-border"
                }`}
              >
                Beginner
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, experienceLevel: "intermediate" })}
                className={`rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                  formData.experienceLevel === "intermediate"
                    ? "border-cyan-500 bg-cyan-500/10 text-cyan-500"
                    : "border-surface-border bg-surface-0 text-text-muted hover:border-surface-border"
                }`}
              >
                Intermediate
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Training Schedule */}
      <div className="space-y-4 rounded-2xl border border-surface-border bg-surface-1 p-6">
        <div className="flex items-center gap-3 border-b border-surface-border pb-3">
          <Calendar className="h-5 w-5 text-cyan-500" />
          <h3 className="text-lg font-semibold text-text-primary">Training Schedule</h3>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-text-primary">Days/Week</label>
              <input
                type="number"
                min="1"
                max="7"
                value={formData.scheduleDaysPerWeek}
                onChange={(e) => setFormData({ ...formData, scheduleDaysPerWeek: e.target.value })}
                className="w-full rounded-xl border border-surface-border bg-surface-0 px-4 py-3 text-text-primary transition-all focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-text-primary">Minutes/Session</label>
              <input
                type="number"
                min="15"
                max="180"
                step="15"
                value={formData.scheduleMinutesPerSession}
                onChange={(e) => setFormData({ ...formData, scheduleMinutesPerSession: e.target.value })}
                className="w-full rounded-xl border border-surface-border bg-surface-0 px-4 py-3 text-text-primary transition-all focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-text-primary">Program Weeks</label>
              <input
                type="number"
                min="4"
                max="16"
                value={formData.scheduleWeeks}
                onChange={(e) => setFormData({ ...formData, scheduleWeeks: e.target.value })}
                className="w-full rounded-xl border border-surface-border bg-surface-0 px-4 py-3 text-text-primary transition-all focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>
          </div>

          <div>
            <label className="mb-3 block text-sm font-medium text-text-primary">Preferred Training Days</label>
            <div className="flex flex-wrap gap-2">
              {DAY_OPTIONS.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => togglePreferredDay(day.value)}
                  className={`rounded-xl border px-4 py-2 text-sm font-medium transition-all ${
                    formData.preferredDays.includes(day.value)
                      ? "border-cyan-500 bg-cyan-500/10 text-cyan-500"
                      : "border-surface-border bg-surface-0 text-text-muted hover:border-surface-border"
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Equipment & Restrictions */}
      <div className="space-y-4 rounded-2xl border border-surface-border bg-surface-1 p-6">
        <div className="flex items-center gap-3 border-b border-surface-border pb-3">
          <Dumbbell className="h-5 w-5 text-cyan-500" />
          <h3 className="text-lg font-semibold text-text-primary">Equipment & Restrictions</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-3 block text-sm font-medium text-text-primary">Available Equipment</label>
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT_OPTIONS.map((equipment) => (
                <button
                  key={equipment}
                  type="button"
                  onClick={() => toggleEquipment(equipment)}
                  className={`rounded-xl border px-4 py-2 text-sm font-medium transition-all ${
                    formData.equipment.includes(equipment)
                      ? "border-cyan-500 bg-cyan-500/10 text-cyan-500"
                      : "border-surface-border bg-surface-0 text-text-muted hover:border-surface-border"
                  }`}
                >
                  {equipment}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-text-primary">
              Exercises to Avoid (comma-separated)
            </label>
            <input
              type="text"
              value={formData.avoidList}
              onChange={(e) => setFormData({ ...formData, avoidList: e.target.value })}
              className="w-full rounded-xl border border-surface-border bg-surface-0 px-4 py-3 text-text-primary transition-all focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              placeholder="e.g. deadlifts, overhead press"
            />
            <p className="mt-1 text-xs text-text-muted">
              List any exercises you want to avoid due to injury or preference
            </p>
          </div>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={formData.noHighImpact}
              onChange={(e) => setFormData({ ...formData, noHighImpact: e.target.checked })}
              className="h-5 w-5 rounded border-surface-border bg-surface-0 text-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            />
            <span className="text-sm text-text-primary">Avoid high-impact movements</span>
          </label>
        </div>
      </div>

      {/* Health */}
      <div className="space-y-4 rounded-2xl border border-surface-border bg-surface-1 p-6">
        <div className="flex items-center gap-3 border-b border-surface-border pb-3">
          <Heart className="h-5 w-5 text-cyan-500" />
          <h3 className="text-lg font-semibold text-text-primary">Health</h3>
        </div>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={formData.hasPcos}
            onChange={(e) => setFormData({ ...formData, hasPcos: e.target.checked })}
            className="h-5 w-5 rounded border-surface-border bg-surface-0 text-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
          />
          <div>
            <span className="block text-sm font-medium text-text-primary">I have PCOS</span>
            <span className="text-xs text-text-muted">Adjusts nutrition recommendations</span>
          </div>
        </label>
      </div>

      {/* Coach Preferences */}
      <div className="space-y-4 rounded-2xl border border-surface-border bg-surface-1 p-6">
        <div className="flex items-center gap-3 border-b border-surface-border pb-3">
          <MessageSquare className="h-5 w-5 text-cyan-500" />
          <h3 className="text-lg font-semibold text-text-primary">Coach Preferences</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-text-primary">Coach Tone</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, coachTone: "analyst" })}
                className={`rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                  formData.coachTone === "analyst"
                    ? "border-cyan-500 bg-cyan-500/10 text-cyan-500"
                    : "border-surface-border bg-surface-0 text-text-muted hover:border-surface-border"
                }`}
              >
                Analyst
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, coachTone: "flirty" })}
                className={`rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                  formData.coachTone === "flirty"
                    ? "border-cyan-500 bg-cyan-500/10 text-cyan-500"
                    : "border-surface-border bg-surface-0 text-text-muted hover:border-surface-border"
                }`}
              >
                Flirty
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.coachTodayEnabled}
                onChange={(e) => setFormData({ ...formData, coachTodayEnabled: e.target.checked })}
                className="h-5 w-5 rounded border-surface-border bg-surface-0 text-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              />
              <span className="text-sm text-text-primary">Daily coach briefing</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.coachDebriefEnabled}
                onChange={(e) => setFormData({ ...formData, coachDebriefEnabled: e.target.checked })}
                className="h-5 w-5 rounded border-surface-border bg-surface-0 text-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              />
              <span className="text-sm text-text-primary">Post-workout debriefing</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.coachWeeklyEnabled}
                onChange={(e) => setFormData({ ...formData, coachWeeklyEnabled: e.target.checked })}
                className="h-5 w-5 rounded border-surface-border bg-surface-0 text-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              />
              <span className="text-sm text-text-primary">Weekly progress review</span>
            </label>
          </div>
        </div>
      </div>

      {/* Timezone */}
      <div className="space-y-4 rounded-2xl border border-surface-border bg-surface-1 p-6">
        <div className="flex items-center gap-3 border-b border-surface-border pb-3">
          <Globe className="h-5 w-5 text-cyan-500" />
          <h3 className="text-lg font-semibold text-text-primary">Timezone</h3>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-text-primary">Your Timezone</label>
          <input
            type="text"
            value={formData.timezone}
            onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
            className="w-full rounded-xl border border-surface-border bg-surface-0 px-4 py-3 text-text-primary transition-all focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            placeholder="America/New_York"
          />
          <p className="mt-1 text-xs text-text-muted">
            e.g., America/New_York, Europe/London, Asia/Tokyo
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="sticky bottom-20 md:bottom-4">
        <PrimaryButton type="submit" disabled={isSaving} loading={isSaving} className="w-full">
          Save Profile Changes
        </PrimaryButton>
      </div>
    </form>
  );
}
