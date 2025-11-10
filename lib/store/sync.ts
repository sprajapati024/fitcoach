/**
 * Zustand Store: Sync State Management
 *
 * Manages global sync state for offline-first functionality:
 * - Online/offline status
 * - Dirty record count (unsyncced changes)
 * - Last sync timestamp
 * - Sync progress indicators
 *
 * Usage:
 *   import { useSyncStore } from '@/lib/store/sync';
 *
 *   function MyComponent() {
 *     const { isOnline, dirtyCount, syncInProgress } = useSyncStore();
 *     return <div>Unsynced: {dirtyCount}</div>;
 *   }
 */

import * as React from 'react';
import { create } from 'zustand';
import { getDirtyRecordCount, getLastSyncTimestamp } from '@/lib/db/schema.local';

// ============================================================================
// Sync Store Interface
// ============================================================================

interface SyncStore {
  // Network Status
  isOnline: boolean;
  setOnline: (online: boolean) => void;

  // Dirty Records (unsyncced changes)
  dirtyCount: number;
  updateDirtyCount: () => Promise<void>;

  // Sync Status
  syncInProgress: boolean;
  lastSyncAt: number | null;
  syncError: string | null;

  // Sync Actions
  startSync: () => void;
  completeSync: (error?: string) => void;
  updateLastSyncTimestamp: () => Promise<void>;

  // Initialization
  initialize: () => Promise<void>;
}

// ============================================================================
// Zustand Store
// ============================================================================

export const useSyncStore = create<SyncStore>((set, get) => ({
  // Initial State
  isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
  dirtyCount: 0,
  syncInProgress: false,
  lastSyncAt: null,
  syncError: null,

  // Set online status
  setOnline: (online: boolean) => {
    set({ isOnline: online });

    // Auto-trigger sync when coming back online with dirty records
    if (online && get().dirtyCount > 0 && !get().syncInProgress) {
      // Trigger sync via event (handled by sync engine in Phase 4)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('fitcoach:sync-requested'));
      }
    }
  },

  // Update dirty record count from IndexedDB
  updateDirtyCount: async () => {
    try {
      const count = await getDirtyRecordCount();
      set({ dirtyCount: count });
    } catch (error) {
      console.error('[SyncStore] Failed to update dirty count:', error);
    }
  },

  // Start sync process
  startSync: () => {
    set({ syncInProgress: true, syncError: null });
  },

  // Complete sync process
  completeSync: (error?: string) => {
    set({
      syncInProgress: false,
      syncError: error || null,
    });

    // Refresh dirty count after sync
    get().updateDirtyCount();

    // Update last sync timestamp
    if (!error) {
      get().updateLastSyncTimestamp();
    }
  },

  // Update last sync timestamp from IndexedDB
  updateLastSyncTimestamp: async () => {
    try {
      const timestamp = await getLastSyncTimestamp();
      set({ lastSyncAt: timestamp });
    } catch (error) {
      console.error('[SyncStore] Failed to update last sync timestamp:', error);
    }
  },

  // Initialize store (call on app mount)
  initialize: async () => {
    // Set up online/offline listeners
    if (typeof window !== 'undefined') {
      const handleOnline = () => get().setOnline(true);
      const handleOffline = () => get().setOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // Initial data load
      await get().updateDirtyCount();
      await get().updateLastSyncTimestamp();
    }
  },
}));

// ============================================================================
// Hooks for Common Use Cases
// ============================================================================

/**
 * Hook to get just the online status
 */
export function useOnlineStatus(): boolean {
  return useSyncStore((state) => state.isOnline);
}

/**
 * Hook to get dirty count (unsynced changes)
 */
export function useDirtyCount(): number {
  return useSyncStore((state) => state.dirtyCount);
}

/**
 * Hook to get sync progress state
 */
export function useSyncProgress(): { inProgress: boolean; error: string | null } {
  return useSyncStore((state) => ({
    inProgress: state.syncInProgress,
    error: state.syncError,
  }));
}

/**
 * Hook to get last sync info
 */
export function useLastSync(): { timestamp: number | null; formattedTime: string } {
  const lastSyncAt = useSyncStore((state) => state.lastSyncAt);

  // Use a state to store the current time for formatting (updates every minute)
  const [currentTime, setCurrentTime] = React.useState(() => Date.now());

  React.useEffect(() => {
    // Update current time every minute to refresh relative timestamps
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000); // 1 minute

    return () => clearInterval(interval);
  }, []);

  let formattedTime = 'Never';
  if (lastSyncAt) {
    const diff = currentTime - lastSyncAt;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) formattedTime = `${days}d ago`;
    else if (hours > 0) formattedTime = `${hours}h ago`;
    else if (minutes > 0) formattedTime = `${minutes}m ago`;
    else formattedTime = 'Just now';
  }

  return { timestamp: lastSyncAt, formattedTime };
}

// ============================================================================
// Utility: Initialize Store on Client
// ============================================================================

/**
 * Call this in root layout or _app to initialize sync store
 */
export async function initializeSyncStore(): Promise<void> {
  if (typeof window !== 'undefined') {
    await useSyncStore.getState().initialize();
  }
}
