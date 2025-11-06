'use client';

import { TrendingUp, Calendar, UtensilsCrossed } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export function QuickActions() {
  const actions = [
    {
      label: 'Progress',
      icon: TrendingUp,
      href: '/progress',
      color: 'from-cyan-500 to-blue-500',
      delay: 0.4,
    },
    {
      label: 'Plan',
      icon: Calendar,
      href: '/plan',
      color: 'from-indigo-500 to-purple-500',
      delay: 0.45,
    },
    {
      label: 'Nutrition',
      icon: UtensilsCrossed,
      href: '/nutrition',
      color: 'from-orange-500 to-red-500',
      delay: 0.5,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <motion.div
            key={action.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: action.delay }}
          >
            <Link
              href={action.href}
              className="flex flex-col items-center justify-center gap-2 rounded-lg border border-gray-800 bg-gray-900/50 p-4 transition active:scale-95 hover:border-gray-700 hover:bg-gray-800/50"
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${action.color} bg-opacity-20`}
              >
                <Icon className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs font-semibold text-gray-300">{action.label}</span>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
