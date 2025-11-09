'use client';

import { motion } from 'framer-motion';
import { SettingsView } from './SettingsView';
import type { profiles, plans } from '@/drizzle/schema';

type Profile = typeof profiles.$inferSelect;
type Plan = typeof plans.$inferSelect;

interface SettingsViewWrapperProps {
  profile: Profile | null;
  userPlans: Plan[];
  signOutAction: () => Promise<void>;
}

export function SettingsViewWrapper({
  profile,
  userPlans,
  signOutAction,
}: SettingsViewWrapperProps) {
  return (
    <div className="min-h-screen bg-black -mx-4 -mt-6">
      {/* Main Content */}
      <main className="mx-auto max-w-md px-3 pt-4 pb-24">
        <SettingsView profile={profile} userPlans={userPlans} signOutAction={signOutAction} />

        {/* Spacer for bottom navigation */}
        <div className="h-20" />
      </main>
    </div>
  );
}
