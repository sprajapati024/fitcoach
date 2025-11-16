"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ExercisePicker } from "@/components/ExercisePicker";
import type { UserExercise, PreferredDay } from "@/drizzle/schema";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Check,
} from "lucide-react";

type Exercise = {
  id: string;
  name: string;
  equipment: string;
  sets: number;
  reps: string;
  tempo?: string;
  cues?: string[];
  notes?: string;
};

type Block = {
  type: "warmup" | "strength" | "accessory" | "conditioning" | "recovery";
  title: string;
  durationMinutes: number;
  exercises: Exercise[];
};

type WorkoutPattern = {
  dayIndex: number;
  focus: string;
  blocks: Block[];
};

type Microcycle = {
  daysPerWeek: number;
  pattern: WorkoutPattern[];
};

interface CustomPlanBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (planId: string) => void;
}

// Helper function to get default preferred days based on days per week
const getDefaultPreferredDays = (daysPerWeek: number): PreferredDay[] => {
  const patterns: Record<number, PreferredDay[]> = {
    3: ["mon", "wed", "fri"],
    4: ["mon", "tue", "thu", "fri"],
    5: ["mon", "tue", "wed", "thu", "fri"],
    6: ["mon", "tue", "wed", "thu", "fri", "sat"],
  };
  return patterns[daysPerWeek] || patterns[3];
};

// Helper function to generate default workout pattern for a day
const generateDefaultPattern = (dayIndex: number): WorkoutPattern => {
  const focusOptions = [
    "Upper Body",
    "Lower Body",
    "Full Body",
    "Push",
    "Pull",
    "Conditioning",
  ];
  const focus = focusOptions[dayIndex % focusOptions.length];

  // Default block structure based on focus
  const blocks: Block[] =
    focus === "Conditioning"
      ? [
          {
            type: "warmup",
            title: "Warmup",
            durationMinutes: 10,
            exercises: [],
          },
          {
            type: "conditioning",
            title: "Conditioning Circuit",
            durationMinutes: 40,
            exercises: [],
          },
          {
            type: "recovery",
            title: "Cool Down",
            durationMinutes: 10,
            exercises: [],
          },
        ]
      : [
          {
            type: "warmup",
            title: "Warmup",
            durationMinutes: 10,
            exercises: [],
          },
          {
            type: "strength",
            title: "Main Work",
            durationMinutes: 35,
            exercises: [],
          },
          {
            type: "accessory",
            title: "Accessories",
            durationMinutes: 15,
            exercises: [],
          },
        ];

  return {
    dayIndex,
    focus,
    blocks,
  };
};

// Helper function to generate patterns for given number of days
const generateDefaultPatterns = (daysPerWeek: number): WorkoutPattern[] => {
  return Array.from({ length: daysPerWeek }, (_, i) =>
    generateDefaultPattern(i)
  );
};

