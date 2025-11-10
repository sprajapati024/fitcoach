/**
 * Sync Store Initializer Component
 *
 * Initializes the Zustand sync store on client mount.
 * This component should be included once in the root layout.
 */

'use client';

import { useEffect } from 'react';
import { initializeSyncStore } from '@/lib/store/sync';

export function SyncInitializer() {
  useEffect(() => {
    // Initialize sync store (sets up online/offline listeners, loads initial counts)
    initializeSyncStore().catch((error) => {
      console.error('[SyncInitializer] Failed to initialize sync store:', error);
    });
  }, []);

  // This component doesn't render anything
  return null;
}
