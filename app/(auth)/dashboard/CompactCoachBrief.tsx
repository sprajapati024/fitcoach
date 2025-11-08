'use client';

import { useState, useCallback, useEffect } from 'react';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
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

  const fetchBrief = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/coach/today?u=${encodeURIComponent(userId)}`, {
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
    }
  }, [userId]);

  useEffect(() => {
    void fetchBrief();
  }, [fetchBrief]);

  // Special onboarding message when no plan exists
  if (!hasActivePlan && !isLoading) {
    return (
      <Link href="/plan">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
          className="relative overflow-hidden rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 via-indigo-500/10 to-cyan-500/10 cursor-pointer hover:scale-[1.02] transition-transform"
        >
          {/* Animated gradient background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-transparent to-cyan-500/20 opacity-50 animate-pulse" />

          <div className="relative space-y-4 p-4">
            {/* Header with Avatar */}
            <div className="flex items-start gap-3">
              {/* Coach Avatar */}
              <motion.div
                initial={{ rotate: -10, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3, type: "spring", stiffness: 200 }}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-400/30 to-cyan-400/30 ring-2 ring-purple-400/20"
              >
                <Sparkles className="h-6 w-6 text-purple-400" />
              </motion.div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Badge */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-purple-400/30 bg-purple-400/10 px-2.5 py-1 mb-2"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-wide text-purple-400">Your Coach</span>
                </motion.div>

                {/* Headline - Large and Prominent */}
                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                  className="text-lg font-bold leading-tight text-white mb-2"
                >
                  Ready to Transform?
                </motion.h3>

                <p className="text-sm text-gray-300 mb-3">
                  Welcome! I'm here to guide you on your fitness journey. Let's create your personalized workout plan together.
                </p>

                {/* CTA */}
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-purple-400">
                  <span>Create Your Plan</span>
                  <span>→</span>
                </div>
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
        className="relative overflow-hidden rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-cyan-500/5 to-blue-500/5 p-4"
      >
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 animate-pulse">
              <Sparkles className="h-6 w-6 text-emerald-400" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="h-6 w-3/4 animate-pulse rounded-md bg-gray-800" />
              <div className="h-3 w-1/2 animate-pulse rounded-md bg-gray-800" />
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
      className="relative overflow-hidden rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-cyan-500/5 to-blue-500/5"
    >
      {/* Animated gradient background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-blue-500/10 opacity-50 animate-pulse" />

      <div className="relative space-y-4 p-4">
        {/* Header with Avatar */}
        <div className="flex items-start gap-3">
          {/* Coach Avatar */}
          <motion.div
            initial={{ rotate: -10, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3, type: "spring", stiffness: 200 }}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400/30 to-cyan-400/30 ring-2 ring-emerald-400/20"
          >
            <Sparkles className="h-6 w-6 text-emerald-400" />
          </motion.div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 mb-2"
            >
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-400">Your Coach</span>
            </motion.div>

            {/* Headline - Large and Prominent */}
            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="text-lg font-bold leading-tight text-white mb-1"
            >
              {coachMessage}
            </motion.h3>

            {/* Expand/Collapse Button */}
            {data?.bullets && data.bullets.length > 0 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-400/80 hover:text-emerald-400 transition-colors"
              >
                <span>{isExpanded ? 'Show less' : 'Show more'}</span>
                {isExpanded ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Bullets */}
        <AnimatePresence>
          {isExpanded && data?.bullets && data.bullets.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="border-t border-emerald-500/10 pt-3 pl-15">
                <ul className="space-y-2">
                  {data.bullets.map((bullet, idx) => (
                    <motion.li
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.1 }}
                      className="text-sm text-gray-300 pl-4 relative before:content-['→'] before:absolute before:left-0 before:text-emerald-400/60"
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
