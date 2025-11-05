"use client";

import { useMemo, useState, useTransition } from "react";
import { Card } from "@/components/Card";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Segmented } from "@/components/Segmented";
import { Stepper } from "@/components/Stepper";
import { saveProfileAction } from "@/app/actions/profile";
import { z } from "zod";
import { type OnboardingInput, onboardingSchema, preferredDaySchema } from "@/lib/validation";
import type { Profile } from "@/drizzle/schema";
import { convertCmToIn, convertHeightToCm, convertKgToLb, convertWeightToKg } from "@/lib/unitConversion";

type PreferredDay = z.infer<typeof preferredDaySchema>;

const dayOptions: Array<{ label: string; value: PreferredDay }> = [
  { label: "Mon", value: "mon" },
  { label: "Tue", value: "tue" },
  { label: "Wed", value: "wed" },
  { label: "Thu", value: "thu" },
  { label: "Fri", value: "fri" },
  { label: "Sat", value: "sat" },
  { label: "Sun", value: "sun" },
];

const equipmentOptions = [
  { label: "Trap bar", value: "trap_bar" },
  { label: "Barbell", value: "barbell" },
  { label: "Dumbbells", value: "dumbbell" },
  { label: "Kettlebells", value: "kettlebell" },
  { label: "Cable machine", value: "cable" },
  { label: "Resistance bands", value: "bands" },
  { label: "Stationary bike", value: "bike" },
  { label: "Treadmill", value: "treadmill" },
  { label: "Row erg", value: "rower" },
  { label: "Sled", value: "sled" },
  { label: "Bodyweight area", value: "bodyweight" },
];

const avoidOptions = [
  { label: "Overhead press", value: "overhead_press" },
  { label: "Jumping plyos", value: "jumping_plyos" },
  { label: "Heavy deadlifts", value: "heavy_deadlifts" },
  { label: "Sprint intervals", value: "sprint_intervals" },
  { label: "Burpees", value: "burpees" },
];

const steps = [
  "Basics",
  "Body",
  "Health",
  "Experience",
  "Schedule",
  "Equipment",
  "Goals",
];

type ProfileRow = Profile;

interface OnboardingFormProps {
  initialProfile?: ProfileRow | null;
}

function buildInitialState(profile?: ProfileRow | null): OnboardingInput {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";

  if (!profile) {
    return {
      fullName: "",
      sex: "unspecified",
      age: 25,
      height: { value: 168, unit: "cm" },
      weight: { value: 68, unit: "kg" },
      unitSystem: "metric",
      hasPcos: false,
      experienceLevel: "beginner",
      schedule: {
        daysPerWeek: 3,
        minutesPerSession: 60,
        programWeeks: 12,
        preferredDays: ["mon", "wed", "fri"],
      },
      equipment: ["bodyweight"],
      avoidList: [],
      noHighImpact: false,
      goalBias: "balanced",
      coachTone: "concise",
      coachTodayEnabled: true,
      coachDebriefEnabled: true,
      coachWeeklyEnabled: true,
      coachNotes: "",
      timezone,
    };
  }

  const unitSystem = profile.unitSystem ?? "metric";
  const heightCm = profile.heightCm ? Number(profile.heightCm) : 168;
  const weightKg = profile.weightKg ? Number(profile.weightKg) : 68;

  const convertHeight = unitSystem === "metric" ? heightCm : convertCmToIn(heightCm);
  const convertWeight = unitSystem === "metric" ? weightKg : convertKgToLb(weightKg);

  return {
    fullName: profile.fullName ?? "",
    sex: profile.sex,
    age: 25,
    height: {
      value: Math.round(convertHeight * 10) / 10,
      unit: unitSystem === "metric" ? "cm" : "in",
    },
    weight: {
      value: Math.round(convertWeight * 10) / 10,
      unit: unitSystem === "metric" ? "kg" : "lb",
    },
    unitSystem,
    hasPcos: profile.hasPcos,
    experienceLevel: profile.experienceLevel,
    schedule: {
      daysPerWeek: profile.scheduleDaysPerWeek ?? 3,
      minutesPerSession: profile.scheduleMinutesPerSession ?? 60,
      programWeeks: profile.scheduleWeeks ?? 12,
      preferredDays: (profile.preferredDays as OnboardingInput["schedule"]["preferredDays"]) ?? ["mon", "wed", "fri"],
    },
    equipment: (profile.equipment as string[])?.length ? (profile.equipment as string[]) : ["bodyweight"],
    avoidList: (profile.avoidList as string[]) ?? [],
    noHighImpact: profile.noHighImpact,
    goalBias: profile.goalBias,
    coachTone: profile.coachTone,
    coachTodayEnabled: profile.coachTodayEnabled,
    coachDebriefEnabled: profile.coachDebriefEnabled,
    coachWeeklyEnabled: profile.coachWeeklyEnabled,
    coachNotes: profile.coachNotes ?? "",
    timezone: profile.timezone ?? timezone,
  };
}

