'use client';

import { type ReactNode, createContext, useContext, useState, useEffect } from 'react';
import type { SupabaseClient, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { initializeJWTCache, clearSessionCache } from '@/lib/auth/cache';

const SupabaseContext = createContext<SupabaseClient | null | undefined>(undefined);

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

  useEffect(() => {
    // Only create the client on the client side
    const client = createSupabaseBrowserClient();
    setSupabase(client);

    // Set up auth state change listener to cache JWT
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (event === 'SIGNED_IN' && session) {
        // Cache the session for offline access
        initializeJWTCache(session);
      } else if (event === 'SIGNED_OUT') {
        // Clear cached session on sign out
        clearSessionCache();
      } else if (event === 'TOKEN_REFRESHED' && session) {
        // Update cache when token is refreshed
        initializeJWTCache(session);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return <SupabaseContext.Provider value={supabase}>{children}</SupabaseContext.Provider>;
}

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
}
