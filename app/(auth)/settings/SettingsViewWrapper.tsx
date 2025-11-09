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
    <div className="min-h-screen bg-black -mx-4 -mt-6 -mb-32">
      {/* Header - Sticky */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-gray-800 md:hidden"
      >
        <div className="flex items-center justify-between h-14 px-4">
          <div>
            <h1 className="text-xl font-bold text-white">Settings</h1>
            <p className="text-xs text-gray-500">Manage your preferences</p>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="mx-auto max-w-md px-3 pt-4 pb-20">
        <SettingsView profile={profile} userPlans={userPlans} signOutAction={signOutAction} />

        {/* Spacer for bottom navigation */}
        <div className="h-20" />
      </main>
    </div>
  );
}
