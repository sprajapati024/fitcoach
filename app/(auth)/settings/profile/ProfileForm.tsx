"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, LogOut } from "lucide-react";
import type { profiles } from "@/drizzle/schema";
import { updateProfileBasicInfoAction } from "@/app/actions/profile";

type Profile = typeof profiles.$inferSelect;

interface ProfileFormProps {
  profile: Profile | null;
  signOutAction?: () => Promise<void>;
}

export function ProfileForm({ profile, signOutAction }: ProfileFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [formData, setFormData] = useState({
    fullName: profile?.fullName || "",
    sex: profile?.sex || "unspecified",
    dateOfBirth: profile?.dateOfBirth || "",
    heightCm: profile?.heightCm?.toString() || "",
    weightKg: profile?.weightKg?.toString() || "",
    unitSystem: profile?.unitSystem || "metric",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const parsedHeightCm = formData.heightCm ? parseFloat(formData.heightCm) : undefined;
      const parsedWeightKg = formData.weightKg ? parseFloat(formData.weightKg) : undefined;

      if (parsedHeightCm !== undefined && isNaN(parsedHeightCm)) {
        throw new Error("Invalid height value");
      }
      if (parsedWeightKg !== undefined && isNaN(parsedWeightKg)) {
        throw new Error("Invalid weight value");
      }

      await updateProfileBasicInfoAction({
        fullName: formData.fullName,
        sex: formData.sex as any,
        dateOfBirth: formData.dateOfBirth,
        heightCm: parsedHeightCm,
        weightKg: parsedWeightKg,
        unitSystem: formData.unitSystem as any,
      });

      setSaveMessage({ type: "success", text: "Profile updated successfully!" });
      router.refresh();
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
        <h1 className="text-lg font-semibold text-white mt-1">Profile & Account</h1>
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
        {/* Personal Information */}
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Personal Information</h2>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">Full Name</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-3.5 text-base text-white transition-all focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                placeholder="Your name"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Sex</label>
                <select
                  value={formData.sex}
                  onChange={(e) => setFormData({ ...formData, sex: e.target.value as any })}
                  className="w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-3.5 text-base text-white transition-all focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 appearance-none"
                >
                  <option value="unspecified">Prefer not to say</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="non_binary">Non-binary</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Date of Birth</label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-3.5 text-base text-white transition-all focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Units & Measurements */}
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Units & Measurements</h2>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">Unit System</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, unitSystem: "metric" })}
                  className={`min-h-[44px] rounded-xl border px-4 py-3 text-sm font-medium transition-all active:scale-98 ${
                    formData.unitSystem === "metric"
                      ? "border-cyan-500 bg-cyan-500/10 text-cyan-500"
                      : "border-gray-800 bg-gray-900 text-gray-400 active:bg-gray-800"
                  }`}
                >
                  Metric (kg, cm)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, unitSystem: "imperial" })}
                  className={`min-h-[44px] rounded-xl border px-4 py-3 text-sm font-medium transition-all active:scale-98 ${
                    formData.unitSystem === "imperial"
                      ? "border-cyan-500 bg-cyan-500/10 text-cyan-500"
                      : "border-gray-800 bg-gray-900 text-gray-400 active:bg-gray-800"
                  }`}
                >
                  Imperial (lb, in)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Height ({formData.unitSystem === "metric" ? "cm" : "in"})
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  value={formData.heightCm}
                  onChange={(e) => setFormData({ ...formData, heightCm: e.target.value })}
                  className="w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-3.5 text-base text-white transition-all focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                  placeholder="170"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Weight ({formData.unitSystem === "metric" ? "kg" : "lb"})
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  value={formData.weightKg}
                  onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
                  className="w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-3.5 text-base text-white transition-all focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                  placeholder="70"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Account Actions */}
        {signOutAction && (
          <div>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Account Actions</h2>
            <form action={signOutAction}>
              <button
                type="submit"
                className="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl border border-red-900/50 bg-red-950/20 px-4 py-3 text-sm font-medium text-red-400 transition-all active:bg-red-950/40 active:scale-98"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </form>
          </div>
        )}

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
