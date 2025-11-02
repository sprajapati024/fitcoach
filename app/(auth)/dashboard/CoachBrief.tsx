'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card } from '@/components/Card';
import type { CoachResponse } from '@/lib/validation';
import { RefreshCw } from 'lucide-react';

interface CoachBriefProps {
  userId: string;
}

interface CoachApiResponse {
  success: boolean;
  coach?: CoachResponse;
  cached?: boolean;
  fallback?: string;
  error?: string;
}

export function CoachBrief({ userId }: CoachBriefProps) {
  const [data, setData] = useState<CoachResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBrief = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/coach/today?u=${encodeURIComponent(userId)}`, {
        method: 'GET',
        cache: 'no-store',
      });

      if (!response.ok) {
        const problem = await response.json().catch(() => ({}));
        throw new Error(problem.error || 'Unable to load coach brief.');
      }

      const payload = (await response.json()) as CoachApiResponse;

      if (!payload.coach) {
        throw new Error(payload.error || 'Coach brief unavailable.');
      }

      setData(payload.coach);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load coach brief.');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void fetchBrief();
  }, [fetchBrief]);

  const hasCoachData = !!data;

  return (
    <Card className="space-y-3 bg-bg1 text-fg0">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-fg2">Coach Note</h3>
        <button
          type="button"
          onClick={() => fetchBrief()}
          disabled={isLoading}
          className="inline-flex items-center justify-center rounded-full border border-line1 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-fg2 transition hover:text-fg0 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={`mr-1 h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} aria-hidden />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-fg2">Loading your coach brief…</p>
      ) : hasCoachData ? (
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
              <p className="text-xs font-semibold uppercase tracking-wide text-fg2">Try this</p>
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
            'Ready to train? Focus on form and progressive overload today. Let’s get stronger!'}
        </p>
      )}

      {error && !hasCoachData ? (
        <p className="text-xs text-fg2">
          Showing fallback note. Tap refresh once you have a connection.
        </p>
      ) : null}
    </Card>
  );
}
