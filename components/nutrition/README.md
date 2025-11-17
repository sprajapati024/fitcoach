# MacroRingCharts Component

A beautiful, mobile-friendly component to display daily nutrition progress as animated circular progress rings.

## Features

- **Animated SVG Rings**: Lightweight, performant circular progress indicators
- **State-based Coloring**:
  - Green (success) for ≥90% of goal
  - Amber (warning) for 50-89% of goal
  - Red (danger) for <50% of goal
- **Mobile-First Design**: Responsive grid (2 cols on mobile, 3 on tablet, 5 on desktop)
- **Overflow Indicators**: Shows when you've exceeded your goals
- **Smooth Animations**: Staggered entrance animations using Framer Motion
- **PWA Optimized**: Fast, lightweight, works offline

## Usage

```tsx
import { MacroRingCharts } from "@/components/nutrition";

function NutritionDashboard() {
  return (
    <MacroRingCharts
      calories={{ current: 1800, goal: 2000 }}
      protein={{ current: 120, goal: 150 }}
      carbs={{ current: 180, goal: 200 }}
      fat={{ current: 55, goal: 65 }}
      water={{ current: 2000, goal: 2500 }} // in mL
    />
  );
}
```

## Props

```typescript
interface MacroRingChartsProps {
  calories: { current: number; goal: number };
  protein: { current: number; goal: number };
  carbs: { current: number; goal: number };
  fat: { current: number; goal: number };
  water: { current: number; goal: number }; // in mL
}
```

## Design System

The component uses your existing design system colors:

- **Calories**: Cyan/Indigo gradient (`#06B6D4` → `#4F46E5`)
- **Protein**: Pink/Purple gradient (`#EC4899` → `#A855F7`)
- **Carbs**: Orange/Amber gradient (`#F97316` → `#F59E0B`)
- **Fat**: Yellow/Amber gradient (`#EAB308` → `#F59E0B`)
- **Water**: Cyan/Sky gradient (`#06B6D4` → `#0EA5E9`)

State colors come from the design system:
- Success: `#10b981` → `#34d399`
- Warning: `#f59e0b` → `#fbbf24`
- Error: `#ef4444` → `#f87171`

## Example with React Query

```tsx
import { MacroRingCharts } from "@/components/nutrition";
import { useNutritionSummary, useNutritionGoals } from "@/lib/query/hooks";

function NutritionView() {
  const { data: summary } = useNutritionSummary(date);
  const { data: goals } = useNutritionGoals();

  return (
    <MacroRingCharts
      calories={{
        current: summary?.totalCalories || 0,
        goal: goals?.targetCalories || 2000,
      }}
      protein={{
        current: summary?.totalProtein || 0,
        goal: goals?.targetProteinGrams || 150,
      }}
      carbs={{
        current: summary?.totalCarbs || 0,
        goal: goals?.targetCarbsGrams || 200,
      }}
      fat={{
        current: summary?.totalFat || 0,
        goal: goals?.targetFatGrams || 65,
      }}
      water={{
        current: summary?.totalWaterMl || 0,
        goal: (goals?.targetWaterLiters || 2.5) * 1000,
      }}
    />
  );
}
```

## Customization

The component is built to match your existing design system and uses:
- Tailwind CSS for styling
- Framer Motion for animations
- SVG for the circular progress rings

All animations respect `prefers-reduced-motion` for accessibility.
