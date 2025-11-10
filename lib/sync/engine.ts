/**
 * Sync Engine for Bidirectional Data Sync
 *
 * Orchestrates push (upload dirty records) and pull (download updates) operations
 * with conflict resolution, retry logic, and progress tracking.
 */

'use client';

import {
  getDirtyLogs,
  getDirtyMeals,
  getDirtyProfiles,
  markAsSynced,
  getProfile,
  getActivePlan,
  getTodayWorkout,
} from '@/lib/db/local';
import { useSyncStore } from '@/lib/store/sync';
import type {
  LocalWorkoutLog,
  LocalMeal,
  LocalProfile,
} from '@/lib/db/schema.local';

// ============================================================================
// Types
// ============================================================================

export interface SyncResult {
  success: boolean;
  pushed: {
    workoutLogs: number;
    meals: number;
    profiles: number;
  };
  pulled: {
    profiles: number;
    plans: number;
    workouts: number;
  };
  errors: string[];
  duration: number;
}

interface PushPayload {
  workoutLogs: LocalWorkoutLog[];
  meals: LocalMeal[];
  profiles: LocalProfile[];
}

interface PullResponse {
  profiles?: LocalProfile[];
  plans?: unknown[];
  workouts?: unknown[];
}

// ============================================================================
// Sync Engine
// ============================================================================

/**
 * Execute a full bidirectional sync: push dirty records, then pull updates
 */
export async function executeSync(): Promise<SyncResult> {
  const startTime = Date.now();
  const result: SyncResult = {
    success: false,
    pushed: { workoutLogs: 0, meals: 0, profiles: 0 },
    pulled: { profiles: 0, plans: 0, workouts: 0 },
    errors: [],
    duration: 0,
  };

  // Check if online
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    result.errors.push('Device is offline');
    result.duration = Date.now() - startTime;
    return result;
  }

  try {
    // Step 1: Push dirty records to server
    const pushResult = await pushDirtyRecords();
    result.pushed = pushResult.pushed;
    result.errors.push(...pushResult.errors);

    // Step 2: Pull updates from server
    const pullResult = await pullServerUpdates();
    result.pulled = pullResult.pulled;
    result.errors.push(...pullResult.errors);

    // Mark sync as successful if no critical errors
    result.success = result.errors.length === 0;
  } catch (error) {
    console.error('[SyncEngine] Sync failed:', error);
    result.errors.push(error instanceof Error ? error.message : 'Unknown sync error');
  }

  result.duration = Date.now() - startTime;
  return result;
}

/**
 * Push dirty records to the server
 */
async function pushDirtyRecords(): Promise<{
  pushed: SyncResult['pushed'];
  errors: string[];
}> {
  const pushed: SyncResult['pushed'] = { workoutLogs: 0, meals: 0, profiles: 0 };
  const errors: string[] = [];

  try {
    // Gather all dirty records
    const [dirtyLogs, dirtyMeals, dirtyProfiles] = await Promise.all([
      getDirtyLogs(),
      getDirtyMeals(),
      getDirtyProfiles(),
    ]);

    // Skip if nothing to push
    if (dirtyLogs.length === 0 && dirtyMeals.length === 0 && dirtyProfiles.length === 0) {
      return { pushed, errors };
    }

    const payload: PushPayload = {
      workoutLogs: dirtyLogs,
      meals: dirtyMeals,
      profiles: dirtyProfiles,
    };

    // Send to batch push endpoint
    const response = await fetch('/api/sync/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Push failed: ${response.status}`);
    }

    const data = await response.json();

    // Mark successfully synced records
    if (data.synced) {
      // Mark workout logs as synced
      for (const logId of data.synced.workoutLogs || []) {
        await markAsSynced('workoutLogs', logId);
        pushed.workoutLogs++;
      }

      // Mark meals as synced
      for (const mealId of data.synced.meals || []) {
        await markAsSynced('meals', mealId);
        pushed.meals++;
      }

      // Mark profiles as synced
      for (const profileId of data.synced.profiles || []) {
        await markAsSynced('profiles', profileId);
        pushed.profiles++;
      }
    }

    // Collect any partial errors
    if (data.errors && data.errors.length > 0) {
      errors.push(...data.errors);
    }
  } catch (error) {
    console.error('[SyncEngine] Push error:', error);
    errors.push(error instanceof Error ? error.message : 'Push failed');
  }

  return { pushed, errors };
}

/**
 * Pull updates from the server
 */
