"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Sparkles, MessageCircle } from "lucide-react";
import type { CoachResponse } from "@/lib/validation";

interface NutritionCoachBriefProps {
  date: string;
}

interface CoachApiResponse {
  success: boolean;
  coach?: CoachResponse;
  cached?: boolean;
  fallback?: boolean;
  source?: string;
  error?: string;
}

export function NutritionCoachBrief({ date }: NutritionCoachBriefProps) {
  const [data, setData] = useState<CoachResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);

  const fetchBrief = useCallback(
    async (refresh = false) => {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const url = `/api/coach/nutrition/today?date=${encodeURIComponent(
          date
        )}${refresh ? "&refresh=true" : ""}`;
        const response = await fetch(url, {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          // API endpoint doesn't exist yet, show placeholder
          throw new Error("API endpoint not available");
        }

        const payload = (await response.json()) as CoachApiResponse;

        if (payload.coach) {
          setData(payload.coach);
          setIsCached(!!payload.cached);
          setError(null);
        } else {
          setError(payload.error || "No coach brief available");
        }
      } catch (err) {
        // Fallback to placeholder when API doesn't exist
        setData({
          headline: "Your Nutrition Journey for Today",
          bullets: [
            "Track your meals throughout the day to stay on target",
            "Stay hydrated - aim for your daily water goal",
            "Focus on whole foods and balanced macros",
          ],
          prompts: [
            "What's your protein goal for today?",
            "Have you planned your meals ahead?",
          ],
        });
        setError(null);
        setIsCached(false);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [date]
  );

  useEffect(() => {
    void fetchBrief();
  }, [fetchBrief]);

  const handleRefresh = () => {
    void fetchBrief(true);
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-gray-800 bg-gradient-to-br from-purple-900/20 to-pink-900/20 p-5 animate-pulse"
      >
        <div className="space-y-3">
          <div className="h-6 w-3/4 bg-gray-800 rounded"></div>
          <div className="h-4 w-full bg-gray-800 rounded"></div>
          <div className="h-4 w-5/6 bg-gray-800 rounded"></div>
        </div>
      </motion.div>
    );
  }

  if (error && !data) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-gray-800 bg-gray-900 p-5"
      >
        <div className="text-center text-gray-400">
          <p className="text-sm">{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-3 text-xs text-cyan-400 hover:text-cyan-300 transition"
          >
            Try again
          </button>
        </div>
      </motion.div>
    );
  }

  if (!data) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-purple-500/30 bg-gradient-to-br from-purple-900/20 to-pink-900/20 overflow-hidden"
    >
      {/* Header with badge and refresh */}
      <div className="p-5 pb-4 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-purple-500/20">
              <Sparkles className="h-4 w-4 text-purple-400" />
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-purple-400">
                Nutrition Coach Brief
              </h3>
              {isCached && (
                <p className="text-[10px] text-gray-500 mt-0.5">Cached</p>
              )}
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg hover:bg-white/5 transition disabled:opacity-50"
            title="Refresh brief"
          >
            <RefreshCw
              className={`h-4 w-4 text-gray-400 ${
                isRefreshing ? "animate-spin" : ""
              }`}
            />
          </button>
        </div>

        {/* Headline */}
        <div>
          <h4 className="text-lg font-bold text-white leading-snug">
            {data.headline}
          </h4>
        </div>

        {/* Bullets */}
        {data.bullets && data.bullets.length > 0 && (
          <ul className="space-y-2">
            {data.bullets.map((bullet, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="flex items-start gap-2 text-sm text-gray-300"
              >
                <span className="text-purple-400 mt-1">•</span>
                <span>{bullet}</span>
              </motion.li>
            ))}
          </ul>
        )}

        {/* Prompts */}
        {data.prompts && data.prompts.length > 0 && (
          <div className="pt-2 border-t border-gray-800/50">
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className="h-3.5 w-3.5 text-pink-400" />
              <span className="text-xs font-semibold text-pink-400 uppercase tracking-wide">
                Reflection Prompts
              </span>
            </div>
            <ul className="space-y-1.5">
              {data.prompts.map((prompt, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: 0.2 + index * 0.05 }}
                  className="text-sm italic text-gray-400"
                >
                  "{prompt}"
                </motion.li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </motion.div>
  );
}
