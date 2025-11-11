/**
 * React Query Hooks for Offline-First Data Access
 *
 * These hooks provide a declarative API for accessing data with:
 * - Automatic caching via React Query
 * - Offline-first reads from IndexedDB
 * - Optimistic updates for mutations
 * - Background refetching when online
 *
 * Usage:
 *   const { data: workout, isLoading } = useTodayWorkout(userId);
 *   const mutation = useLogWorkout();
 *   mutation.mutate(logData);
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import {
  getTodayWorkout,
  getWorkout,
  getWorkoutsByPlanAndWeek,
  saveWorkoutLog,
  saveWorkoutLogSets,
  getActivePlan,
  getProfile,
  getMealsByDate,
  saveMeal,
  deleteMeal,
  saveWaterLog,
  getCoachCache,
} from '@/lib/db/local';
import { queryKeys, invalidateWorkoutQueries, invalidateNutritionQueries } from './client';
import { useSyncStore } from '@/lib/store/sync';
import type { LocalWorkoutLog, LocalWorkoutLogSet, LocalMeal, LocalWaterLog } from '@/lib/db/schema.local';
import { getCachedResponse, setCachedResponse } from '@/lib/ai/cache';
import { generateFallbackBrief, generateErrorFallback } from '@/lib/ai/fallbacks';
import { enqueuePrompt } from '@/lib/sync/ai-queue';
import type { CoachResponse } from '@/lib/validation';

// ============================================================================
// Profile Hooks
// ============================================================================

/**
 * Get current user's profile
 */
export function useProfile() {
  const supabase = useSupabase();

  return useQuery({
    queryKey: queryKeys.profile('current'),
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      return getProfile(user.id);
    },
    enabled: !!supabase,
    staleTime: 10 * 60 * 1000, // 10 minutes (profile changes infrequently)
  });
}

// ============================================================================
// Plan Hooks
// ============================================================================

/**
 * Get user's active plan
 */
export function useActivePlan() {
  const supabase = useSupabase();

  return useQuery({
    queryKey: queryKeys.activePlan('current'),
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      return getActivePlan(user.id);
    },
    enabled: !!supabase,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ============================================================================
// Workout Hooks
// ============================================================================

/**
 * Get today's scheduled workout
 */
export function useTodayWorkout() {
  const supabase = useSupabase();

  return useQuery({
    queryKey: queryKeys.todayWorkout('current'),
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      return getTodayWorkout(user.id);
    },
    enabled: !!supabase,
    staleTime: 2 * 60 * 1000, // 2 minutes (refresh frequently for today's workout)
  });
}

/**
 * Get a specific workout by ID
 */
export function useWorkout(workoutId: string | null) {
  return useQuery({
    queryKey: queryKeys.workout(workoutId || ''),
    queryFn: () => {
      if (!workoutId) throw new Error('Workout ID required');
      return getWorkout(workoutId);
    },
    enabled: !!workoutId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get workouts for a specific plan and week
 */
export function useWorkoutsByWeek(planId: string | null, weekIndex: number) {
  return useQuery({
    queryKey: queryKeys.workouts(planId || '', weekIndex),
    queryFn: () => {
      if (!planId) throw new Error('Plan ID required');
      return getWorkoutsByPlanAndWeek(planId, weekIndex);
    },
    enabled: !!planId,
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================================================
// Workout Log Mutations (Offline-First)
// ============================================================================

type LogWorkoutInput = Omit<
  LocalWorkoutLog,
  'id' | 'createdAt' | '_isDirty' | '_syncedAt'
> & {
  sets: Array<Omit<LocalWorkoutLogSet, 'id' | 'logId' | 'createdAt' | '_isDirty' | '_syncedAt'>>;
};

/**
 * Log a workout with optimistic updates
 */
export function useLogWorkout() {
  const queryClient = useQueryClient();
  const supabase = useSupabase();
  const { updateDirtyCount } = useSyncStore();

  return useMutation({
    mutationFn: async (input: LogWorkoutInput) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { sets, ...logData } = input;

      // Save log to IndexedDB (marked as dirty)
      const logId = await saveWorkoutLog(logData);

      // Save sets
      await saveWorkoutLogSets(logId, sets);

      // Update dirty count in sync store
      await updateDirtyCount();

      return { logId, userId: user.id, planId: logData.planId };
    },
    onSuccess: async (data) => {
      // Invalidate related queries
      await invalidateWorkoutQueries(queryClient, {
        userId: data.userId,
        planId: data.planId,
      });

      // Trigger sync to push dirty records to server
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('fitcoach:sync-requested'));
      }
    },
  });
}

// ============================================================================
// Meal Hooks
// ============================================================================

/**
 * Get meals for a specific date
 */
export function useMealsByDate(date: string) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ['meals', date], // Simplified to match invalidation
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      return getMealsByDate(user.id, date);
    },
    enabled: !!supabase,
    staleTime: 1 * 60 * 1000, // 1 minute (meals change frequently)
  });
}

