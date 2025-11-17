"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight, RefreshCw, Calendar, CheckCircle2, XCircle, Target } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

interface WeeklyStats {
  daysLogged: number;
  avgCalories: number;
  avgProtein: number;
  adherence: number;
  proteinTargetHits?: number;
  calorieTargetHits?: number;
}

interface CoachResponse {
  headline: string;
  bullets: string[];
  prompts: string[];
}

interface DailyBreakdown {
  date: string;
  calories: number;
  protein: number;
  hitProteinTarget: boolean;
  hitCalorieTarget: boolean;
}

interface WeeklyApiResponse {
  success: boolean;
  coach?: CoachResponse;
  weekStats?: WeeklyStats | null;
  cached?: boolean;
  startDate: string;
  endDate: string;
  error?: string;
  noData?: boolean;
  requiresGoals?: boolean;
}

interface WeeklyTrendsData {
  totalDays: number;
  daysWithMeals: number;
  adherence: number;
  avgCalories: number;
  avgProtein: number;
  avgWater: number;
  dailySummaries: Array<{
    summaryDate: string;
    totalCalories: string | number;
    totalProtein: string | number;
    mealsLogged?: number;
  }>;
}

/**
 * Get Monday of a given week (ISO week starting Monday)
 */
function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

/**
 * Get Sunday of a given week
 */
function getSunday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() + (7 - day);
  return new Date(d.setDate(diff));
}

/**
 * Format date to YYYY-MM-DD
 */
function formatDateYMD(date: Date): string {
  return date.toISOString().split("T")[0]!;
}