function validateStep(stepIndex: number, data: OnboardingInput) {
  const errors: Record<string, string> = {};
  switch (stepIndex) {
    case 0: {
      if (!data.fullName.trim()) {
        errors.fullName = "Name is required";
      }
      if (data.age < 18 || data.age > 80) {
        errors.age = "Age must be between 18 and 80";
      }
      break;
    }
    case 1: {
      if (data.height.value <= 0) {
        errors.height = "Enter a valid height";
      }
      if (data.weight.value <= 0) {
        errors.weight = "Enter a valid weight";
      }
      break;
    }
    case 2: {
      if (data.sex === "female" && typeof data.hasPcos !== "boolean") {
        errors.hasPcos = "Please confirm if PCOS applies";
      }
      break;
    }
    case 4: {
      if (data.schedule.daysPerWeek < 3 || data.schedule.daysPerWeek > 6) {
        errors.daysPerWeek = "Select 3–6 training days";
      }
      if (data.schedule.preferredDays.length !== data.schedule.daysPerWeek) {
        errors.preferredDays = "Match days to weekly frequency";
      }
      break;
    }
    case 5: {
      if (data.equipment.length === 0) {
        errors.equipment = "Choose at least one equipment option";
      }
      break;
    }
    default:
      break;
  }
  return errors;
}