/**
 * Log a meal with optimistic updates
 */
export function useLogMeal() {
  const queryClient = useQueryClient();
  const supabase = useSupabase();
  const { updateDirtyCount } = useSyncStore();

  return useMutation({
    mutationFn: async (input: Omit<LocalMeal, 'id' | 'createdAt' | '_isDirty' | '_syncedAt'>) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Save meal to IndexedDB (marked as dirty)
      const mealId = await saveMeal(input);

      // Update dirty count in sync store
      await updateDirtyCount();

      return { mealId, userId: user.id, date: input.mealDate };
    },
    onSuccess: async (data) => {
      // Invalidate and refetch nutrition queries to immediately update UI
      await invalidateNutritionQueries(queryClient, {
        userId: data.userId,
        date: data.date,
      });

      // Force refetch meals for this date
      await queryClient.refetchQueries({
        queryKey: ['meals', data.date],
        exact: true
      });

      // Trigger sync to push dirty records to server
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('fitcoach:sync-requested'));
      }
    },
  });
}

// ============================================================================
// Coach Cache Hooks
// ============================================================================

/**
 * Get cached coach response
 */
export function useCoachCache(context: string, cacheKey: string) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ['coachCache', context, cacheKey],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      return getCoachCache(user.id, context, cacheKey);
    },
    enabled: !!supabase,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get today's coach brief (with offline-first caching and fallbacks)
 */
export function useTodayCoachBrief() {
  const supabase = useSupabase();
  const isOnline = useSyncStore((state) => state.isOnline);

  return useQuery({
    queryKey: queryKeys.coachToday('current'),
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const today = new Date().toISOString().split('T')[0];
      const cacheKey = `${today}-coach-brief`;

      // Step 1: Try IndexedDB cache first (works offline)
      const cached = await getCachedResponse<CoachResponse>(
        user.id,
        'today',
        cacheKey,
        60 // 60 minute TTL
      );

      if (cached) {
        return {
          success: true,
          coach: cached,
          cached: true,
          source: 'indexeddb',
        };
      }

      // Step 2: If online, fetch from API
      if (isOnline) {
        try {
          const response = await fetch(`/api/coach/today?u=${encodeURIComponent(user.id)}`, {
            cache: 'no-store',
          });

          if (response.ok) {
            const data = await response.json();

            // Cache the response in IndexedDB for offline access
            if (data.coach) {
              await setCachedResponse(user.id, null, 'today', cacheKey, data.coach, today);
            }

            return data;
          }
        } catch (error) {
          console.warn('[CoachBrief] API fetch failed:', error);
          // Fall through to offline fallback
        }
      }

      // Step 3: Generate offline fallback
      const fallbackResponse = isOnline
        ? generateErrorFallback('API unavailable', false)
        : generateErrorFallback('Offline mode', true);

      return {
        success: true,
        coach: fallbackResponse,
        cached: false,
        fallback: true,
        source: 'offline-fallback',
      };
    },
    enabled: !!supabase,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Only retry once for coach data
  });
}

/**
 * Force refresh today's coach brief (with offline queuing)
 */
export function useRefreshCoachBrief() {
  const queryClient = useQueryClient();
  const supabase = useSupabase();
  const isOnline = useSyncStore((state) => state.isOnline);

  return useMutation({
    mutationFn: async () => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // If offline, queue the request for later
      if (!isOnline) {
        const today = new Date().toISOString().split('T')[0];
        enqueuePrompt(
          user.id,
          'coach-today-refresh',
          'System: You are a fitness coach providing daily guidance.',
          `Generate today's brief for ${today}`,
          '/api/coach/today?refresh=true'
        );

        // Return a queued response
        return {
          success: true,
          queued: true,
          coach: generateErrorFallback('Queued for sync', true),
        };
      }

      // If online, fetch fresh data
      const response = await fetch(
        `/api/coach/today?u=${encodeURIComponent(user.id)}&refresh=true`,
        {
          cache: 'no-store',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to refresh');
      }

      const data = await response.json();

      // Update IndexedDB cache
      if (data.coach) {
        const today = new Date().toISOString().split('T')[0];
        const cacheKey = `${today}-coach-brief`;
        await setCachedResponse(user.id, null, 'today', cacheKey, data.coach, today);
      }

      return data;
    },
    onSuccess: (data) => {
      // Update the query data with the refreshed coach brief
      queryClient.setQueryData(queryKeys.coachToday('current'), data);
    },
  });
}

// ============================================================================
// Sync Status Hooks
// ============================================================================

