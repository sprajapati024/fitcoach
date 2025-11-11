"use client";

import { useState, useRef } from "react";
import { Mic, Square, Loader2, Sparkles, Check, Edit3, Coffee, Sun, Moon, Apple } from "lucide-react";
import { useLogMeal } from "@/lib/query/hooks";

interface QuickMealInputProps {
  onAnalyzed: (data: {
    description: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    notes?: string;
  }) => void;
  onMealLogged: () => void;
  date: string;
}

type MealType = "breakfast" | "lunch" | "dinner" | "snack";

interface AnalyzedMeal {
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  notes?: string;
  mealType: MealType;
}

export function QuickMealInput({ onAnalyzed, onMealLogged, date }: QuickMealInputProps) {
  const [input, setInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [analyzedMeal, setAnalyzedMeal] = useState<AnalyzedMeal | null>(null);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Meal logging mutation
  const logMealMutation = useLogMeal();

  // Auto-detect meal type based on time of day
  const detectMealType = (): MealType => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return "breakfast";
    if (hour >= 11 && hour < 16) return "lunch";
    if (hour >= 16 && hour < 22) return "dinner";
    return "snack";
  };

  const handleAnalyze = async () => {
    if (!input.trim()) {
      setError("Please describe what you ate");
      return;
    }

    setIsAnalyzing(true);
    setError("");

    try {
      const response = await fetch("/api/nutrition/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mealDescription: input }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze meal");
      }

      const data = await response.json();

      // Store analyzed data to show preview card
      setAnalyzedMeal({
        description: input.trim(),
        calories: data.estimatedNutrition.calories,
        protein: data.estimatedNutrition.proteinGrams,
        carbs: data.estimatedNutrition.carbsGrams,
        fat: data.estimatedNutrition.fatGrams,
        fiber: data.estimatedNutrition.fiberGrams,
        notes: data.suggestion || undefined,
        mealType: detectMealType(),
      });

      // Clear input
      setInput("");
    } catch (err) {
      console.error("Error analyzing meal:", err);
      setError("Could not analyze meal. Please try again or log manually.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLogMeal = async () => {
    if (!analyzedMeal) return;

    try {
      await logMealMutation.mutateAsync({
        userId: "", // Will be filled by the hook
        mealDate: date,
        mealTime: new Date().getTime(),
        mealType: analyzedMeal.mealType,
        description: analyzedMeal.description,
        photoUrl: null,
        calories: analyzedMeal.calories,
        proteinGrams: analyzedMeal.protein.toString(),
        carbsGrams: analyzedMeal.carbs.toString(),
        fatGrams: analyzedMeal.fat.toString(),
        fiberGrams: analyzedMeal.fiber?.toString() || null,
        notes: analyzedMeal.notes || null,
        source: "ai",
      });

      // Clear the preview card
      setAnalyzedMeal(null);

      // Notify parent to refresh
      onMealLogged();
    } catch (err) {
      console.error("Error logging meal:", err);
      setError("Failed to log meal. Please try again.");
    }
  };

  const handleEditDetails = () => {
    if (!analyzedMeal) return;

    // Pass to parent to open modal
    onAnalyzed(analyzedMeal);

    // Clear the preview card
    setAnalyzedMeal(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAnalyze();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType,
        });

        if (audioBlob.size === 0) {
          setError("No audio was captured. Please try again.");
          setRecordingTime(0);
          return;
        }

        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);
      setError("");

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          if (newTime >= 120) {
            stopRecording();
          }
          return newTime;
        });
      }, 1000);
    } catch (err) {
      console.error("Error starting recording:", err);
      setError("Could not access microphone. Please allow microphone permission.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

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
      const mimeType = audioBlob.type;
      const extension = mimeType.includes("webm") ? "webm" :
                       mimeType.includes("mp4") ? "mp4" :
                       mimeType.includes("mpeg") ? "mp3" : "webm";

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
      setInput(data.transcript);
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
    <div className="space-y-2">
      {/* Recording Indicator */}
      {isRecording && (
        <div className="p-3 bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 border border-cyan-500/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center h-10 w-10 shrink-0">
                <div className="absolute inset-0 rounded-full bg-cyan-500/20 animate-ping" style={{ animationDuration: '2s' }} />
                <div className="relative h-5 w-5 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center">
                  <Mic className="h-3 w-3 text-white" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-cyan-400">Listening...</span>
                  <span className="text-xs font-mono text-gray-400">{formatTime(recordingTime)}</span>
                </div>
              </div>
            </div>
            <button
              onClick={stopRecording}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-500 hover:bg-red-600 rounded-lg text-xs font-medium text-white transition-colors"
            >
              <Square className="h-3 w-3" />
              Stop
            </button>
          </div>
        </div>
      )}

      {/* Transcribing Indicator */}
      {isTranscribing && (
        <div className="p-3 bg-cyan-900/20 border border-cyan-500/30 rounded-lg">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
            <span className="text-sm text-cyan-300">Transcribing...</span>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="What did you eat? (e.g., 2 eggs and toast for breakfast)"
          disabled={isAnalyzing || isRecording || isTranscribing || !!analyzedMeal}
          className="w-full px-4 py-3 pr-24 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-white placeholder-gray-500 disabled:opacity-50"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {!isRecording && !isTranscribing && !isAnalyzing && !analyzedMeal && (
            <button
              onClick={startRecording}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              title="Voice input"
            >
              <Mic className="h-4 w-4 text-gray-400" />
            </button>
          )}
          {!isRecording && !isTranscribing && !analyzedMeal && (
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !input.trim()}
              className="p-2 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-30"
              title="Analyze with AI"
            >
              {isAnalyzing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Preview Card */}
      {analyzedMeal && (
        <div className="p-4 bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 border border-cyan-500/30 rounded-lg space-y-3">
          {/* Meal Type Badge */}
          <div className="flex items-center gap-2">
            {analyzedMeal.mealType === "breakfast" && <Coffee className="h-4 w-4 text-cyan-400" />}
            {analyzedMeal.mealType === "lunch" && <Sun className="h-4 w-4 text-cyan-400" />}
            {analyzedMeal.mealType === "dinner" && <Moon className="h-4 w-4 text-cyan-400" />}
            {analyzedMeal.mealType === "snack" && <Apple className="h-4 w-4 text-cyan-400" />}
            <span className="text-sm font-semibold text-cyan-400 capitalize">
              {analyzedMeal.mealType}
            </span>
          </div>

          {/* Description */}
          <p className="text-white font-medium">{analyzedMeal.description}</p>

          {/* Nutrition Info */}
          <div className="flex items-center gap-3 text-sm text-gray-300">
            <span className="font-semibold">{analyzedMeal.calories} cal</span>
            <span>•</span>
            <span>{analyzedMeal.protein.toFixed(0)}g protein</span>
            <span>•</span>
            <span>{analyzedMeal.carbs.toFixed(0)}g carbs</span>
            <span>•</span>
            <span>{analyzedMeal.fat.toFixed(0)}g fat</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleLogMeal}
              disabled={logMealMutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {logMealMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Logging...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Log {analyzedMeal.mealType.charAt(0).toUpperCase() + analyzedMeal.mealType.slice(1)}
                </>
              )}
            </button>
            <button
              onClick={handleEditDetails}
              className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Edit3 className="h-4 w-4" />
              Edit
            </button>
          </div>
        </div>
      )}

      {/* Manual Entry Link */}
      {!analyzedMeal && (
        <button
          onClick={() => onAnalyzed({
            description: "",
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0
          })}
          className="text-xs text-gray-400 hover:text-gray-300 transition-colors"
        >
          Or log manually →
        </button>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-2 bg-red-900/20 border border-red-500/30 rounded-lg text-red-300 text-xs">
          {error}
        </div>
      )}
    </div>
  );
}
