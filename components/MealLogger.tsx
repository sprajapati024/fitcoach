"use client";

import { useState, useRef, useEffect } from "react";
import { X, Sparkles, Loader2, Mic, Square, Coffee, Sun, Moon, Apple, CheckCircle, AlertTriangle } from "lucide-react";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useLogMeal } from "@/lib/query/hooks";
import { useToast } from "@/components/Toast";

interface MealLoggerProps {
  onClose: () => void;
  onMealLogged: () => void;
  initialDate?: string;
  initialData?: {
    description?: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    notes?: string;
    mealType?: MealType;
  };
}

type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export function MealLogger({ onClose, onMealLogged, initialDate, initialData }: MealLoggerProps) {
  // Detect if we're in edit mode (data was pre-filled from AI analysis)
  const isEditMode = !!(initialData?.description && initialData?.calories);

  const [mealType, setMealType] = useState<MealType>(initialData?.mealType || "breakfast");
  const [description, setDescription] = useState(initialData?.description || "");
  const [calories, setCalories] = useState(initialData?.calories?.toString() || "");
  const [protein, setProtein] = useState(initialData?.protein?.toFixed(1) || "");
  const [carbs, setCarbs] = useState(initialData?.carbs?.toFixed(1) || "");
  const [fat, setFat] = useState(initialData?.fat?.toFixed(1) || "");
  const [fiber, setFiber] = useState(initialData?.fiber?.toFixed(1) || "");
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");

  console.log('[MealLogger] isEditMode:', isEditMode, 'initialData:', initialData);

  // Use React Query mutation for logging meals
  const logMealMutation = useLogMeal();

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [wasVoiceInput, setWasVoiceInput] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const today = initialDate || new Date().toISOString().split("T")[0];
  const now = new Date().toISOString();

  // Toast notifications
  const toast = useToast();

  // EOD Protein Check state
  const [showEODCheck, setShowEODCheck] = useState(false);
  const [eodCheckData, setEODCheckData] = useState<{
    currentProtein: number;
    targetProtein: number;
    percentage: number;
  } | null>(null);

  // Helper: Check for whole food keywords
  const checkWholeFoods = (desc: string): boolean => {
    const wholeFoodKeywords = [
      "chicken", "salmon", "tuna", "eggs", "turkey", "beef", "fish",
      "broccoli", "spinach", "kale", "quinoa", "oats", "sweet potato",
      "brown rice", "avocado", "nuts", "almonds", "greek yogurt", "cottage cheese",
      "lentils", "beans", "vegetables", "fruit", "berries"
    ];
    const lowerDesc = desc.toLowerCase();
    return wholeFoodKeywords.some(keyword => lowerDesc.includes(keyword));
  };

  // Helper: Calculate meal badge based on nutrition
  const calculateMealBadge = () => {
    const proteinVal = parseFloat(protein) || 0;
    const carbsVal = parseFloat(carbs) || 0;
    const fatVal = parseFloat(fat) || 0;
    const caloriesVal = parseFloat(calories) || 0;

    // Priority 1: High-quality meal (whole foods + good protein)
    if (checkWholeFoods(description) && proteinVal >= 20) {
      return { emoji: "🔥", message: "High-quality meal!" };
    }

    // Priority 2: Great protein
    if (proteinVal >= 25) {
      return { emoji: "✅", message: "Great protein!" };
    }

    // Priority 3: Balanced macros (if we have all macro data)
    if (proteinVal > 0 && carbsVal > 0 && fatVal > 0 && caloriesVal > 0) {
      const proteinCal = proteinVal * 4;
      const carbsCal = carbsVal * 4;
      const fatCal = fatVal * 9;
      const totalMacroCal = proteinCal + carbsCal + fatCal;

      if (totalMacroCal > 0) {
        const proteinPercent = proteinCal / totalMacroCal;
        const carbsPercent = carbsCal / totalMacroCal;
        const fatPercent = fatCal / totalMacroCal;

        // Balanced: protein 20-40%, carbs 30-50%, fat 20-35%
        if (proteinPercent >= 0.20 && proteinPercent <= 0.40 &&
            carbsPercent >= 0.30 && carbsPercent <= 0.50 &&
            fatPercent >= 0.20 && fatPercent <= 0.35) {
          return { emoji: "✅", message: "Balanced macros!" };
        }
      }
    }

    // Priority 4: Low protein warning
    if (proteinVal > 0 && proteinVal < 15) {
      return { emoji: "⚠️", message: "Low protein - consider adding more next time" };
    }

    // Default: success
    return { emoji: "✅", message: "Meal logged successfully!" };
  };

  // Helper: Check if EOD protein check should be shown
  const shouldShowEODCheck = (): boolean => {
    const currentHour = new Date().getHours();
    if (currentHour < 18) return false;

    // Check localStorage to avoid showing multiple times per day
    const lastShown = localStorage.getItem("eod-protein-check-date");
    const todayStr = new Date().toISOString().split("T")[0];

    if (lastShown === todayStr) {
      return false; // Already shown today
    }

    return true;
  };

  // Helper: Fetch and check EOD protein status
  const checkEODProtein = async () => {
    try {
      // Fetch nutrition goals
      const goalsResponse = await fetch("/api/nutrition/goals");
      if (!goalsResponse.ok) return;

      const goalsData = await goalsResponse.json();
      if (!goalsData.goals) return;

      const targetProtein = parseFloat(goalsData.goals.targetProteinGrams || "0");
      if (targetProtein === 0) return;

      // Fetch today's nutrition summary
      const summaryResponse = await fetch(`/api/nutrition/summary?date=${today}`);
      if (!summaryResponse.ok) return;

      const summaryData = await summaryResponse.json();
      const currentProtein = parseFloat(summaryData.summary?.totalProtein || "0");

      // Calculate percentage
      const percentage = (currentProtein / targetProtein) * 100;

      // If below 80%, show the check
      if (percentage < 80) {
        setEODCheckData({
          currentProtein: Math.round(currentProtein),
          targetProtein: Math.round(targetProtein),
          percentage: Math.round(percentage),
        });
        setShowEODCheck(true);

        // Mark as shown today
        localStorage.setItem("eod-protein-check-date", new Date().toISOString().split("T")[0]);
      }
    } catch (err) {
      console.error("Error checking EOD protein:", err);
      // Silently fail - don't disrupt the user experience
    }
  };

  const handleAnalyze = async () => {
    if (!description.trim()) {
      setError("Please describe what you ate");
      return;
    }

    setAnalyzing(true);
    setError("");

    try {
      const response = await fetch("/api/nutrition/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mealDescription: description }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze meal");
      }

      const data = await response.json();

      // Auto-fill nutrition fields
      setCalories(data.estimatedNutrition.calories.toString());
      setProtein(data.estimatedNutrition.proteinGrams.toFixed(1));
      setCarbs(data.estimatedNutrition.carbsGrams.toFixed(1));
      setFat(data.estimatedNutrition.fatGrams.toFixed(1));
      if (data.estimatedNutrition.fiberGrams) {
        setFiber(data.estimatedNutrition.fiberGrams.toFixed(1));
      }

      // Add breakdown to notes if suggestion exists
      if (data.suggestion) {
        setNotes(data.suggestion);
      }
    } catch (err) {
      console.error("Error analyzing meal:", err);
      setError("Could not analyze meal. Please enter nutrition manually.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      setError("Please describe what you ate");
      return;
    }

    setError("");

    try {
      await logMealMutation.mutateAsync({
        userId: "", // Will be filled by the hook
        mealDate: today,
        mealTime: new Date(now).getTime(),
        mealType,
        description: description.trim(),
        photoUrl: null,
        calories: calories ? parseInt(calories) : null,
        proteinGrams: protein ? protein : null,
        carbsGrams: carbs ? carbs : null,
        fatGrams: fat ? fat : null,
        fiberGrams: fiber ? fiber : null,
        notes: notes.trim() || null,
        source: wasVoiceInput ? "voice" : "manual",
      });

      onMealLogged();

      // Part 1: Show micro-feedback badge
      const badge = calculateMealBadge();
      toast.success(badge.message, `${badge.emoji} Keep up the great work!`);

      // Part 2: Check EOD protein (if after 6pm and not shown today)
      if (shouldShowEODCheck()) {
        // Small delay to let the toast show first
        setTimeout(() => {
          checkEODProtein();
        }, 500);
      }

      // Close modal after a brief delay to allow toast to be visible
      setTimeout(() => {
        onClose();
      }, 300);
    } catch (err) {
      console.error("Error logging meal:", err);
      setError("Failed to log meal. Please try again.");
    }
  };

  const startRecording = async () => {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4",
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());

        // Create audio blob
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType,
        });

        // Validate audio was captured
        if (audioBlob.size === 0) {
          setError("No audio was captured. Please try again.");
          setRecordingTime(0);
          return;
        }

        // Transcribe audio
        await transcribeAudio(audioBlob);
      };

      // Start recording with timeslice to ensure data is captured
      mediaRecorder.start(1000); // Capture data every second
      setIsRecording(true);
      setRecordingTime(0);
      setError("");

      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          // Auto-stop at 2 minutes (120 seconds) for cost control
          if (newTime >= 120) {
            stopRecording();
          }
          return newTime;
        });
      }, 1000);
    } catch (err) {
      console.error("Error starting recording:", err);
      setError(
        "Could not access microphone. Please allow microphone permission and try again."
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      // Clear timer
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    setError("");

    try {
      // Determine file extension based on MIME type
      const mimeType = audioBlob.type;
      const extension = mimeType.includes("webm") ? "webm" :
                       mimeType.includes("mp4") ? "mp4" :
                       mimeType.includes("mpeg") ? "mp3" : "webm";

      console.log(`Recording MIME type: ${mimeType}, size: ${audioBlob.size} bytes`);

      const formData = new FormData();
      formData.append("audio", audioBlob, `recording.${extension}`);

      const response = await fetch("/api/nutrition/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to transcribe audio");
      }

      const data = await response.json();

      // Set the transcribed text as the description
      setDescription(data.transcript);
      setWasVoiceInput(true);
    } catch (err) {
      console.error("Error transcribing audio:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to transcribe audio. Please try again or type manually."
      );
    } finally {
      setIsTranscribing(false);
      setRecordingTime(0);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-900 border-b border-border p-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{isEditMode ? "Edit Meal" : "Log Meal"}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-1 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Meal Type */}
          <div>
            <label className="block text-sm font-medium mb-3">Meal Type</label>
            <div className="grid grid-cols-2 gap-3">
              {(["breakfast", "lunch", "dinner", "snack"] as MealType[]).map((type) => {
                const icons = {
                  breakfast: Coffee,
                  lunch: Sun,
                  dinner: Moon,
                  snack: Apple,
                };
                const Icon = icons[type];

                return (
                  <button
                    key={type}
                    onClick={() => setMealType(type)}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                      mealType === type
                        ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-gray-950"
                        : "bg-surface-1 hover:bg-surface-2"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">What did you eat?</label>

              {/* Voice Recording Button - only show in manual entry mode */}
              {!isEditMode && !isRecording && !isTranscribing && (
                <button
                  onClick={startRecording}
                  className="flex items-center gap-2 px-3 py-1.5 bg-surface-1 hover:bg-surface-2 border border-border rounded-lg text-sm transition-colors"
                  title="Record with voice"
                >
                  <Mic className="h-4 w-4" />
                  Voice
                </button>
              )}
            </div>

            {/* Recording Indicator with ChatGPT-style Ripple */}
            {isRecording && (
              <div className="mb-3 p-4 bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 border border-cyan-500/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Ripple Animation */}
                    <div className="relative flex items-center justify-center h-12 w-12 shrink-0">
                      {/* Outer ripples */}
                      <div className="absolute inset-0 rounded-full bg-cyan-500/20 animate-ping" style={{ animationDuration: '2s' }} />
                      <div className="absolute inset-0 rounded-full bg-cyan-500/10 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
                      {/* Inner circle */}
                      <div className="relative h-6 w-6 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/50">
                        <Mic className="h-3 w-3 text-white" />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-cyan-400">Listening...</span>
                        <span className="text-sm font-mono text-gray-400">{formatTime(recordingTime)}</span>
                      </div>
                      <p className="text-xs text-gray-500">Speak naturally • Auto-stops at 2 min</p>
                    </div>
                  </div>

                  <button
                    onClick={stopRecording}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-sm font-medium text-white transition-colors shadow-lg shadow-red-500/20 active:scale-95 shrink-0"
                  >
                    <Square className="h-3.5 w-3.5" />
                    Stop
                  </button>
                </div>
              </div>
            )}

            {/* Transcribing Indicator */}
            {isTranscribing && (
              <div className="mb-3 p-3 bg-cyan-900/20 border border-cyan-500/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                  <span className="text-sm text-cyan-300">Transcribing your voice...</span>
                </div>
              </div>
            )}

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="E.g., Grilled chicken breast, brown rice, steamed broccoli with olive oil"
              className="w-full px-4 py-3 bg-surface-1 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 min-h-[100px]"
              maxLength={1000}
              disabled={isRecording || isTranscribing}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-neutral-500">{description.length}/1000</span>
              {/* AI Analyze button - only show in manual entry mode */}
              {!isEditMode && (
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing || !description.trim() || isRecording || isTranscribing}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 text-gray-950 rounded-lg font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      AI Analyze
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Nutrition Info */}
          <div>
            <label className="block text-sm font-medium mb-3">
              {isEditMode ? "Nutrition Info" : "Nutrition Info (Optional - Auto-filled by AI)"}
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Calories</label>
                <input
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-surface-1 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                  min="0"
                  max="10000"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Protein (g)</label>
                <input
                  type="number"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-surface-1 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                  min="0"
                  max="500"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Carbs (g)</label>
                <input
                  type="number"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-surface-1 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                  min="0"
                  max="1000"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Fat (g)</label>
                <input
                  type="number"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-surface-1 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                  min="0"
                  max="500"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Fiber (g)</label>
                <input
                  type="number"
                  value={fiber}
                  onChange={(e) => setFiber(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-surface-1 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                  min="0"
                  max="200"
                  step="0.1"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How did you feel? Any observations?"
              className="w-full px-4 py-3 bg-surface-1 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 min-h-[80px]"
              maxLength={500}
            />
            <span className="text-xs text-neutral-500">{notes.length}/500</span>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-surface-1 hover:bg-surface-2 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <PrimaryButton
              onClick={handleSubmit}
              disabled={logMealMutation.isPending || !description.trim()}
              className="flex-1"
            >
              {logMealMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isEditMode ? "Saving..." : "Logging..."}
                </>
              ) : (
                isEditMode ? "Save Changes" : "Log Meal"
              )}
            </PrimaryButton>
          </div>
        </div>
      </div>

      {/* EOD Protein Check Overlay */}
      {showEODCheck && eodCheckData && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[60]">
          <div className="bg-gray-900 border border-amber-500/30 rounded-xl max-w-md w-full p-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-amber-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">Protein Check</h3>
                <p className="text-sm text-gray-400 mt-0.5">
                  You're at {eodCheckData.currentProtein}g/{eodCheckData.targetProtein}g protein ({eodCheckData.percentage}%)
                </p>
              </div>
              <button
                onClick={() => setShowEODCheck(false)}
                className="p-1 hover:bg-surface-1 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="mb-5">
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                  style={{ width: `${Math.min(eodCheckData.percentage, 100)}%` }}
                />
              </div>
            </div>

            {/* Suggestions */}
            <div className="space-y-3 mb-5">
              <p className="text-sm font-medium text-gray-300">Quick high-protein options:</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 p-2 bg-surface-1 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                  <span className="text-gray-300">Greek yogurt (20g)</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-surface-1 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                  <span className="text-gray-300">Protein shake (25g)</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-surface-1 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                  <span className="text-gray-300">Grilled chicken (30g)</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-surface-1 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                  <span className="text-gray-300">Cottage cheese (15g)</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={() => setShowEODCheck(false)}
              className="w-full px-4 py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Got it, thanks!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
