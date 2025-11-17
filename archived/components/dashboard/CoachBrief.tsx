'use client';

import { useCallback, useEffect, useState } from 'react';
import type { CoachResponse } from '@/lib/validation';

interface CoachBriefProps {
  userId: string;
  userName?: string | null;
}

interface CoachApiResponse {
  success: boolean;
  coach?: CoachResponse;
  cached?: boolean;
  fallback?: string;
  error?: string;
}

function getTimeBasedGreeting() {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return 'Good Morning';
  } else if (hour >= 12 && hour < 18) {
    return 'Good Afternoon';
  } else {
    return 'Good Evening';
  }
}

export function CoachBrief({ userId, userName }: CoachBriefProps) {
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

  const greeting = getTimeBasedGreeting();
  const displayName = userName || 'there';
  const coachMessage = data?.headline || 'Focus on form and progressive overload. Let\'s get stronger!';

  return (
    <div className="space-y-2">
      <h2 className="text-2xl font-bold text-text-primary">
        {greeting}, {displayName}
      </h2>

      {isLoading ? (
        <div className="h-6 w-3/4 animate-pulse rounded-md bg-surface-1" />
      ) : (
        <p className="text-base text-text-secondary leading-relaxed">
          {coachMessage}
        </p>
      )}
    </div>
  );
}