export function OnboardingForm({ initialProfile }: OnboardingFormProps) {
  const initialState = useMemo(() => buildInitialState(initialProfile), [initialProfile]);
  const [form, setForm] = useState<OnboardingInput>(initialState);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleNext = () => {
    const validation = validateStep(step, form);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }
    setErrors({});
    setStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setErrors({});
    setStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    const result = onboardingSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path.length) {
          fieldErrors[issue.path.join(".")] = issue.message;
        }
      });
      setErrors(fieldErrors);
      setStep(0);
      return;
    }

    setErrors({});
    setSubmitError(null);
    startTransition(() => {
      saveProfileAction(result.data)
        .catch(() => {
          setSubmitError("Failed to save profile. Please try again.");
        });
    });
  };

  const updateUnitSystem = (nextUnit: OnboardingInput["unitSystem"]) => {
    if (form.unitSystem === nextUnit) {
      return;
    }
    const baselineHeightCm = convertHeightToCm(form.height);
    const baselineWeightKg = convertWeightToKg(form.weight);

    if (nextUnit === "metric") {
      setForm((prev) => ({
        ...prev,
        unitSystem: "metric",
        height: { value: Math.round(baselineHeightCm * 10) / 10, unit: "cm" },
        weight: { value: Math.round(baselineWeightKg * 10) / 10, unit: "kg" },
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        unitSystem: "imperial",
        height: { value: Math.round(convertCmToIn(baselineHeightCm) * 10) / 10, unit: "in" },
        weight: { value: Math.round(convertKgToLb(baselineWeightKg) * 10) / 10, unit: "lb" },
      }));
    }
  };

  return (
    <div className="flex flex-col gap-6 px-4 pb-24 pt-6 sm:px-6">
      <Stepper steps={steps} current={step} />

      <Card className="space-y-6">
        {step === 0 ? (
          <section className="space-y-4">
            <header>
              <h2 className="text-xl font-semibold">Basics</h2>
              <p className="text-sm text-fg2">Tell us who we are coaching.</p>
            </header>
            <div className="space-y-3">
              <label className="block text-sm">
                <span className="text-xs uppercase tracking-wide text-fg2">Name</span>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
                  className="mt-1 w-full rounded-[var(--radius-md)] border border-surface-border bg-surface-2 px-3 py-3 text-sm text-text-primary transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                  placeholder="Your name"
                />
                {errors.fullName ? <span className="mt-1 block text-xs text-text-muted">{errors.fullName}</span> : null}
              </label>
              <label className="block text-sm">
                <span className="text-xs uppercase tracking-wide text-text-muted">Age</span>
                <input
                  type="number"
                  min={18}
                  max={80}
                  value={form.age}
                  onChange={(event) => setForm((prev) => ({ ...prev, age: Number(event.target.value) }))}
                  className="mt-1 w-full rounded-[var(--radius-md)] border border-surface-border bg-surface-2 px-3 py-3 text-sm text-text-primary transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                />
                {errors.age ? <span className="mt-1 block text-xs text-text-muted">{errors.age}</span> : null}
              </label>
              <div>
                <span className="text-xs uppercase tracking-wide text-fg2">Sex</span>
                <Segmented
                  className="mt-2"
                  options={[
                    { label: "Female", value: "female" },
                    { label: "Male", value: "male" },
                    { label: "Non-binary", value: "non_binary" },
                    { label: "Prefer not", value: "unspecified" },
                  ]}
                  value={form.sex}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      sex: value,
                      hasPcos: value === "female" ? prev.hasPcos : false,
                    }))
                  }
                />
              </div>
            </div>
          </section>
        ) : null}

        {step === 1 ? (
          <section className="space-y-4">
            <header>
              <h2 className="text-xl font-semibold">Body metrics</h2>
              <p className="text-sm text-fg2">We store everything in SI units and show your preference.</p>
            </header>
            <Segmented
              options={[
                { label: "Metric", value: "metric" },
                { label: "Imperial", value: "imperial" },
              ]}
              value={form.unitSystem}
              onChange={updateUnitSystem}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="text-xs uppercase tracking-wide text-fg2">Height ({form.height.unit})</span>
                <input
                  type="number"
                  value={form.height.value}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      height: { ...prev.height, value: Number(event.target.value) },
                    }))
                  }
                  className="mt-1 w-full rounded-[var(--radius-md)] border border-surface-border bg-surface-2 px-3 py-3 text-sm text-text-primary transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                />
                {errors.height ? <span className="mt-1 block text-xs text-text-muted">{errors.height}</span> : null}
              </label>
              <label className="block text-sm">
                <span className="text-xs uppercase tracking-wide text-text-muted">Weight ({form.weight.unit})</span>
                <input
                  type="number"
                  value={form.weight.value}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      weight: { ...prev.weight, value: Number(event.target.value) },
                    }))
                  }
                  className="mt-1 w-full rounded-[var(--radius-md)] border border-surface-border bg-surface-2 px-3 py-3 text-sm text-text-primary transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                />
                {errors.weight ? <span className="mt-1 block text-xs text-text-muted">{errors.weight}</span> : null}
              </label>
            </div>
          </section>
        ) : null}

        {step === 2 ? (
          <section className="space-y-4">
            <header>
              <h2 className="text-xl font-semibold">Health guardrails</h2>
              <p className="text-sm text-fg2">We tailor conditioning volume and impact based on your flags.</p>
            </header>
            {form.sex === "female" ? (
              <div className="space-y-2 rounded-[var(--radius-md)] border border-surface-border bg-surface-2 p-3">
                <label className={`flex items-center justify-between text-sm cursor-pointer transition ${form.hasPcos ? "font-semibold" : ""}`}>
                  <span>{form.hasPcos ? "✓ " : ""}PCOS considerations</span>
                  <input
                    type="checkbox"
                    checked={form.hasPcos}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        hasPcos: event.target.checked,
                        noHighImpact: event.target.checked ? true : prev.noHighImpact,
                      }))
                    }
                    className="h-4 w-4"
                  />
                </label>
                <p className="text-xs text-text-muted">Not medical advice. We bias Zone 2 volume and remove high-impact work.</p>
              </div>
            ) : null}
            <label className={`flex items-center justify-between rounded-[var(--radius-md)] border border-surface-border bg-surface-2 p-3 text-sm cursor-pointer transition ${form.noHighImpact ? "font-semibold" : ""}`}>
              <span>{form.noHighImpact ? "✓ " : ""}No high-impact movements</span>
              <input
                type="checkbox"
                checked={form.noHighImpact}
                onChange={(event) => setForm((prev) => ({ ...prev, noHighImpact: event.target.checked }))}
                className="h-4 w-4"
              />
            </label>
          </section>
        ) : null}

        {step === 3 ? (
          <section className="space-y-4">
            <header>
              <h2 className="text-xl font-semibold">Experience</h2>
              <p className="text-sm text-fg2">We use this to set initial loading ramps.</p>
            </header>
            <Segmented
              options={[
                { label: "Beginner", value: "beginner", description: "Less than 1 year structured training" },
                { label: "Intermediate", value: "intermediate", description: "Consistent training 1+ years" },
              ]}
              value={form.experienceLevel}
              onChange={(value) => setForm((prev) => ({ ...prev, experienceLevel: value }))}
            />
          </section>
        ) : null}

        {step === 4 ? (
          <section className="space-y-4">
            <header>
              <h2 className="text-xl font-semibold">Schedule</h2>
              <p className="text-sm text-fg2">Lock in how much time you can commit.</p>
            </header>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <label className="block text-sm">
                <span className="text-xs uppercase tracking-wide text-fg2">Days per week</span>
                <input
                  type="number"
                  min={3}
                  max={6}
                  value={form.schedule.daysPerWeek}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      schedule: { ...prev.schedule, daysPerWeek: Number(event.target.value) },
                    }))
                  }
                  className="mt-1 w-full rounded-[var(--radius-md)] border border-surface-border bg-surface-2 px-3 py-3 text-sm text-text-primary transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                />
                {errors.daysPerWeek ? <span className="mt-1 block text-xs text-text-muted">{errors.daysPerWeek}</span> : null}
              </label>
              <label className="block text-sm">
                <span className="text-xs uppercase tracking-wide text-text-muted">Minutes / session</span>
                <input
                  type="number"
                  min={40}
                  max={90}
                  step={5}
                  value={form.schedule.minutesPerSession}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      schedule: { ...prev.schedule, minutesPerSession: Number(event.target.value) },
                    }))
                  }
                  className="mt-1 w-full rounded-[var(--radius-md)] border border-surface-border bg-surface-2 px-3 py-3 text-sm text-text-primary transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                />
              </label>
              <label className="block text-sm">
                <span className="text-xs uppercase tracking-wide text-text-muted">Weeks</span>
                <input
                  type="number"
                  min={6}
                  max={16}
                  value={form.schedule.programWeeks}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      schedule: { ...prev.schedule, programWeeks: Number(event.target.value) },
                    }))
                  }
                  className="mt-1 w-full rounded-[var(--radius-md)] border border-surface-border bg-surface-2 px-3 py-3 text-sm text-text-primary transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                />
              </label>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-fg2">Preferred training days</span>
                <span className={`text-xs font-semibold ${form.schedule.preferredDays.length === form.schedule.daysPerWeek ? "text-green-500" : "text-yellow-500"}`}>
                  {form.schedule.preferredDays.length === form.schedule.daysPerWeek ? "✓ " : ""}
                  Selected {form.schedule.preferredDays.length} of {form.schedule.daysPerWeek}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {dayOptions.map((day) => {
                  const isActive = form.schedule.preferredDays.includes(day.value);
                  return (
                    <button
                      type="button"
                      key={day.value}
                      onClick={() => {
                        setForm((prev) => {
                          const alreadySelected = prev.schedule.preferredDays.includes(day.value);
                          let next = prev.schedule.preferredDays;
                          if (alreadySelected) {
                            next = prev.schedule.preferredDays.filter((d) => d !== day.value);
                          } else {
                            next = [...prev.schedule.preferredDays, day.value];
                          }
                          return {
                            ...prev,
                            schedule: {
                              ...prev.schedule,
                              preferredDays: next.sort(
                                (a, b) => dayOptions.findIndex((d) => d.value === a) - dayOptions.findIndex((d) => d.value === b),
                              ),
                            },
                          };
                        });
                      }}
                      className={`touch-feedback rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-all duration-200 ${isActive ? "border-accent bg-accent text-gray-950 shadow-sm" : "border-surface-border bg-surface-2 text-text-secondary active:bg-surface-1"}`}
                    >
                      {isActive ? "✓ " : ""}{day.label}
                    </button>
                  );
                })}
              </div>
              {errors.preferredDays ? (
                <span className="block text-xs font-semibold text-red-500">{errors.preferredDays}</span>
              ) : null}
            </div>
          </section>
        ) : null}

        {step === 5 ? (
          <section className="space-y-4">
            <header>
              <h2 className="text-xl font-semibold">Environment</h2>
              <p className="text-sm text-text-muted">Tell us what gear and constraints we should respect.</p>
            </header>
            <div className="space-y-3">
              <span className="text-xs uppercase tracking-wide text-text-muted">Available equipment</span>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {equipmentOptions.map((option) => {
                  const checked = form.equipment.includes(option.value);
                  return (
                    <label
                      key={option.value}
                      className={`touch-feedback flex items-center gap-2 rounded-[var(--radius-md)] border px-3 py-2 text-sm font-medium transition-all duration-200 cursor-pointer ${checked ? "border-accent bg-accent text-gray-950 shadow-sm" : "border-surface-border bg-surface-2 text-text-secondary active:bg-surface-1"}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            equipment: event.target.checked
                              ? [...prev.equipment, option.value]
                              : prev.equipment.filter((item) => item !== option.value),
                          }))
                        }
                        className="h-4 w-4 accent-bg0"
                      />
                      <span>{checked ? "✓ " : ""}{option.label}</span>
                    </label>
                  );
                })}
              </div>
              {errors.equipment ? <span className="text-xs text-text-muted">{errors.equipment}</span> : null}
            </div>
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-wide text-text-muted">Movements to avoid (optional)</span>
              <div className="flex flex-wrap gap-2">
                {avoidOptions.map((option) => {
                  const active = form.avoidList.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          avoidList: active
                            ? prev.avoidList.filter((item) => item !== option.value)
                            : [...prev.avoidList, option.value],
                        }))
                      }
                      className={`touch-feedback rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-all duration-200 ${active ? "border-accent bg-accent text-gray-950 shadow-sm" : "border-surface-border bg-surface-2 text-text-secondary active:bg-surface-1"}`}
                    >
                      {active ? "✓ " : ""}{option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        ) : null}

        {step === 6 ? (
          <section className="space-y-4">
            <header>
              <h2 className="text-xl font-semibold">Goal bias & coach</h2>
              <p className="text-sm text-fg2">Dial in how FitCoach communicates and biases your plan.</p>
            </header>
            <Segmented
              options={[
                { label: "Strength", value: "strength" },
                { label: "Balanced", value: "balanced" },
                { label: "Hypertrophy", value: "hypertrophy" },
                { label: "Fat loss", value: "fat_loss" },
              ]}
              value={form.goalBias}
              onChange={(value) => setForm((prev) => ({ ...prev, goalBias: value }))}
            />
            <Segmented
              options={[
                { label: "Concise", value: "concise", description: "Short cues, straight to it" },
                { label: "Friendly", value: "friendly", description: "Softer tone, still punchy" },
              ]}
              value={form.coachTone}
              onChange={(value) => setForm((prev) => ({ ...prev, coachTone: value }))}
            />
            <div className="space-y-2 rounded-[var(--radius-md)] border border-surface-border bg-surface-2 p-3 text-sm">
              <label className={`flex items-center justify-between cursor-pointer transition ${form.coachTodayEnabled ? "font-semibold" : ""}`}>
                <span>{form.coachTodayEnabled ? "✓ " : ""}Today coach</span>
                <input
                  type="checkbox"
                  checked={form.coachTodayEnabled}
                  onChange={(event) => setForm((prev) => ({ ...prev, coachTodayEnabled: event.target.checked }))}
                  className="h-4 w-4"
                />
              </label>
              <label className={`flex items-center justify-between cursor-pointer transition ${form.coachDebriefEnabled ? "font-semibold" : ""}`}>
                <span>{form.coachDebriefEnabled ? "✓ " : ""}Post-workout debrief</span>
                <input
                  type="checkbox"
                  checked={form.coachDebriefEnabled}
                  onChange={(event) => setForm((prev) => ({ ...prev, coachDebriefEnabled: event.target.checked }))}
                  className="h-4 w-4"
                />
              </label>
              <label className={`flex items-center justify-between cursor-pointer transition ${form.coachWeeklyEnabled ? "font-semibold" : ""}`}>
                <span>{form.coachWeeklyEnabled ? "✓ " : ""}Weekly review</span>
                <input
                  type="checkbox"
                  checked={form.coachWeeklyEnabled}
                  onChange={(event) => setForm((prev) => ({ ...prev, coachWeeklyEnabled: event.target.checked }))}
                  className="h-4 w-4"
                />
              </label>
            </div>
            <div>
              <span className="text-xs uppercase tracking-wide text-text-muted">Notes to coach</span>
              <textarea
                rows={3}
                value={form.coachNotes ?? ""}
                onChange={(event) => setForm((prev) => ({ ...prev, coachNotes: event.target.value }))}
                className="mt-2 w-full rounded-[var(--radius-md)] border border-surface-border bg-surface-2 px-3 py-3 text-sm text-text-primary transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                placeholder="Anything unique we should know?"
              />
            </div>
          </section>
        ) : null}
        {submitError ? <p className="text-xs text-text-muted">{submitError}</p> : null}
      </Card>

      <footer className="sticky bottom-0 left-0 right-0 flex flex-col gap-3 bg-surface-0/90 px-4 py-4 backdrop-blur sm:px-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 0 || isPending}
            className="inline-flex h-11 items-center justify-center rounded-full border border-surface-border px-5 text-sm font-medium uppercase tracking-wide text-text-secondary transition hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            Back
          </button>
          {step < steps.length - 1 ? (
            <PrimaryButton onClick={handleNext} disabled={isPending}>
              Next
            </PrimaryButton>
          ) : (
            <PrimaryButton onClick={handleSubmit} loading={isPending}>
              Save & Continue
            </PrimaryButton>
          )}
        </div>
      </footer>
    </div>
  );
}
