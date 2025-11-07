'use client';

import { useState, useEffect, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, SkipForward, Check } from 'lucide-react';
import { z } from 'zod';
import { type OnboardingInput, preferredDaySchema } from '@/lib/validation';
import { saveProfileAction } from '@/app/actions/profile';
import type { Profile } from '@/drizzle/schema';

type PreferredDay = z.infer<typeof preferredDaySchema>;
type ProfileRow = Profile;

interface OnboardingFormProps {
  initialProfile?: ProfileRow | null;
}

const dayOptions: Array<{ label: string; value: PreferredDay }> = [
  { label: 'Mon', value: 'mon' },
  { label: 'Tue', value: 'tue' },
  { label: 'Wed', value: 'wed' },
  { label: 'Thu', value: 'thu' },
  { label: 'Fri', value: 'fri' },
  { label: 'Sat', value: 'sat' },
  { label: 'Sun', value: 'sun' },
];

const equipmentOptions = [
  { label: 'Barbell', value: 'barbell' },
  { label: 'Dumbbells', value: 'dumbbell' },
  { label: 'Kettlebells', value: 'kettlebell' },
  { label: 'Cable machine', value: 'cable' },
  { label: 'Resistance bands', value: 'bands' },
  { label: 'Bodyweight', value: 'bodyweight' },
  { label: 'Trap bar', value: 'trap_bar' },
  { label: 'Stationary bike', value: 'bike' },
  { label: 'Treadmill', value: 'treadmill' },
  { label: 'Row erg', value: 'rower' },
  { label: 'Sled', value: 'sled' },
];

const avoidOptions = [
  { label: 'Overhead press', value: 'overhead_press' },
  { label: 'Jumping plyos', value: 'jumping_plyos' },
  { label: 'Heavy deadlifts', value: 'heavy_deadlifts' },
  { label: 'Sprint intervals', value: 'sprint_intervals' },
  { label: 'Burpees', value: 'burpees' },
];

const steps = ['Welcome', 'Your Body', 'Training', 'Goals'];

// Default values for skipped steps
const defaultValues = {
  fullName: '',
  age: 30,
  sex: 'unspecified' as const,
  height: { value: 168, unit: 'cm' as const },
  weight: { value: 68, unit: 'kg' as const },
  unitSystem: 'metric' as const,
  experienceLevel: 'beginner' as const,
  goalBias: 'balanced' as const,
  hasPcos: false,
  noHighImpact: false,
  avoidList: [],
  coachTone: 'analyst' as const,
  coachTodayEnabled: true,
  coachDebriefEnabled: true,
  coachWeeklyEnabled: true,
  coachNotes: '',
  timezone: typeof window !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC',
};

// Auto-select preferred days based on daysPerWeek
const getDefaultPreferredDays = (daysPerWeek: number): PreferredDay[] => {
  const patterns: Record<number, PreferredDay[]> = {
    3: ['mon', 'wed', 'fri'],
    4: ['mon', 'tue', 'thu', 'fri'],
    5: ['mon', 'tue', 'wed', 'thu', 'fri'],
    6: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
  };
  return patterns[daysPerWeek] || patterns[3];
};

function buildInitialState(profile?: ProfileRow | null): OnboardingInput {
  const timezone = typeof window !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';

  if (!profile) {
    return {
      ...defaultValues,
      schedule: {
        daysPerWeek: 3,
        minutesPerSession: 60,
        programWeeks: 12,
        preferredDays: getDefaultPreferredDays(3),
      },
      equipment: ['bodyweight'],
      timezone,
    };
  }

  const unitSystem = profile.unitSystem ?? 'metric';
  const heightCm = profile.heightCm ? Number(profile.heightCm) : 168;
  const weightKg = profile.weightKg ? Number(profile.weightKg) : 68;

  const convertHeight = unitSystem === 'metric' ? heightCm : heightCm / 2.54;
  const convertWeight = unitSystem === 'metric' ? weightKg : weightKg / 0.453592;

  return {
    fullName: profile.fullName ?? '',
    sex: profile.sex,
    age: 30, // We'll need to calculate this from dateOfBirth if needed
    height: {
      value: Math.round(convertHeight * 10) / 10,
      unit: unitSystem === 'metric' ? 'cm' : 'in',
    },
    weight: {
      value: Math.round(convertWeight * 10) / 10,
      unit: unitSystem === 'metric' ? 'kg' : 'lb',
    },
    unitSystem,
    hasPcos: profile.hasPcos,
    experienceLevel: profile.experienceLevel,
    schedule: {
      daysPerWeek: profile.scheduleDaysPerWeek ?? 3,
      minutesPerSession: profile.scheduleMinutesPerSession ?? 60,
      programWeeks: profile.scheduleWeeks ?? 12,
      preferredDays: (profile.preferredDays as PreferredDay[]) ?? getDefaultPreferredDays(3),
    },
    equipment: (profile.equipment as string[])?.length ? (profile.equipment as string[]) : ['bodyweight'],
    avoidList: (profile.avoidList as string[]) ?? [],
    noHighImpact: profile.noHighImpact,
    goalBias: profile.goalBias,
    coachTone: profile.coachTone,
    coachTodayEnabled: profile.coachTodayEnabled,
    coachDebriefEnabled: profile.coachDebriefEnabled,
    coachWeeklyEnabled: profile.coachWeeklyEnabled,
    coachNotes: profile.coachNotes ?? '',
    timezone: profile.timezone ?? timezone,
  };
}

