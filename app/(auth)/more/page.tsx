'use client';

import Link from "next/link";
import { Settings, Dumbbell, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const MORE_ITEMS = [
  {
    href: "/exercises",
    label: "Exercises",
    description: "Browse and manage exercise library",
    icon: Dumbbell,
  },
  {
    href: "/settings",
    label: "Settings",
    description: "App settings and preferences",
    icon: Settings,
  },
];

export default function MorePage() {
  return (
    <div className="min-h-screen bg-black -mx-4 -mt-6 -mb-32">
      {/* Header - Sticky */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-gray-800"
      >
        <div className="flex items-center justify-between h-14 px-4">
          <div>
            <h1 className="text-xl font-bold text-white">More</h1>
            <p className="text-xs text-gray-500">Additional features</p>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="mx-auto max-w-md px-3 pt-4 pb-20 space-y-3">
        {MORE_ITEMS.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + index * 0.1 }}
            >
              <Link
                href={item.href}
                className="group flex items-center gap-4 rounded-lg border border-gray-800 bg-gray-900 p-4 transition-all active:scale-95"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/10 to-indigo-600/10">
                  <Icon className="h-6 w-6 text-cyan-500" />
                </div>
                <div className="flex-1">
                  <h2 className="text-base font-semibold text-white">
                    {item.label}
                  </h2>
                  <p className="text-sm text-gray-400">{item.description}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>
          );
        })}

        {/* Spacer for bottom navigation */}
        <div className="h-20" />
      </main>
    </div>
  );
}
