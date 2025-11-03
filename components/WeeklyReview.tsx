'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card } from '@/components/Card';
import type { CoachResponse } from '@/lib/validation';
import { RefreshCw, TrendingUp } from 'lucide-react';

interface WeeklyReviewProps {
  planId: string;
  weekNumber: number;
  autoLoad?: boolean;
}

interface WeeklyApiResponse {
  success: boolean;
  review?: CoachResponse;
  weekNumber?: number;
  cached?: boolean;
  fallback?: string;
  error?: string;
}

export function WeeklyReview({ planId, weekNumber, autoLoad = true }: WeeklyReviewProps) {
  const [data, setData] = useState<CoachResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReview = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const url = `/api/coach/weekly?planId=${encodeURIComponent(planId)}&weekNumber=${weekNumber}`;
      const response = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
      });

      if (!response.ok) {
        const problem = await response.json().catch(() => ({}));
        throw new Error(problem.error || 'Unable to load weekly review.');
      }

      const payload = (await response.json()) as WeeklyApiResponse;

      if (!payload.review) {
        throw new Error(payload.error || 'Weekly review unavailable.');
      }

      setData(payload.review);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load weekly review.');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [planId, weekNumber]);

  useEffect(() => {
    if (autoLoad) {
      void fetchReview();
    }
  }, [fetchReview, autoLoad]);

  const hasReviewData = !!data;

  return (
    <Card className="space-y-3 bg-bg1 text-fg0">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-fg2" aria-hidden />
          <h3 className="text-xs font-semibold uppercase tracking-wide text-fg2">
            Week {weekNumber} Review
          </h3>
        </div>
        <button
          type="button"
          onClick={() => fetchReview()}
          disabled={isLoading}
          className="inline-flex items-center justify-center rounded-full border border-line1 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-fg2 transition hover:text-fg0 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={`mr-1 h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} aria-hidden />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-fg2">Analyzing your week…</p>
      ) : hasReviewData ? (
        <>
          <p className="text-sm font-semibold text-fg0">{data?.headline}</p>
          {data?.bullets?.length ? (
            <ul className="space-y-1 text-sm text-fg1">
              {data.bullets.map((bullet, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="mt-[6px] h-1.5 w-1.5 flex-none rounded-full bg-fg2" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {data?.prompts && data.prompts.length > 0 ? (
            <div className="rounded-md border border-line1/60 bg-bg0 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-fg2">
                Focus for next week
              </p>
              <ul className="mt-1 space-y-1 text-xs text-fg1">
                {data.prompts.map((prompt, index) => (
                  <li key={index}>• {prompt}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : (
        <p className="text-sm text-fg1">
          {error ??
            `Week ${weekNumber} complete! Review your logs to track progress and plan for next week.`}
        </p>
      )}

      {error && !hasReviewData ? (
        <p className="text-xs text-fg2">
          Showing fallback note. Tap refresh once you have a connection.
        </p>
      ) : null}
    </Card>
  );
}