export function OnboardingForm({ initialProfile }: OnboardingFormProps) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<OnboardingInput>(() => buildInitialState(initialProfile));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const progress = ((step + 1) / steps.length) * 100;

  // Auto-update preferred days when daysPerWeek changes
  useEffect(() => {
    const expectedDays = getDefaultPreferredDays(form.schedule.daysPerWeek);
    if (form.schedule.preferredDays.length !== form.schedule.daysPerWeek) {
      setForm(prev => ({
        ...prev,
        schedule: {
          ...prev.schedule,
          preferredDays: expectedDays,
        },
      }));
    }
  }, [form.schedule.daysPerWeek]);

  const validateStep = (stepIndex: number) => {
    const newErrors: Record<string, string> = {};

    if (stepIndex === 0) {
      if (!form.fullName.trim()) {
        newErrors.fullName = 'What should we call you?';
      }
      if (form.age < 18 || form.age > 80) {
        newErrors.age = 'Age must be between 18 and 80';
      }
    }

    if (stepIndex === 1) {
      if (form.height.value <= 0) {
        newErrors.height = 'Enter a valid height';
      }
      if (form.weight.value <= 0) {
        newErrors.weight = 'Enter a valid weight';
      }
    }

    if (stepIndex === 2) {
      if (form.schedule.daysPerWeek < 3 || form.schedule.daysPerWeek > 6) {
        newErrors.daysPerWeek = 'Select 3-6 training days';
      }
      if (form.schedule.preferredDays.length !== form.schedule.daysPerWeek) {
        newErrors.preferredDays = `Select ${form.schedule.daysPerWeek} preferred training days`;
      }
      if (form.equipment.length === 0) {
        newErrors.equipment = 'Pick at least one piece of equipment';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handleBack = () => {
    setErrors({});
    setStep(prev => Math.max(prev - 1, 0));
  };

  const handleSkip = () => {
    setErrors({});
    // Apply defaults for skipped step
    if (step === 0) {
      setForm(prev => ({
        ...prev,
        fullName: defaultValues.fullName,
        age: defaultValues.age,
        sex: defaultValues.sex,
      }));
    } else if (step === 1) {
      setForm(prev => ({
        ...prev,
        height: defaultValues.height,
        weight: defaultValues.weight,
        unitSystem: defaultValues.unitSystem,
        experienceLevel: defaultValues.experienceLevel,
      }));
    } else if (step === 3) {
      setForm(prev => ({
        ...prev,
        goalBias: defaultValues.goalBias,
        hasPcos: defaultValues.hasPcos,
        noHighImpact: defaultValues.noHighImpact,
        avoidList: defaultValues.avoidList,
      }));
    }
    setStep(prev => Math.min(prev + 1, steps.length - 1));
  };

  const handleSubmit = () => {
    if (!validateStep(step)) return;

    setSubmitError(null);
    startTransition(() => {
      saveProfileAction(form).catch((error) => {
        console.error('Failed to save profile:', error);
        setSubmitError('Failed to save profile. Please try again.');
      });
    });
  };

  const updateUnitSystem = (nextUnit: OnboardingInput['unitSystem']) => {
    if (form.unitSystem === nextUnit) return;

    if (nextUnit === 'metric') {
      const heightCm = form.height.unit === 'in' ? form.height.value * 2.54 : form.height.value;
      const weightKg = form.weight.unit === 'lb' ? form.weight.value * 0.453592 : form.weight.value;
      setForm(prev => ({
        ...prev,
        unitSystem: 'metric',
        height: { value: Math.round(heightCm * 10) / 10, unit: 'cm' },
        weight: { value: Math.round(weightKg * 10) / 10, unit: 'kg' },
      }));
    } else {
      const heightIn = form.height.unit === 'cm' ? form.height.value / 2.54 : form.height.value;
      const weightLb = form.weight.unit === 'kg' ? form.weight.value / 0.453592 : form.weight.value;
      setForm(prev => ({
        ...prev,
        unitSystem: 'imperial',
        height: { value: Math.round(heightIn * 10) / 10, unit: 'in' },
        weight: { value: Math.round(weightLb * 10) / 10, unit: 'lb' },
      }));
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return <Step1Welcome form={form} setForm={setForm} errors={errors} />;
      case 1:
        return <Step2Body form={form} setForm={setForm} errors={errors} updateUnitSystem={updateUnitSystem} />;
      case 2:
        return <Step3Training form={form} setForm={setForm} errors={errors} />;
      case 3:
        return <Step4Goals form={form} setForm={setForm} errors={errors} />;
      default:
        return null;
    }
  };

  const canSkip = step === 0 || step === 1 || step === 3;
  const isLastStep = step === steps.length - 1;

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-8 pb-32">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-800">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-500 to-indigo-600 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          />
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Step {step + 1} of {steps.length}
        </p>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>

      {/* Error Message */}
      {submitError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400"
        >
          {submitError}
        </motion.div>
      )}

      {/* Footer Buttons - Sticky on mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-800 bg-black/95 p-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          {/* Back Button */}
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 0}
            className="inline-flex items-center gap-2 rounded-full border border-gray-800 bg-gray-800 px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="flex gap-3">
            {/* Skip Button */}
            {canSkip && (
              <button
                type="button"
                onClick={handleSkip}
                className="inline-flex items-center gap-2 rounded-full border border-gray-800 px-5 py-3 text-sm font-medium text-gray-400 transition hover:border-gray-700 hover:bg-gray-800 hover:text-white active:scale-95"
              >
                <SkipForward className="h-4 w-4" />
                <span className="hidden sm:inline">Skip</span>
              </button>
            )}

            {/* Next/Submit Button */}
            {isLastStep ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:scale-105 hover:shadow-cyan-500/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Complete</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:scale-105 hover:shadow-cyan-500/30 active:scale-95"
              >
                <span>Next</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 1: Welcome
function Step1Welcome({ form, setForm, errors }: any) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-white">Welcome to FitCoach 👋</h2>
        <p className="text-gray-400">Let's get to know you. We'll personalize your training based on what you share.</p>
      </div>

      <div className="space-y-4">
        {/* Name */}
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Name</span>
          <input
            type="text"
            value={form.fullName}
            onChange={e => setForm((prev: any) => ({ ...prev, fullName: e.target.value }))}
            className="mt-2 w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-3.5 text-white transition focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            placeholder="Your name"
          />
          {errors.fullName && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1 text-xs text-red-400"
            >
              {errors.fullName}
            </motion.p>
          )}
        </label>

        {/* Age */}
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Age</span>
          <input
            type="number"
            min={18}
            max={80}
            value={form.age}
            onChange={e => setForm((prev: any) => ({ ...prev, age: Number(e.target.value) }))}
            className="mt-2 w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-3.5 text-white transition focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
          />
          {errors.age && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1 text-xs text-red-400"
            >
              {errors.age}
            </motion.p>
          )}
        </label>

        {/* Sex */}
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Sex</span>
          <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Female', value: 'female' },
              { label: 'Male', value: 'male' },
              { label: 'Non-binary', value: 'non_binary' },
              { label: 'Prefer not', value: 'unspecified' },
            ].map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => setForm((prev: any) => ({ ...prev, sex: option.value }))}
                className={`rounded-xl border py-3 text-sm font-medium transition active:scale-95 ${
                  form.sex === option.value
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400 shadow-lg shadow-cyan-500/20'
                    : 'border-gray-800 bg-gray-900 text-gray-400 hover:border-gray-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 2: Body
function Step2Body({ form, setForm, errors, updateUnitSystem }: any) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-white">Tell us about your body</h2>
        <p className="text-gray-400">This helps us calculate proper loads and nutrition targets.</p>
      </div>

      <div className="space-y-4">
        {/* Unit System */}
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Unit System</span>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {[
              { label: 'Metric (kg, cm)', value: 'metric' },
              { label: 'Imperial (lb, in)', value: 'imperial' },
            ].map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => updateUnitSystem(option.value)}
                className={`rounded-xl border py-3 text-sm font-medium transition active:scale-95 ${
                  form.unitSystem === option.value
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                    : 'border-gray-800 bg-gray-900 text-gray-400 hover:border-gray-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Height & Weight */}
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Height ({form.height.unit})
            </span>
            <input
              type="number"
              value={form.height.value}
              onChange={e =>
                setForm((prev: any) => ({
                  ...prev,
                  height: { ...prev.height, value: Number(e.target.value) },
                }))
              }
              className="mt-2 w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-3.5 text-white transition focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            />
            {errors.height && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-1 text-xs text-red-400"
              >
                {errors.height}
              </motion.p>
            )}
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Weight ({form.weight.unit})
            </span>
            <input
              type="number"
              value={form.weight.value}
              onChange={e =>
                setForm((prev: any) => ({
                  ...prev,
                  weight: { ...prev.weight, value: Number(e.target.value) },
                }))
              }
              className="mt-2 w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-3.5 text-white transition focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            />
            {errors.weight && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-1 text-xs text-red-400"
              >
                {errors.weight}
              </motion.p>
            )}
          </label>
        </div>

        {/* Experience Level */}
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Experience Level</span>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { label: 'Beginner', value: 'beginner', desc: 'Less than 1 year of structured training' },
              { label: 'Intermediate', value: 'intermediate', desc: 'Consistent training for 1+ years' },
            ].map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => setForm((prev: any) => ({ ...prev, experienceLevel: option.value }))}
                className={`rounded-xl border p-4 text-left transition active:scale-95 ${
                  form.experienceLevel === option.value
                    ? 'border-cyan-500 bg-cyan-500/10 shadow-lg shadow-cyan-500/10'
                    : 'border-gray-800 bg-gray-900 hover:border-gray-700'
                }`}
              >
                <p className="font-semibold text-white">{option.label}</p>
                <p className="mt-1 text-xs text-gray-400">{option.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 3: Training (REQUIRED - No Skip)
function Step3Training({ form, setForm, errors }: any) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-white">Plan your training ✨</h2>
        <p className="text-gray-400">This is where the magic happens. Tell us how much time you can commit.</p>
      </div>

      <div className="space-y-5">
        {/* Schedule Grid */}
        <div className="grid grid-cols-3 gap-3">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Days/Week</span>
            <select
              value={form.schedule.daysPerWeek}
              onChange={e =>
                setForm((prev: any) => ({
                  ...prev,
                  schedule: { ...prev.schedule, daysPerWeek: Number(e.target.value) },
                }))
              }
              className="mt-2 w-full rounded-xl border border-gray-800 bg-gray-900 px-3 py-3.5 text-white transition focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            >
              {[3, 4, 5, 6].map(n => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Min/Day</span>
            <select
              value={form.schedule.minutesPerSession}
              onChange={e =>
                setForm((prev: any) => ({
                  ...prev,
                  schedule: { ...prev.schedule, minutesPerSession: Number(e.target.value) },
                }))
              }
              className="mt-2 w-full rounded-xl border border-gray-800 bg-gray-900 px-3 py-3.5 text-white transition focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            >
              {[40, 45, 50, 60, 75, 90].map(n => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Weeks</span>
            <select
              value={form.schedule.programWeeks}
              onChange={e =>
                setForm((prev: any) => ({
                  ...prev,
                  schedule: { ...prev.schedule, programWeeks: Number(e.target.value) },
                }))
              }
              className="mt-2 w-full rounded-xl border border-gray-800 bg-gray-900 px-3 py-3.5 text-white transition focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            >
              {[6, 8, 10, 12, 14, 16].map(n => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Preferred Days */}
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Preferred Days</span>
            <span className={`text-xs font-semibold ${
              form.schedule.preferredDays.length === form.schedule.daysPerWeek
                ? 'text-green-400'
                : 'text-yellow-400'
            }`}>
              {form.schedule.preferredDays.length === form.schedule.daysPerWeek && '✓ '}
              {form.schedule.preferredDays.length} of {form.schedule.daysPerWeek}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {dayOptions.map(day => {
              const isActive = form.schedule.preferredDays.includes(day.value);
              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => {
                    setForm((prev: any) => {
                      const current = prev.schedule.preferredDays;
                      const next = isActive
                        ? current.filter((d: PreferredDay) => d !== day.value)
                        : [...current, day.value];
                      return {
                        ...prev,
                        schedule: {
                          ...prev.schedule,
                          preferredDays: next.sort(
                            (a: PreferredDay, b: PreferredDay) =>
                              dayOptions.findIndex(d => d.value === a) - dayOptions.findIndex(d => d.value === b)
                          ),
                        },
                      };
                    });
                  }}
                  className={`min-w-[52px] rounded-full border px-4 py-2.5 text-sm font-semibold uppercase transition active:scale-95 ${
                    isActive
                      ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400 shadow-lg shadow-cyan-500/20'
                      : 'border-gray-800 bg-gray-900 text-gray-400 hover:border-gray-700'
                  }`}
                >
                  {isActive && '✓ '}
                  {day.label}
                </button>
              );
            })}
          </div>
          {errors.preferredDays && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 text-xs text-red-400"
            >
              {errors.preferredDays}
            </motion.p>
          )}
        </div>

        {/* Equipment */}
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Available Equipment</span>
          <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {equipmentOptions.map(option => {
              const isActive = form.equipment.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setForm((prev: any) => ({
                      ...prev,
                      equipment: isActive
                        ? prev.equipment.filter((e: string) => e !== option.value)
                        : [...prev.equipment, option.value],
                    }));
                  }}
                  className={`rounded-xl border px-4 py-3 text-sm font-medium transition active:scale-95 ${
                    isActive
                      ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                      : 'border-gray-800 bg-gray-900 text-gray-400 hover:border-gray-700'
                  }`}
                >
                  {isActive && '✓ '}
                  {option.label}
                </button>
              );
            })}
          </div>
          {errors.equipment && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 text-xs text-red-400"
            >
              {errors.equipment}
            </motion.p>
          )}
        </div>
      </div>
    </div>
  );
}

