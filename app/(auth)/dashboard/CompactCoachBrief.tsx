'use client';

import { useState, useCallback, useEffect } from 'react';
import { ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CoachResponse } from '@/lib/validation';

interface CompactCoachBriefProps {
  userId: string;
}

interface CoachApiResponse {
  success: boolean;
  coach?: CoachResponse;
  cached?: boolean;
  fallback?: string;
  error?: string;
}

export function CompactCoachBrief({ userId }: CompactCoachBriefProps) {
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

  const coachMessage = data?.headline || 'Focus on form and progressive overload. Let\'s get stronger!';

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.55 }}
        className="rounded-lg border border-gray-800 bg-gray-900/50 p-3"
      >
        <div className="h-10 w-full animate-pulse rounded-md bg-gray-800" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.55 }}
      className="rounded-lg border border-gray-800 bg-gray-900/50 overflow-hidden"
    >
      {/* Header (Always Visible) */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-3 transition active:bg-gray-800/50"
      >
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-cyan-500" />
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Coach Says</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        )}
      </button>

      {/* Collapsible Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-800"
          >
            <div className="p-3 pt-2">
              <p className="text-xs leading-relaxed text-gray-300">{coachMessage}</p>

              {data?.bullets && data.bullets.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {data.bullets.map((bullet, idx) => (
                    <li key={idx} className="text-xs text-gray-400 pl-3 relative before:content-['•'] before:absolute before:left-0">
                      {bullet}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