/**
 * Hook to monitor online/offline status
 */
export function useOnlineStatus() {
  const isOnline = useSyncStore((state) => state.isOnline);
  return isOnline;
}

/**
 * Hook to monitor unsynced changes count
 */
export function useUnsyncedCount() {
  const dirtyCount = useSyncStore((state) => state.dirtyCount);
  return dirtyCount;
}

/**
 * Hook to monitor sync progress
 */
export function useSyncStatus() {
  const syncInProgress = useSyncStore((state) => state.syncInProgress);
  const syncError = useSyncStore((state) => state.syncError);
  const lastSyncAt = useSyncStore((state) => state.lastSyncAt);

  return {
    inProgress: syncInProgress,
    error: syncError,
    lastSyncAt,
  };
}

// ============================================================================
// Workout Stats & History Hooks
// ============================================================================

/**
 * Get workout statistics (session history and PRs)
 */
export function useWorkoutStats(workoutId: string | null) {
  return useQuery({
    queryKey: ['workoutStats', workoutId],
    queryFn: async () => {
      if (!workoutId) throw new Error('Workout ID required');
      const response = await fetch(`/api/workouts/${workoutId}/stats`);
      if (!response.ok) {
        throw new Error('Failed to fetch workout stats');
      }
      return response.json();
    },
    enabled: !!workoutId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get workout history (last session data for pre-filling)
 */
export function useWorkoutHistory(workoutId: string | null) {
  return useQuery({
    queryKey: ['workoutHistory', workoutId],
    queryFn: async () => {
      if (!workoutId) throw new Error('Workout ID required');
      const response = await fetch(`/api/workouts/${workoutId}/history`);
      if (!response.ok) {
        throw new Error('Failed to fetch workout history');
      }
      return response.json();
    },
    enabled: !!workoutId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// ============================================================================
// Nutrition Summary & Goals Hooks
// ============================================================================

/**
 * Get nutrition summary for a specific date
 */
export function useNutritionSummary(date: string) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ['nutritionSummary', date],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const response = await fetch(`/api/nutrition/summary?date=${date}`);
      if (!response.ok) {
        throw new Error('Failed to fetch nutrition summary');
      }
      const data = await response.json();
      return data.summary || {
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        totalWaterMl: 0,
      };
    },
    enabled: !!supabase,
    staleTime: 1 * 60 * 1000, // 1 minute (nutrition changes frequently)
  });
}

/**
 * Get user's nutrition goals
 */
export function useNutritionGoals() {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ['nutritionGoals', 'current'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const response = await fetch('/api/nutrition/goals');
      if (!response.ok) {
        throw new Error('Failed to fetch nutrition goals');
      }
      const data = await response.json();
      return data.goals;
    },
    enabled: !!supabase,
    staleTime: 10 * 60 * 1000, // 10 minutes (goals change infrequently)
  });
}

/**
 * Delete a meal with offline-first support
 */
export function useDeleteMeal() {
  const queryClient = useQueryClient();
  const supabase = useSupabase();
  const { updateDirtyCount } = useSyncStore();

  return useMutation({
    mutationFn: async (mealId: string) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Soft delete in IndexedDB (marked as dirty)
      await deleteMeal(mealId);

      // Update dirty count in sync store
      await updateDirtyCount();

      return { mealId, userId: user.id };
    },
    onSuccess: async (data) => {
      // Invalidate and refetch nutrition queries
      await queryClient.invalidateQueries({ queryKey: ['meals'] });
      await queryClient.invalidateQueries({ queryKey: ['nutritionSummary'] });

      // Force refetch all meals queries to update UI immediately
      await queryClient.refetchQueries({ queryKey: ['meals'] });

      // Trigger sync to push deletion to server
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('fitcoach:sync-requested'));
      }
    },
  });
}

/**
 * Log water with offline-first support
 */
export function useLogWater() {
  const queryClient = useQueryClient();
  const supabase = useSupabase();
  const { updateDirtyCount } = useSyncStore();

  return useMutation({
    mutationFn: async (input: Omit<LocalWaterLog, 'id' | 'loggedAt' | '_isDirty' | '_syncedAt'>) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Save water log to IndexedDB (marked as dirty)
      const logId = await saveWaterLog(input);

      // Update dirty count in sync store
      await updateDirtyCount();

      return { logId, userId: user.id, date: input.logDate };
    },
    onSuccess: async (data) => {
      // Invalidate and refetch nutrition queries
      await queryClient.invalidateQueries({ queryKey: ['nutritionSummary'] });

      // Force refetch nutrition summary to update UI immediately
      await queryClient.refetchQueries({ queryKey: ['nutritionSummary', data.date] });

      // Trigger sync to push water log to server
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('fitcoach:sync-requested'));
      }
    },
  });
}
