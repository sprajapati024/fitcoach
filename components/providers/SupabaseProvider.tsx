'use client';

import { type ReactNode, createContext, useContext, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';

const SupabaseContext = createContext<SupabaseClient | null>(null);

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const [supabase] = useState<SupabaseClient>(() => createSupabaseBrowserClient());

  return <SupabaseContext.Provider value={supabase}>{children}</SupabaseContext.Provider>;
}

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (context === null) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
}