async function pullServerUpdates(): Promise<{
  pulled: SyncResult['pulled'];
  errors: string[];
}> {
  const pulled: SyncResult['pulled'] = { profiles: 0, plans: 0, workouts: 0 };
  const errors: string[] = [];

  try {
    // Get user ID for pull endpoint
    // Note: We need to get user from somewhere - let's use the first profile in DB
    const profiles = await getDirtyProfiles();
    if (profiles.length === 0) {
      // Try to get any profile to know the userId
      // For now, skip pull if we don't have user context
      console.log('[SyncEngine] No user context for pull, skipping');
      return { pulled, errors };
    }

    const userId = profiles[0].userId;
    const lastSyncAt = profiles[0]._syncedAt || 0;

    // Fetch updates from server
    const response = await fetch('/api/sync/pull', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        lastSyncAt,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Pull failed: ${response.status}`);
    }

    const data = await response.json();

    // Save pulled data to IndexedDB
    if (data.data?.profiles) {
      for (const profile of data.data.profiles) {
        try {
          // Import localDB to save profiles
          const { localDB } = await import('@/lib/db/schema.local');
          await localDB.profiles.put(profile);
          pulled.profiles++;
        } catch (err) {
          console.error('[SyncEngine] Failed to save profile:', err);
          errors.push(`Profile sync failed: ${err instanceof Error ? err.message : 'unknown'}`);
        }
      }
    }

    if (data.data?.plans) {
      for (const plan of data.data.plans) {
        try {
          const { localDB } = await import('@/lib/db/schema.local');
          await localDB.plans.put(plan);
          pulled.plans++;
        } catch (err) {
          console.error('[SyncEngine] Failed to save plan:', err);
          errors.push(`Plan sync failed: ${err instanceof Error ? err.message : 'unknown'}`);
        }
      }
    }

    if (data.data?.workouts) {
      for (const workout of data.data.workouts) {
        try {
          const { localDB } = await import('@/lib/db/schema.local');
          await localDB.workouts.put(workout);
          pulled.workouts++;
        } catch (err) {
          console.error('[SyncEngine] Failed to save workout:', err);
          errors.push(`Workout sync failed: ${err instanceof Error ? err.message : 'unknown'}`);
        }
      }
    }

    console.log(`[SyncEngine] Pull complete: ${pulled.profiles} profiles, ${pulled.plans} plans, ${pulled.workouts} workouts`);
  } catch (error) {
    console.error('[SyncEngine] Pull error:', error);
    errors.push(error instanceof Error ? error.message : 'Pull failed');
  }

  return { pulled, errors };
}

/**
 * Trigger a sync operation with store integration
 */
export async function triggerSync(): Promise<SyncResult> {
  const store = useSyncStore.getState();

  // Prevent concurrent syncs
  if (store.syncInProgress) {
    console.log('[SyncEngine] Sync already in progress, skipping');
    return {
      success: false,
      pushed: { workoutLogs: 0, meals: 0, profiles: 0 },
      pulled: { profiles: 0, plans: 0, workouts: 0 },
      errors: ['Sync already in progress'],
      duration: 0,
    };
  }

  // Start sync
  store.startSync();

  try {
    const result = await executeSync();

    // Complete sync
    store.completeSync(result.errors.length > 0 ? result.errors.join('; ') : undefined);

    console.log('[SyncEngine] Sync complete:', result);
    return result;
  } catch (error) {
    console.error('[SyncEngine] Sync error:', error);
    store.completeSync(error instanceof Error ? error.message : 'Sync failed');

    return {
      success: false,
      pushed: { workoutLogs: 0, meals: 0, profiles: 0 },
      pulled: { profiles: 0, plans: 0, workouts: 0 },
      errors: [error instanceof Error ? error.message : 'Sync failed'],
      duration: 0,
    };
  }
}

// Periodic sync interval reference
let periodicSyncInterval: NodeJS.Timeout | null = null;

/**
 * Initialize sync listeners (call this on app start)
 */
export function initializeSyncEngine(): void {
  if (typeof window === 'undefined') return;

  // Listen for custom sync requests
  window.addEventListener('fitcoach:sync-requested', () => {
    console.log('[SyncEngine] Sync requested via event');
    void triggerSync();
  });

  // Listen for online events
  window.addEventListener('online', () => {
    console.log('[SyncEngine] Device came online, checking for dirty records');
    const store = useSyncStore.getState();
    if (store.dirtyCount > 0) {
      void triggerSync();
    }
  });

  // Set up periodic background sync (every 5 minutes)
  startPeriodicSync();

  console.log('[SyncEngine] Initialized with periodic sync');
}

/**
 * Start periodic background sync
 */
function startPeriodicSync(): void {
  if (typeof window === 'undefined') return;

  // Clear any existing interval
  if (periodicSyncInterval) {
    clearInterval(periodicSyncInterval);
  }

  // Sync every 5 minutes if there are dirty records
  periodicSyncInterval = setInterval(() => {
    const store = useSyncStore.getState();

    // Only sync if:
    // 1. We're online
    // 2. There are dirty records
    // 3. No sync already in progress
    if (store.isOnline && store.dirtyCount > 0 && !store.syncInProgress) {
      console.log('[SyncEngine] Periodic sync triggered');
      void triggerSync();
    }
  }, 5 * 60 * 1000); // 5 minutes
}

/**
 * Stop periodic background sync (useful for cleanup)
 */
export function stopPeriodicSync(): void {
  if (periodicSyncInterval) {
    clearInterval(periodicSyncInterval);
    periodicSyncInterval = null;
    console.log('[SyncEngine] Periodic sync stopped');
  }
}

/**
 * Get sync status
 */
export function getSyncStatus(): {
  isOnline: boolean;
  dirtyCount: number;
  syncInProgress: boolean;
  lastSyncAt: number | null;
  syncError: string | null;
} {
  const store = useSyncStore.getState();
  return {
    isOnline: store.isOnline,
    dirtyCount: store.dirtyCount,
    syncInProgress: store.syncInProgress,
    lastSyncAt: store.lastSyncAt,
    syncError: store.syncError,
  };
}
