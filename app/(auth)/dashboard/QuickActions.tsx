'use client';

import { useState } from 'react';
import { UtensilsCrossed, Droplets, PieChart } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MealLogger } from '@/components/MealLogger';
import { WaterLogger } from '@/components/WaterLogger';

export function QuickActions() {
  const [showMealLogger, setShowMealLogger] = useState(false);
  const [showWaterLogger, setShowWaterLogger] = useState(false);

  const handleMealLogged = () => {
    // Refresh or update UI as needed
    // The parent page should have query invalidation set up
  };

  const handleWaterLogged = () => {
    // Refresh or update UI as needed
  };

  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        {/* Log Meal Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <button
            onClick={() => setShowMealLogger(true)}
            className="flex flex-col items-center justify-center gap-2 rounded-lg border border-gray-800 bg-gray-900/50 p-4 transition active:scale-95 hover:border-gray-700 hover:bg-gray-800/50 w-full"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-700/50">
              <UtensilsCrossed className="h-5 w-5 text-white" />
            </div>
            <span className="text-xs font-semibold text-gray-300">Log Meal</span>
          </button>
        </motion.div>

        {/* Log Water Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.45 }}
        >
          <button
            onClick={() => setShowWaterLogger(true)}
            className="flex flex-col items-center justify-center gap-2 rounded-lg border border-gray-800 bg-gray-900/50 p-4 transition active:scale-95 hover:border-gray-700 hover:bg-gray-800/50 w-full"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-700/50">
              <Droplets className="h-5 w-5 text-white" />
            </div>
            <span className="text-xs font-semibold text-gray-300">Log Water</span>
          </button>
        </motion.div>

        {/* Today Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <Link
            href="/nutrition/today"
            className="flex flex-col items-center justify-center gap-2 rounded-lg border border-gray-800 bg-gray-900/50 p-4 transition active:scale-95 hover:border-gray-700 hover:bg-gray-800/50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-700/50">
              <PieChart className="h-5 w-5 text-white" />
            </div>
            <span className="text-xs font-semibold text-gray-300">Today</span>
          </Link>
        </motion.div>
      </div>

      {/* MealLogger Modal */}
      {showMealLogger && (
        <MealLogger
          onClose={() => setShowMealLogger(false)}
          onMealLogged={handleMealLogged}
        />
      )}

      {/* WaterLogger Modal */}
      {showWaterLogger && (
        <WaterLogger
          onClose={() => setShowWaterLogger(false)}
          onWaterLogged={handleWaterLogged}
        />
      )}
    </>
  );
}
