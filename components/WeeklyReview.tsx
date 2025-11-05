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
    <Card className="space-y-3 bg-surface-1 text-text-primary">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-text-muted" aria-hidden />
          <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Week {weekNumber} Review
          </h3>
        </div>
        <button
          type="button"
          onClick={() => fetchReview()}
          disabled={isLoading}
          className="inline-flex items-center justify-center rounded-full border border-surface-border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted transition hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={`mr-1 h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} aria-hidden />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-text-muted">Analyzing your week…</p>
      ) : hasReviewData ? (
        <>
          <p className="text-sm font-semibold text-text-primary">{data?.headline}</p>
          {data?.bullets?.length ? (
            <ul className="space-y-1 text-sm text-text-secondary">
              {data.bullets.map((bullet, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="mt-[6px] h-1.5 w-1.5 flex-none rounded-full bg-text-muted" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {data?.prompts && data.prompts.length > 0 ? (
            <div className="rounded-md border border-surface-border/60 bg-surface-0 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                Focus for next week
              </p>
              <ul className="mt-1 space-y-1 text-xs text-text-secondary">
                {data.prompts.map((prompt, index) => (
                  <li key={index}>• {prompt}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : (
        <p className="text-sm text-text-secondary">
          {error ??
            `Week ${weekNumber} complete! Review your logs to track progress and plan for next week.`}
        </p>
      )}

      {error && !hasReviewData ? (
        <p className="text-xs text-text-muted">
          Showing fallback note. Tap refresh once you have a connection.
        </p>
      ) : null}
    </Card>
  );
}