/**
 * Get week number (ISO week)
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export default function WeeklyReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize week from query params or current week
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const startParam = searchParams.get("startDate");
    if (startParam) {
      return new Date(startParam);
    }
    return getMonday(new Date());
  });

  const [coachData, setCoachData] = useState<CoachResponse | null>(null);
  const [weekStats, setWeekStats] = useState<WeeklyStats | null>(null);
  const [trendsData, setTrendsData] = useState<WeeklyTrendsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);
  const [noData, setNoData] = useState(false);

  const weekEnd = getSunday(currentWeekStart);
  const weekNumber = getWeekNumber(currentWeekStart);

  // Fetch weekly data
  useEffect(() => {
    const fetchWeeklyData = async (refresh = false) => {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const startDate = formatDateYMD(currentWeekStart);
        const endDate = formatDateYMD(weekEnd);

        // Fetch coach brief and stats
        const coachUrl = `/api/coach/nutrition/weekly?startDate=${startDate}&endDate=${endDate}${refresh ? "&refresh=true" : ""}`;
        const coachResponse = await fetch(coachUrl, { cache: "no-store" });

        if (!coachResponse.ok) {
          throw new Error("Failed to fetch weekly review");
        }

        const coachPayload = (await coachResponse.json()) as WeeklyApiResponse;

        if (coachPayload.success && coachPayload.coach) {
          setCoachData(coachPayload.coach);
          setWeekStats(coachPayload.weekStats || null);
          setIsCached(!!coachPayload.cached);
          setNoData(!!coachPayload.noData);
        } else {
          setError(coachPayload.error || "Unable to load weekly review");
        }

        // Fetch detailed trends data for daily breakdown
        const trendsUrl = `/api/nutrition/weekly-trends?startDate=${startDate}&endDate=${endDate}`;
        const trendsResponse = await fetch(trendsUrl, { cache: "no-store" });

        if (trendsResponse.ok) {
          const trendsPayload = await trendsResponse.json();
          setTrendsData(trendsPayload);
        }
      } catch (err) {
        console.error("[WeeklyReview] Error:", err);
        setError(err instanceof Error ? err.message : "Failed to load weekly data");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    };

    void fetchWeeklyData();
  }, [currentWeekStart, weekEnd]);

  const handlePreviousWeek = () => {
    const newWeek = new Date(currentWeekStart);
    newWeek.setDate(newWeek.getDate() - 7);
    setCurrentWeekStart(newWeek);
  };

  const handleNextWeek = () => {
    const newWeek = new Date(currentWeekStart);
    newWeek.setDate(newWeek.getDate() + 7);
    const today = new Date();
    // Don't allow going into the future
    if (newWeek <= today) {
      setCurrentWeekStart(newWeek);
    }
  };

  const handleRefresh = () => {
    const fetchWeeklyData = async () => {
      setIsRefreshing(true);
      setError(null);

      try {
        const startDate = formatDateYMD(currentWeekStart);
        const endDate = formatDateYMD(weekEnd);

        const coachUrl = `/api/coach/nutrition/weekly?startDate=${startDate}&endDate=${endDate}&refresh=true`;
        const coachResponse = await fetch(coachUrl, { cache: "no-store" });

        if (!coachResponse.ok) {
          throw new Error("Failed to fetch weekly review");
        }

        const coachPayload = (await coachResponse.json()) as WeeklyApiResponse;

        if (coachPayload.success && coachPayload.coach) {
          setCoachData(coachPayload.coach);
          setWeekStats(coachPayload.weekStats || null);
          setIsCached(false);
          setNoData(!!coachPayload.noData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to refresh");
      } finally {
        setIsRefreshing(false);
      }
    };

    void fetchWeeklyData();
  };

  const formatWeekRange = () => {
    const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    const start = currentWeekStart.toLocaleDateString("en-US", options);
    const end = weekEnd.toLocaleDateString("en-US", options);
    return `${start} - ${end}`;
  };

  const isCurrentWeek = () => {
    const today = getMonday(new Date());
    return formatDateYMD(currentWeekStart) === formatDateYMD(today);
  };

  // Calculate daily breakdown from trends data
  const dailyBreakdown: DailyBreakdown[] = trendsData?.dailySummaries.map((summary) => {
    const calories = parseInt(summary.totalCalories?.toString() || "0") || 0;
    const protein = parseFloat(summary.totalProtein?.toString() || "0") || 0;

    // Default targets (will be enhanced with actual goals)
    const proteinTarget = 120;
    const calorieTarget = 2000;

    return {
      date: summary.summaryDate,
      calories,
      protein,
      hitProteinTarget: protein >= proteinTarget * 0.9,
      hitCalorieTarget: calories >= calorieTarget * 0.85 && calories <= calorieTarget * 1.15,
    };
  }) || [];

  // Generate all 7 days of the week with data or placeholders
  const allDays: (DailyBreakdown & { hasData: boolean })[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + i);
    const dateStr = formatDateYMD(date);
    const existing = dailyBreakdown.find((d) => d.date === dateStr);

    if (existing) {
      allDays.push({ ...existing, hasData: true });
    } else {
      allDays.push({
        date: dateStr,
        calories: 0,
        protein: 0,
        hitProteinTarget: false,
        hitCalorieTarget: false,
        hasData: false,
      });
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black -mx-4 -mt-6">
        <main className="mx-auto max-w-4xl px-3 pt-4 pb-24 space-y-4">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black -mx-4 -mt-6">
      <main className="mx-auto max-w-4xl px-3 pt-4 pb-24 space-y-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-3"
        >
          <button
            onClick={() => router.back()}
            className="p-2.5 rounded-lg border border-gray-800 bg-gray-900 hover:bg-gray-800 transition"
            title="Go back"
          >
            <ArrowLeft className="h-4 w-4 text-gray-400" />
          </button>

          <div className="flex-1 flex items-center justify-between p-3 rounded-lg border border-gray-800 bg-gray-900">
            <button
              onClick={handlePreviousWeek}
              className="p-1 rounded hover:bg-gray-800 transition"
            >
              <ChevronLeft className="h-4 w-4 text-gray-400" />
            </button>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <Calendar className="h-4 w-4 text-cyan-400" />
                <span className="text-sm font-medium text-white">
                  Week {weekNumber}: {formatWeekRange()}
                </span>
              </div>
              {isCurrentWeek() && (
                <span className="text-xs text-cyan-400">Current Week</span>
              )}
            </div>

            <button
              onClick={handleNextWeek}
              disabled={isCurrentWeek()}
              className="p-1 rounded hover:bg-gray-800 transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2.5 rounded-lg border border-gray-800 bg-gray-900 hover:bg-gray-800 transition disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw
              className={`h-4 w-4 text-gray-400 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </button>
        </motion.div>

        {/* Weekly Stats */}
        {weekStats && !noData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="p-5 rounded-lg border border-gray-800 bg-gray-900"
          >
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-4">
              Weekly Stats
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-2xl font-bold text-white">
                  {weekStats.daysLogged}/7
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Days Logged ({weekStats.adherence}%)
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {weekStats.avgCalories}
                </div>
                <div className="text-xs text-gray-400 mt-1">Avg Calories</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {weekStats.avgProtein}g
                </div>
                <div className="text-xs text-gray-400 mt-1">Avg Protein</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-cyan-400">
                  {weekStats.proteinTargetHits || 0}/7
                </div>
                <div className="text-xs text-gray-400 mt-1">Protein Goals Hit</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Nutrition Coach Review */}
        {coachData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="rounded-lg border border-purple-500/30 bg-gradient-to-br from-purple-900/20 to-pink-900/20 overflow-hidden"
          >
            <div className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-purple-400">
                  Nutrition Coach Weekly Review
                </h2>
                {isCached && (
                  <span className="text-[10px] text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
                    Cached
                  </span>
                )}
              </div>

              <h3 className="text-lg font-bold text-white leading-snug">
                {coachData.headline}
              </h3>

              {coachData.bullets && coachData.bullets.length > 0 && (
                <ul className="space-y-2">
                  {coachData.bullets.map((bullet, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm text-gray-300"
                    >
                      <span className="text-purple-400 mt-1">•</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              )}

              {coachData.prompts && coachData.prompts.length > 0 && (
                <div className="pt-3 border-t border-gray-800/50">
                  <h4 className="text-xs font-semibold text-pink-400 uppercase tracking-wide mb-2">
                    Reflection Prompts
                  </h4>
                  <ul className="space-y-1.5">
                    {coachData.prompts.map((prompt, index) => (
                      <li key={index} className="text-sm italic text-gray-400">
                        "{prompt}"
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Daily Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="p-5 rounded-lg border border-gray-800 bg-gray-900"
        >
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-4">
            Daily Breakdown
          </h2>
          <div className="space-y-2">
            {allDays.map((day, index) => {
              const date = new Date(day.date);
              const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
              const dayDate = date.toLocaleDateString("en-US", { month: "numeric", day: "numeric" });

              return (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    day.hasData
                      ? "border-gray-700 bg-gray-800/50"
                      : "border-gray-800 bg-gray-900/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-medium text-white w-16">
                      {dayName} {dayDate}
                    </div>
                    {day.hasData ? (
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>{day.calories} cal</span>
                        <span>•</span>
                        <span>{day.protein}g protein</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500 italic">No data logged</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {day.hasData ? (
                      <>
                        {day.hitCalorieTarget ? (
                          <CheckCircle2 className="h-4 w-4 text-green-400" title="Calorie target hit" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-600" title="Calorie target missed" />
                        )}
                        {day.hitProteinTarget ? (
                          <Target className="h-4 w-4 text-cyan-400" title="Protein target hit" />
                        ) : (
                          <Target className="h-4 w-4 text-gray-600" title="Protein target missed" />
                        )}
                      </>
                    ) : (
                      <div className="h-4 w-4" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-lg border border-red-500/30 bg-red-900/20"
          >
            <p className="text-sm text-red-400">{error}</p>
          </motion.div>
        )}
      </main>
    </div>
  );
}
