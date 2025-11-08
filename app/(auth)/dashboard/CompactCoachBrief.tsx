'use client';

import { useState, useCallback, useEffect } from 'react';
import { ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import type { CoachResponse } from '@/lib/validation';

interface CompactCoachBriefProps {
  userId: string;
  hasActivePlan: boolean;
}

interface CoachApiResponse {
  success: boolean;
  coach?: CoachResponse;
  cached?: boolean;
  fallback?: string;
  error?: string;
}

export function CompactCoachBrief({ userId, hasActivePlan }: CompactCoachBriefProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [data, setData] = useState<CoachResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchBrief = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const url = forceRefresh
        ? `/api/coach/today?u=${encodeURIComponent(userId)}&refresh=true`
        : `/api/coach/today?u=${encodeURIComponent(userId)}`;

      const response = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
      });

      if (!response.ok) {
        setData(null);
        return;
      }

      const payload = (await response.json()) as CoachApiResponse;

      if (payload.coach) {
        setData(payload.coach);
      }
    } catch {
      setData(null);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    void fetchBrief();
  }, [fetchBrief]);

  const handleRefresh = useCallback(() => {
    void fetchBrief(true);
  }, [fetchBrief]);

  // Special onboarding message when no plan exists
  if (!hasActivePlan && !isLoading) {
    return (
      <Link href="/plan">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
          className="relative overflow-hidden rounded-2xl border border-purple-400/20 bg-gradient-to-br from-purple-950/40 to-indigo-950/40 backdrop-blur-sm cursor-pointer hover:border-purple-400/30 transition-all duration-300"
        >
          {/* Subtle top accent */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />

          <div className="relative p-5">
            {/* Content */}
            <div className="space-y-3">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="inline-flex items-center gap-1.5 rounded-md border border-purple-400/20 bg-purple-400/5 px-2 py-0.5"
              >
                <div className="h-1 w-1 rounded-full bg-purple-400" />
                <span className="text-[9px] font-semibold uppercase tracking-wider text-purple-400/90">Coach</span>
              </motion.div>

              {/* Headline */}
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="text-xl font-bold leading-snug text-white tracking-tight"
              >
                Ready to Transform?
              </motion.h3>

              <p className="text-sm text-gray-300/90 leading-relaxed">
                Welcome! I'm here to guide you on your fitness journey. Let's create your personalized workout plan together.
              </p>

              {/* CTA */}
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-purple-400 pt-1 group">
                <span className="group-hover:translate-x-1 transition-transform">Create Your Plan</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          </div>
        </motion.div>
      </Link>
    );
  }

  const coachMessage = data?.headline || 'Focus on form and progressive overload. Let\'s get stronger!';

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        className="relative overflow-hidden rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-950/40 to-cyan-950/40 backdrop-blur-sm"
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />

        <div className="p-5 space-y-3">
          <div className="h-5 w-20 animate-pulse rounded-md bg-gray-800/50" />
          <div className="h-8 w-4/5 animate-pulse rounded-md bg-gray-800/50" />
          <div className="h-4 w-2/5 animate-pulse rounded-md bg-gray-800/50" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-950/40 to-cyan-950/40 backdrop-blur-sm"
    >
      {/* Subtle top accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />

      <div className="relative p-5">
        {/* Content */}
        <div className="space-y-3">
          {/* Badge and Refresh Button Row */}
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="inline-flex items-center gap-1.5 rounded-md border border-emerald-400/20 bg-emerald-400/5 px-2 py-0.5"
            >
              <div className="h-1 w-1 rounded-full bg-emerald-400" />
              <span className="text-[9px] font-semibold uppercase tracking-wider text-emerald-400/90">Coach</span>
            </motion.div>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-1.5 rounded-lg border border-emerald-400/20 bg-emerald-400/5 hover:bg-emerald-400/10 hover:border-emerald-400/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
              aria-label="Refresh coach message"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-emerald-400/70 group-hover:text-emerald-400 transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
              />
            </button>
          </div>

          {/* Headline - Larger and More Prominent */}
          <motion.h3
            key={coachMessage} // Add key to trigger animation on message change
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="text-xl font-bold leading-snug text-white tracking-tight"
          >
            {coachMessage}
          </motion.h3>

          {/* Expand/Collapse Button */}
          {data?.bullets && data.bullets.length > 0 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400/70 hover:text-emerald-400 transition-colors group"
            >
              <span>{isExpanded ? 'Less' : 'More details'}</span>
              {isExpanded ? (
                <ChevronUp className="h-3.5 w-3.5 group-hover:translate-y-[-2px] transition-transform" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 group-hover:translate-y-[2px] transition-transform" />
              )}
            </button>
          )}
        </div>

        {/* Collapsible Bullets */}
        <AnimatePresence>
          {isExpanded && data?.bullets && data.bullets.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-emerald-400/10">
                <ul className="space-y-2.5">
                  {data.bullets.map((bullet, idx) => (
                    <motion.li
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25, delay: idx * 0.08 }}
                      className="text-sm text-gray-300/90 pl-5 relative before:content-['•'] before:absolute before:left-0 before:text-emerald-400/70 before:font-bold"
                    >
                      {bullet}
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
