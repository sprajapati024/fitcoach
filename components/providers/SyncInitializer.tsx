/**
 * Sync Store Initializer Component
 *
 * Initializes the Zustand sync store and sync engine on client mount.
 * This component should be included once in the root layout.
 */

'use client';

import { useEffect } from 'react';
import { initializeSyncStore } from '@/lib/store/sync';
import { initializeSyncEngine } from '@/lib/sync/engine';

export function SyncInitializer() {
  useEffect(() => {
    // Initialize sync store (sets up online/offline listeners, loads initial counts)
    initializeSyncStore().catch((error) => {
      console.error('[SyncInitializer] Failed to initialize sync store:', error);
    });

    // Initialize sync engine (sets up sync event listeners)
    initializeSyncEngine();
  }, []);

  // This component doesn't render anything
  return null;
}
