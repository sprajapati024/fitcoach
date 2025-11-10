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
  getCoachCache,
} from '@/lib/db/local';
import { queryKeys, invalidateWorkoutQueries, invalidateNutritionQueries } from './client';
import { useSyncStore } from '@/lib/store/sync';
import type { LocalWorkoutLog, LocalWorkoutLogSet, LocalMeal } from '@/lib/db/schema.local';

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
    queryKey: queryKeys.meals('current', date),
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
      // Invalidate nutrition queries
      await invalidateNutritionQueries(queryClient, {
        userId: data.userId,
        date: data.date,
      });
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
 * Get today's coach brief (with API fallback)
 */
export function useTodayCoachBrief() {
  const supabase = useSupabase();

  return useQuery({
    queryKey: queryKeys.coachToday('current'),
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Try to fetch from API (which will check cache internally)
      const response = await fetch(`/api/coach/today?u=${encodeURIComponent(user.id)}`, {
        cache: 'no-store',
      });

      if (!response.ok) {
        return null;
      }

      return response.json();
    },
    enabled: !!supabase,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Only retry once for coach data
  });
}

/**
 * Force refresh today's coach brief
 */
export function useRefreshCoachBrief() {
  const queryClient = useQueryClient();
  const supabase = useSupabase();

  return useMutation({
    mutationFn: async () => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const response = await fetch(
        `/api/coach/today?u=${encodeURIComponent(user.id)}&refresh=true`,
        {
          cache: 'no-store',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to refresh');
      }

      return response.json();
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
 * Delete a meal with optimistic updates
 */
export function useDeleteMeal() {
  const queryClient = useQueryClient();
  const supabase = useSupabase();

  return useMutation({
    mutationFn: async (mealId: string) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const response = await fetch(`/api/nutrition/meals/${mealId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete meal');
      }

      return { mealId, userId: user.id };
    },
    onSuccess: async (data) => {
      // Invalidate nutrition queries to refetch
      await queryClient.invalidateQueries({ queryKey: ['meals'] });
      await queryClient.invalidateQueries({ queryKey: ['nutritionSummary'] });
    },
  });
}