export function CustomPlanBuilder({
  isOpen,
  onClose,
  onSuccess,
}: CustomPlanBuilderProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Plan Parameters - default to 3 days (most conservative)
  const [planTitle, setPlanTitle] = useState("");
  const [planSummary, setPlanSummary] = useState("");
  const [durationWeeks, setDurationWeeks] = useState(8);
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [minutesPerSession, setMinutesPerSession] = useState(60);
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [preferredDays, setPreferredDays] = useState<PreferredDay[]>(
    getDefaultPreferredDays(3)
  );

  // Step 2: Workout Templates - dynamically generated based on daysPerWeek
  const [microcycle, setMicrocycle] = useState<Microcycle>({
    daysPerWeek: 3,
    pattern: generateDefaultPatterns(3),
  });

  const [selectedPatternIndex, setSelectedPatternIndex] = useState(0);
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(
    null
  );
  const [showExercisePicker, setShowExercisePicker] = useState(false);

  const dayNames = ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6"];
  const allDays: { key: PreferredDay; label: string }[] = [
    { key: "mon", label: "Mon" },
    { key: "tue", label: "Tue" },
    { key: "wed", label: "Wed" },
    { key: "thu", label: "Thu" },
    { key: "fri", label: "Fri" },
    { key: "sat", label: "Sat" },
    { key: "sun", label: "Sun" },
  ];

  // Handle daysPerWeek change - sync preferredDays and patterns
  const handleDaysPerWeekChange = (newDaysPerWeek: number) => {
    setDaysPerWeek(newDaysPerWeek);
    setPreferredDays(getDefaultPreferredDays(newDaysPerWeek));
    setError(null);
  };

  // Toggle preferred day selection
  const handleTogglePreferredDay = (day: PreferredDay) => {
    setPreferredDays((prev) => {
      if (prev.includes(day)) {
        // Don't allow deselecting if it would go below daysPerWeek
        if (prev.length <= daysPerWeek) {
          setError(
            `You must select exactly ${daysPerWeek} training days to match your days per week setting`
          );
          return prev;
        }
        return prev.filter((d) => d !== day);
      } else {
        // Don't allow selecting more than daysPerWeek
        if (prev.length >= daysPerWeek) {
          setError(
            `You can only select ${daysPerWeek} training days. Deselect another day first.`
          );
          return prev;
        }
        setError(null);
        return [...prev, day];
      }
    });
  };

  const handleNextStep = () => {
    setError(null);

    if (step === 1) {
      // Validate step 1
      if (!planTitle.trim()) {
        setError("Please enter a plan title");
        return;
      }

      // Validate preferred days match daysPerWeek
      if (preferredDays.length !== daysPerWeek) {
        setError(
          `Please select exactly ${daysPerWeek} training days to match your days per week setting`
        );
        return;
      }

      // Validate start date is not in the past
      const today = new Date().toISOString().split("T")[0];
      if (startDate < today) {
        setError("Start date cannot be in the past");
        return;
      }

      // Update microcycle patterns based on daysPerWeek
      setMicrocycle((prev) => {
        const currentPatternCount = prev.pattern.length;
        let newPattern = [...prev.pattern];

        if (currentPatternCount < daysPerWeek) {
          // Add more patterns
          for (let i = currentPatternCount; i < daysPerWeek; i++) {
            newPattern.push(generateDefaultPattern(i));
          }
        } else if (currentPatternCount > daysPerWeek) {
          // Trim patterns
          newPattern = newPattern.slice(0, daysPerWeek);
        }

        return {
          ...prev,
          daysPerWeek: daysPerWeek,
          pattern: newPattern,
        };
      });
    }

    if (step === 2) {
      // Validate step 2 - ensure all blocks have at least one exercise
      const emptyBlocks: string[] = [];
      microcycle.pattern.forEach((pattern, pIndex) => {
        pattern.blocks.forEach((block, bIndex) => {
          if (block.exercises.length === 0) {
            emptyBlocks.push(`${dayNames[pIndex]} - ${block.title}`);
          }
        });
      });

      if (emptyBlocks.length > 0) {
        setError(
          `Please add at least one exercise to each block. Empty blocks: ${emptyBlocks.slice(0, 3).join(", ")}${emptyBlocks.length > 3 ? ` and ${emptyBlocks.length - 3} more` : ""}`
        );
        return;
      }
    }

    setStep(step + 1);
  };

  const handlePrevStep = () => {
    setStep(step - 1);
  };

  const handleAddExercise = (patternIndex: number, blockIndex: number) => {
    setSelectedPatternIndex(patternIndex);
    setSelectedBlockIndex(blockIndex);
    setShowExercisePicker(true);
  };

  const handleSelectExercise = (userExercise: UserExercise) => {
    if (selectedBlockIndex === null) return;

    const newExercise: Exercise = {
      id: userExercise.exerciseId,
      name: userExercise.name,
      equipment: userExercise.equipment[0] || "bodyweight",
      sets: 3,
      reps: "10-12",
      tempo: "2-0-2-0",
      cues: [],
    };

    setMicrocycle((prev) => {
      const newPattern = [...prev.pattern];
      newPattern[selectedPatternIndex].blocks[selectedBlockIndex].exercises.push(
        newExercise
      );
      return { ...prev, pattern: newPattern };
    });

    setShowExercisePicker(false);
    setSelectedBlockIndex(null);
  };

  const handleRemoveExercise = (
    patternIndex: number,
    blockIndex: number,
    exerciseIndex: number
  ) => {
    setMicrocycle((prev) => {
      const newPattern = [...prev.pattern];
      newPattern[patternIndex].blocks[blockIndex].exercises.splice(
        exerciseIndex,
        1
      );
      return { ...prev, pattern: newPattern };
    });
  };

  const handleUpdateExercise = (
    patternIndex: number,
    blockIndex: number,
    exerciseIndex: number,
    field: string,
    value: string | number
  ) => {
    setMicrocycle((prev) => {
      const newPattern = [...prev.pattern];
      const exercise = newPattern[patternIndex].blocks[blockIndex].exercises[
        exerciseIndex
      ];
      (exercise as any)[field] = value;
      return { ...prev, pattern: newPattern };
    });
  };

  const handleUpdateFocus = (patternIndex: number, newFocus: string) => {
    setMicrocycle((prev) => {
      const newPattern = [...prev.pattern];
      newPattern[patternIndex].focus = newFocus;
      return { ...prev, pattern: newPattern };
    });
  };

  const handleCreatePlan = async () => {
    setError(null);

    // Final validation before submission
    if (microcycle.pattern.length !== daysPerWeek) {
      setError(
        `Pattern count (${microcycle.pattern.length}) does not match days per week (${daysPerWeek})`
      );
      return;
    }

    if (preferredDays.length !== daysPerWeek) {
      setError(
        `Selected training days (${preferredDays.length}) must match days per week (${daysPerWeek})`
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/plan/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: planTitle,
          summary: planSummary,
          durationWeeks,
          daysPerWeek,
          minutesPerSession,
          preferredDays,
          startDate,
          microcycle,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create plan");
      }

      if (onSuccess) {
        onSuccess(data.plan.id);
      }

      onClose();
      router.push("/plan");
      router.refresh();
    } catch (error) {
      console.error("Error creating plan:", error);
      setError(
        error instanceof Error ? error.message : "Failed to create plan"
      );
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <div
          className="bg-gray-900 border border-border rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-border">
            <h2 className="text-2xl font-bold">Create Custom Plan</h2>
            <p className="text-neutral-400 text-sm mt-1">
              Step {step} of 3
            </p>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Step 1: Plan Parameters */}
            {step === 1 && (
              <div className="space-y-6 max-w-2xl mx-auto">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Plan Title *
                  </label>
                  <input
                    type="text"
                    value={planTitle}
                    onChange={(e) => setPlanTitle(e.target.value)}
                    placeholder="e.g., My Custom Strength Plan"
                    className="w-full px-4 py-3 bg-surface-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-neutral-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Plan Summary (optional)
                  </label>
                  <textarea
                    value={planSummary}
                    onChange={(e) => setPlanSummary(e.target.value)}
                    placeholder="Brief description of your plan..."
                    rows={3}
                    className="w-full px-4 py-3 bg-surface-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-neutral-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Duration (weeks) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="16"
                      value={durationWeeks}
                      onChange={(e) =>
                        setDurationWeeks(parseInt(e.target.value))
                      }
                      className="w-full px-4 py-3 bg-surface-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-neutral-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Days per Week *
                    </label>
                    <select
                      value={daysPerWeek}
                      onChange={(e) =>
                        handleDaysPerWeekChange(parseInt(e.target.value))
                      }
                      className="w-full px-4 py-3 bg-surface-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-neutral-200"
                    >
                      <option value="3">3 days</option>
                      <option value="4">4 days</option>
                      <option value="5">5 days</option>
                      <option value="6">6 days</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Preferred Training Days *
                  </label>
                  <p className="text-xs text-neutral-400 mb-3">
                    Select exactly {daysPerWeek} days when you prefer to train
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {allDays.map((day) => (
                      <button
                        key={day.key}
                        type="button"
                        onClick={() => handleTogglePreferredDay(day.key)}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                          preferredDays.includes(day.key)
                            ? "bg-neural-500 border-neural-500 text-white"
                            : "bg-surface-2 border-border text-neutral-400 hover:border-neutral-500"
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-neutral-500 mt-2">
                    Selected: {preferredDays.length}/{daysPerWeek} days
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Minutes per Session *
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="120"
                    step="5"
                    value={minutesPerSession}
                    onChange={(e) =>
                      setMinutesPerSession(parseInt(e.target.value))
                    }
                    className="w-full px-4 py-3 bg-surface-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-neutral-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-4 py-3 bg-surface-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-neutral-200"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Workout Templates */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold mb-2">
                    Build Your Workout Templates
                  </h3>
                  <p className="text-neutral-400 text-sm">
                    Create {daysPerWeek} workout templates. These will repeat
                    throughout your plan.
                  </p>
                </div>

                {microcycle.pattern.map((pattern, patternIndex) => (
                  <div
                    key={patternIndex}
                    className="bg-surface-1 border border-border rounded-lg overflow-hidden"
                  >
                    {/* Pattern Header */}
                    <div className="bg-surface-2 px-4 py-3 border-b border-border">
                      <div className="flex items-center gap-3">
                        <span className="text-neutral-400 text-sm">
                          {dayNames[patternIndex]}:
                        </span>
                        <input
                          type="text"
                          value={pattern.focus}
                          onChange={(e) =>
                            handleUpdateFocus(patternIndex, e.target.value)
                          }
                          placeholder="e.g., Upper Body"
                          className="flex-1 px-3 py-1.5 bg-surface-1 border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                        />
                      </div>
                    </div>

                    {/* Blocks */}
                    <div className="divide-y divide-border">
                      {pattern.blocks.map((block, blockIndex) => (
                        <div key={blockIndex} className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-semibold">{block.title}</h4>
                              <p className="text-xs text-neutral-400 uppercase">
                                {block.type}
                              </p>
                            </div>
                            <button
                              onClick={() =>
                                handleAddExercise(patternIndex, blockIndex)
                              }
                              className="flex items-center gap-2 px-3 py-1.5 bg-neural-500 hover:bg-neural-600 text-white rounded-md text-sm"
                            >
                              <Plus className="h-4 w-4" />
                              Add Exercise
                            </button>
                          </div>

                          {/* Exercises */}
                          {block.exercises.length === 0 ? (
                            <p className="text-neutral-500 text-sm py-4 text-center">
                              No exercises yet. Click "Add Exercise" to start.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {block.exercises.map((exercise, exerciseIndex) => (
                                <div
                                  key={exerciseIndex}
                                  className="bg-surface-2 rounded p-3 flex items-start justify-between"
                                >
                                  <div className="flex-1">
                                    <h5 className="font-medium text-sm">
                                      {exercise.name}
                                    </h5>
                                    <div className="mt-1 flex gap-4 text-xs">
                                      <div className="flex items-center gap-1">
                                        <span className="text-neutral-400">
                                          Sets:
                                        </span>
                                        <input
                                          type="number"
                                          min="1"
                                          max="10"
                                          value={exercise.sets}
                                          onChange={(e) =>
                                            handleUpdateExercise(
                                              patternIndex,
                                              blockIndex,
                                              exerciseIndex,
                                              "sets",
                                              parseInt(e.target.value)
                                            )
                                          }
                                          className="w-12 px-1 py-0.5 bg-surface-1 border border-border rounded text-center"
                                        />
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <span className="text-neutral-400">
                                          Reps:
                                        </span>
                                        <input
                                          type="text"
                                          value={exercise.reps}
                                          onChange={(e) =>
                                            handleUpdateExercise(
                                              patternIndex,
                                              blockIndex,
                                              exerciseIndex,
                                              "reps",
                                              e.target.value
                                            )
                                          }
                                          className="w-16 px-1 py-0.5 bg-surface-1 border border-border rounded text-center"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() =>
                                      handleRemoveExercise(
                                        patternIndex,
                                        blockIndex,
                                        exerciseIndex
                                      )
                                    }
                                    className="p-1 text-red-400 hover:bg-red-900/20 rounded"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="space-y-6 max-w-2xl mx-auto">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold mb-2">
                    Review Your Plan
                  </h3>
                  <p className="text-neutral-400 text-sm">
                    Review your custom plan before creating it.
                  </p>
                </div>

                <div className="bg-surface-1 border border-border rounded-lg p-6 space-y-4">
                  <div>
                    <h4 className="text-sm text-neutral-400 mb-1">Plan Title</h4>
                    <p className="font-semibold">{planTitle}</p>
                  </div>

                  {planSummary && (
                    <div>
                      <h4 className="text-sm text-neutral-400 mb-1">Summary</h4>
                      <p className="text-sm">{planSummary}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <h4 className="text-sm text-neutral-400 mb-1">Duration</h4>
                      <p className="font-semibold">{durationWeeks} weeks</p>
                    </div>
                    <div>
                      <h4 className="text-sm text-neutral-400 mb-1">
                        Days/Week
                      </h4>
                      <p className="font-semibold">{daysPerWeek} days</p>
                    </div>
                    <div>
                      <h4 className="text-sm text-neutral-400 mb-1">
                        Session Length
                      </h4>
                      <p className="font-semibold">{minutesPerSession} min</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm text-neutral-400 mb-1">Start Date</h4>
                    <p className="font-semibold">
                      {new Date(startDate).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm text-neutral-400 mb-2">
                      Workout Templates
                    </h4>
                    <div className="space-y-2">
                      {microcycle.pattern.map((pattern, i) => {
                        const totalExercises = pattern.blocks.reduce(
                          (sum, block) => sum + block.exercises.length,
                          0
                        );
                        return (
                          <div
                            key={i}
                            className="flex items-center justify-between text-sm bg-surface-2 rounded p-3"
                          >
                            <span>
                              {dayNames[i]}: {pattern.focus}
                            </span>
                            <span className="text-neutral-400">
                              {totalExercises} exercises
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border flex justify-between">
            <button
              onClick={step === 1 ? onClose : handlePrevStep}
              className="flex items-center gap-2 px-6 py-2 bg-surface-2 hover:bg-surface-3 text-neutral-200 rounded-lg"
            >
              <ChevronLeft className="h-5 w-5" />
              {step === 1 ? "Cancel" : "Back"}
            </button>

            {step < 3 ? (
              <button
                onClick={handleNextStep}
                className="flex items-center gap-2 px-6 py-2 bg-neural-500 hover:bg-neural-600 text-white rounded-lg"
              >
                Next
                <ChevronRight className="h-5 w-5" />
              </button>
            ) : (
              <PrimaryButton onClick={handleCreatePlan} loading={saving}>
                <Check className="h-5 w-5" />
                Create Plan
              </PrimaryButton>
            )}
          </div>
        </div>
      </div>

      {/* Exercise Picker Modal */}
      <ExercisePicker
        isOpen={showExercisePicker}
        onClose={() => {
          setShowExercisePicker(false);
          setSelectedBlockIndex(null);
        }}
        onSelectExercise={handleSelectExercise}
      />
    </>
  );
}
