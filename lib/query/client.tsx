/**
 * React Query Configuration
 *
 * Provides caching, refetching, and optimistic updates for server state.
 *
 * Key Features:
 * - 5-minute stale time for most queries
 * - Automatic refetch on window focus (when online)
 * - Retry with exponential backoff
 * - Network-aware query behavior
 *
 * Usage:
 *   Wrap your app with <QueryProvider> in layout.tsx
 */

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, type ReactNode } from 'react';

// ============================================================================
// Query Client Configuration
// ============================================================================

/**
 * Create a new QueryClient instance with offline-aware defaults
 */
export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Stale time: How long until cached data is considered stale
        staleTime: 5 * 60 * 1000, // 5 minutes

        // Cache time: How long to keep unused data in cache
        gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)

        // Refetch behavior
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        refetchOnMount: true,

        // Retry configuration
        retry: (failureCount, error) => {
          // Don't retry on 4xx errors (client errors)
          if (error instanceof Error) {
            const status = (error as Error & { status?: number })?.status;
            if (status !== undefined && status >= 400 && status < 500) return false;
          }

          // Retry up to 3 times with exponential backoff
          return failureCount < 3;
        },

        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

        // Network mode: 'online' | 'always' | 'offlineFirst'
        // 'online': Only fetch when online
        // 'always': Fetch even when offline
        // 'offlineFirst': Try cache first, then fetch if online
        networkMode: 'online',
      },

      mutations: {
        // Mutations will pause when offline and resume when online
        networkMode: 'online',

        // Retry mutations once on failure
        retry: 1,
        retryDelay: 1000,
      },
    },
  });
}

// ============================================================================
// Query Provider Component
// ============================================================================

let browserQueryClient: QueryClient | undefined = undefined;

/**
 * Get or create a singleton QueryClient for the browser
 */
function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    // Server: always create a new query client
    return makeQueryClient();
  } else {
    // Browser: use singleton pattern
    if (!browserQueryClient) {
      browserQueryClient = makeQueryClient();
    }
    return browserQueryClient;
  }
}

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * React Query Provider Component
 *
 * Wrap your app with this component to enable React Query.
 * This should be added to the root layout.
 */
export function QueryProvider({ children }: QueryProviderProps) {
  // Use state to ensure we don't create a new client on every render
  // while still allowing SSR to work correctly
  const [queryClient] = useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Only show devtools in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom" />
      )}
    </QueryClientProvider>
  );
}

// ============================================================================
// Query Keys (centralized for consistency)
// ============================================================================

/**
 * Centralized query keys for type safety and consistency
 */
export const queryKeys = {
  // Profile
  profile: (userId: string) => ['profile', userId] as const,

  // Plans
  plans: (userId: string) => ['plans', userId] as const,
  plan: (planId: string) => ['plan', planId] as const,
  activePlan: (userId: string) => ['activePlan', userId] as const,

  // Workouts
  workout: (workoutId: string) => ['workout', workoutId] as const,
  workouts: (planId: string, weekIndex?: number) =>
    weekIndex !== undefined
      ? (['workouts', planId, weekIndex] as const)
      : (['workouts', planId] as const),
  todayWorkout: (userId: string) => ['todayWorkout', userId] as const,

  // Workout Logs
  workoutLogs: (userId: string, startDate?: string, endDate?: string) => {
    if (startDate !== undefined && endDate !== undefined) {
      return ['workoutLogs', userId, startDate, endDate] as const;
    }
    return ['workoutLogs', userId] as const;
  },
  workoutLogSets: (logId: string) => ['workoutLogSets', logId] as const,

  // Meals
  meals: (userId: string, date: string) => ['meals', userId, date] as const,

  // Coach
  coachToday: (userId: string, refresh?: boolean) =>
    refresh ? (['coachToday', userId, Date.now()] as const) : (['coachToday', userId] as const),
  coachWeekly: (userId: string, weekNumber: number) =>
    ['coachWeekly', userId, weekNumber] as const,

  // Nutrition
  nutritionGoals: (userId: string) => ['nutritionGoals', userId] as const,
  dailyNutrition: (userId: string, date: string) => ['dailyNutrition', userId, date] as const,
} as const;

// ============================================================================
// Utility: Invalidate Related Queries
// ============================================================================

/**
 * Helper to invalidate all workout-related queries after a mutation
 */
export async function invalidateWorkoutQueries(
  queryClient: QueryClient,
  { userId, planId }: { userId?: string; planId?: string }
): Promise<void> {
  const invalidations: Promise<void>[] = [];

  if (userId) {
    invalidations.push(
      queryClient.invalidateQueries({ queryKey: queryKeys.todayWorkout(userId) })
    );
    invalidations.push(
      queryClient.invalidateQueries({ queryKey: queryKeys.workoutLogs(userId) })
    );
  }

  if (planId) {
    invalidations.push(queryClient.invalidateQueries({ queryKey: queryKeys.workouts(planId) }));
  }

  await Promise.all(invalidations);
}

/**
 * Helper to invalidate nutrition queries after a mutation
 */
export async function invalidateNutritionQueries(
  queryClient: QueryClient,
  { userId, date }: { userId: string; date?: string }
): Promise<void> {
  const invalidations: Promise<void>[] = [
    queryClient.invalidateQueries({ queryKey: queryKeys.nutritionGoals(userId) }),
  ];

  if (date) {
    // Invalidate meals list (matches ['meals', date] in useMealsByDate)
    invalidations.push(
      queryClient.invalidateQueries({ queryKey: ['meals', date] })
    );
    // Invalidate nutrition summary (matches ['nutritionSummary', date] in useNutritionSummary)
    invalidations.push(
      queryClient.invalidateQueries({ queryKey: ['nutritionSummary', date] })
    );
  }

  await Promise.all(invalidations);
}
