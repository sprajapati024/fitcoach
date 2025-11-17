"use client";

import { motion } from "framer-motion";

interface MacroRingChartsProps {
  calories: { current: number; goal: number };
  protein: { current: number; goal: number };
  carbs: { current: number; goal: number };
  fat: { current: number; goal: number };
  water: { current: number; goal: number }; // in mL
}

interface MacroRingProps {
  label: string;
  current: number;
  goal: number;
  unit: string;
  color: {
    from: string;
    to: string;
    bg: string;
    text: string;
  };
  delay?: number;
}

function MacroRing({ label, current, goal, unit, color, delay = 0 }: MacroRingProps) {
  // Calculate percentage
  const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  const isOverGoal = current > goal;
  const actualPercentage = goal > 0 ? (current / goal) * 100 : 0;

  // Determine state color based on percentage
  const getStateColor = () => {
    if (percentage >= 90) {
      return {
        stroke: "url(#gradient-success)",
        textColor: "text-success",
        bg: "bg-success/10",
      };
    } else if (percentage >= 50) {
      return {
        stroke: "url(#gradient-warning)",
        textColor: "text-warning",
        bg: "bg-warning/10",
      };
    } else {
      return {
        stroke: "url(#gradient-error)",
        textColor: "text-error",
        bg: "bg-error/10",
      };
    }
  };

  const stateColor = getStateColor();

  // SVG circle configuration
  const size = 120;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
      className="flex flex-col items-center"
    >
      {/* Ring Container */}
      <div className="relative mb-3">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Define gradients */}
          <defs>
            {/* Base color gradients */}
            <linearGradient id={`gradient-${label}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color.from} />
              <stop offset="100%" stopColor={color.to} />
            </linearGradient>

            {/* State-based gradients */}
            <linearGradient id="gradient-success" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
            <linearGradient id="gradient-warning" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>
            <linearGradient id="gradient-error" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#f87171" />
            </linearGradient>
          </defs>

          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#242729"
            strokeWidth={strokeWidth}
            fill="none"
          />

          {/* Progress circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={stateColor.stroke}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, delay: delay + 0.2, ease: "easeOut" }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: delay + 0.4 }}
            className="text-center"
          >
            <div className={`text-2xl font-bold ${stateColor.textColor}`}>
              {Math.round(percentage)}%
            </div>
            <div className="text-xs text-text-muted mt-0.5">
              {current.toFixed(current < 10 ? 1 : 0)}
              {unit}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Label and stats */}
      <div className="text-center">
        <h3 className="text-sm font-semibold text-text-primary mb-1">{label}</h3>
        <div className="flex items-center gap-1.5 text-xs">
          <span className={stateColor.textColor}>
            {current.toFixed(current < 10 ? 1 : 0)}
          </span>
          <span className="text-text-muted">/</span>
          <span className="text-text-secondary">
            {goal.toFixed(goal < 10 ? 1 : 0)}
            {unit}
          </span>
        </div>

        {/* Overflow indicator */}
        {isOverGoal && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 px-2 py-0.5 rounded-full bg-error/10 border border-error/30"
          >
            <span className="text-[10px] font-medium text-error">
              +{(current - goal).toFixed(0)}{unit} over
            </span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export function MacroRingCharts({
  calories,
  protein,
  carbs,
  fat,
  water,
}: MacroRingChartsProps) {
  // Convert water from mL to L for display
  const waterL = {
    current: water.current / 1000,
    goal: water.goal / 1000,
  };

  const macros = [
    {
      label: "Calories",
      current: calories.current,
      goal: calories.goal,
      unit: "",
      color: {
        from: "#06B6D4", // cyan-500
        to: "#4F46E5", // indigo-600
        bg: "bg-cyan-500/10",
        text: "text-cyan-400",
      },
    },
    {
      label: "Protein",
      current: protein.current,
      goal: protein.goal,
      unit: "g",
      color: {
        from: "#EC4899", // pink-500
        to: "#A855F7", // purple-500
        bg: "bg-pink-500/10",
        text: "text-pink-400",
      },
    },
    {
      label: "Carbs",
      current: carbs.current,
      goal: carbs.goal,
      unit: "g",
      color: {
        from: "#F97316", // orange-500
        to: "#F59E0B", // amber-500
        bg: "bg-orange-500/10",
        text: "text-orange-400",
      },
    },
    {
      label: "Fat",
      current: fat.current,
      goal: fat.goal,
      unit: "g",
      color: {
        from: "#EAB308", // yellow-500
        to: "#F59E0B", // amber-500
        bg: "bg-yellow-500/10",
        text: "text-yellow-400",
      },
    },
    {
      label: "Water",
      current: waterL.current,
      goal: waterL.goal,
      unit: "L",
      color: {
        from: "#06B6D4", // cyan-500
        to: "#0EA5E9", // sky-500
        bg: "bg-cyan-500/10",
        text: "text-cyan-400",
      },
    },
  ];

  return (
    <div className="w-full">
      {/* Grid: 2 cols on mobile, 3 on tablet, 5 on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-4">
        {macros.map((macro, index) => (
          <MacroRing
            key={macro.label}
            label={macro.label}
            current={macro.current}
            goal={macro.goal}
            unit={macro.unit}
            color={macro.color}
            delay={index * 0.1}
          />
        ))}
      </div>
    </div>
  );
}