// Step 4: Goals
function Step4Goals({ form, setForm, errors }: any) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-white">Set your goals</h2>
        <p className="text-gray-400">Almost done! Let us know what you're training for and any health considerations.</p>
      </div>

      <div className="space-y-5">
        {/* Goal Bias */}
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Goal Bias</span>
          <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Strength', value: 'strength' },
              { label: 'Balanced', value: 'balanced' },
              { label: 'Hypertrophy', value: 'hypertrophy' },
              { label: 'Fat Loss', value: 'fat_loss' },
            ].map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => setForm((prev: any) => ({ ...prev, goalBias: option.value }))}
                className={`rounded-xl border py-3 text-sm font-medium transition active:scale-95 ${
                  form.goalBias === option.value
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                    : 'border-gray-800 bg-gray-900 text-gray-400 hover:border-gray-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Health Considerations */}
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Health Considerations</span>
          <div className="mt-2 space-y-3">
            {form.sex === 'female' && (
              <label className="flex items-start gap-3 rounded-xl border border-gray-800 bg-gray-900 p-4 transition hover:border-gray-700">
                <input
                  type="checkbox"
                  checked={form.hasPcos}
                  onChange={e => setForm((prev: any) => ({ ...prev, hasPcos: e.target.checked }))}
                  className="mt-0.5 h-5 w-5 rounded border-gray-700 bg-gray-800 text-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:ring-offset-0"
                />
                <div className="flex-1">
                  <p className="font-medium text-white">PCOS considerations</p>
                  <p className="mt-1 text-xs text-gray-400">We'll adjust cardio and recovery</p>
                </div>
              </label>
            )}

            <label className="flex items-start gap-3 rounded-xl border border-gray-800 bg-gray-900 p-4 transition hover:border-gray-700">
              <input
                type="checkbox"
                checked={form.noHighImpact}
                onChange={e => setForm((prev: any) => ({ ...prev, noHighImpact: e.target.checked }))}
                className="mt-0.5 h-5 w-5 rounded border-gray-700 bg-gray-800 text-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:ring-offset-0"
              />
              <div className="flex-1">
                <p className="font-medium text-white">Avoid high-impact movements</p>
                <p className="mt-1 text-xs text-gray-400">We'll modify jumps and plyometrics</p>
              </div>
            </label>
          </div>
        </div>

        {/* Movements to Avoid (Optional) */}
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Movements to Avoid <span className="text-gray-600">(Optional)</span>
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {avoidOptions.map(option => {
              const isActive = form.avoidList.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setForm((prev: any) => ({
                      ...prev,
                      avoidList: isActive
                        ? prev.avoidList.filter((a: string) => a !== option.value)
                        : [...prev.avoidList, option.value],
                    }));
                  }}
                  className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase transition active:scale-95 ${
                    isActive
                      ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                      : 'border-gray-800 bg-gray-900 text-gray-400 hover:border-gray-700'
                  }`}
                >
                  {isActive && '✓ '}
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
