'use client';

import { Settings, User } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface CompactHeaderProps {
  userName?: string | null;
}

export function CompactHeader({ userName }: CompactHeaderProps) {
  const initial = userName?.charAt(0).toUpperCase() || 'U';

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-50 bg-gray-950/95 backdrop-blur-sm border-b border-gray-800"
    >
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left: Avatar */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 text-xs font-bold text-white">
            {initial}
          </div>
          <span className="text-sm font-semibold text-white">FitCoach</span>
        </div>

        {/* Right: Settings */}
        <Link
          href="/settings"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 text-gray-400 transition active:scale-95 hover:bg-gray-800 hover:text-white"
        >
          <Settings className="h-4 w-4" />
        </Link>
      </div>
    </motion.header>
  );
}
