# FitCoach UI Consistency Guide

This guide documents the standardized patterns and components for maintaining UI/UX consistency across the FitCoach app.

## 📦 New Components

### Toast Notifications
**Location:** `/components/Toast.tsx`

Global toast notification system with context provider.

```tsx
import { useToast } from '@/components/Toast';

function MyComponent() {
  const { success, error, warning, info } = useToast();

  // Usage
  success('Workout logged!', 'Your progress has been saved');
  error('Failed to save', 'Please try again');
  warning('Network unstable', 'Some features may be limited');
  info('Tip', 'Try logging your meals for better insights');
}
```

**Features:**
- 4 types: success, error, warning, info
- Auto-dismiss after 5 seconds (configurable)
- Manual dismiss with X button
- Stacks multiple toasts
- Accessible with ARIA attributes

### Tooltip
**Location:** `/components/Tooltip.tsx`

Accessible tooltip component with positioning.

```tsx
import { Tooltip } from '@/components/Tooltip';

<Tooltip content="This explains the feature" side="top">
  <button>Hover me</button>
</Tooltip>
```

**Props:**
- `content`: string | ReactNode
- `side`: 'top' | 'bottom' | 'left' | 'right'
- `delayDuration`: number (default: 200ms)

### Form Components
**Location:** `/components/FormError.tsx`

Standardized form field, input, textarea, and error components.

```tsx
import { FormField, Input, Textarea, FormError } from '@/components/FormError';

<FormField
  label="Email"
  error={errors.email}
  hint="We'll never share your email"
  required
>
  <Input
    type="email"
    placeholder="you@example.com"
    error={!!errors.email}
  />
</FormField>
```

**Features:**
- Consistent error styling
- Built-in hint text support
- Required field indicators
- Pre-styled Input and Textarea components

### Empty State
**Location:** `/components/EmptyState.tsx`

Consistent pattern for "no data" screens.

```tsx
import { EmptyState } from '@/components/EmptyState';
import { Dumbbell } from 'lucide-react';

<EmptyState
  icon={Dumbbell}
  title="No workouts yet"
  description="Start by creating your first workout plan"
  action={{
    label: 'Create Plan',
    onClick: () => router.push('/plan')
  }}
/>
```

### Loading Skeletons
**Location:** `/components/Skeleton.tsx`

Pre-built skeleton loaders for common patterns.

```tsx
import { Skeleton, SkeletonCard, SkeletonWorkoutCard, SkeletonMealCard, SkeletonStats, SkeletonList } from '@/components/Skeleton';

// Basic skeleton
<Skeleton className="h-4 w-32" />

// Pre-built patterns
<SkeletonCard />
<SkeletonWorkoutCard />
<SkeletonMealCard />
<SkeletonStats />
<SkeletonList count={5} />
```

## 🎨 Design Token System

### Colors (CSS Variables)

#### Surface Layers
```css
--surface-0: #0B0D0E (Base background)
--surface-1: #111315 (Cards, elevated)
--surface-2: #16191B (Nested, hover)
--surface-border: #242729 (Borders, dividers)
```

**Usage:**
```tsx
<div className="bg-surface-0">       // Page background
<div className="bg-surface-1">       // Cards
<div className="bg-surface-2">       // Nested cards, hover states
<div className="border-surface-border"> // All borders
```

#### Text Hierarchy
```css
--text-primary: #F1F5F9 (Main content)
--text-secondary: #A3A3A3 (Supporting text)
--text-muted: #6B7280 (Disabled, subtle)
```

**Usage:**
```tsx
<h1 className="text-text-primary">   // Headings
<p className="text-text-secondary">  // Body text
<span className="text-text-muted">   // Labels, captions
```

#### Accent Colors
```css
--accent-primary: #06b6d4 (Cyan)
--accent-light: #22d3ee
--accent-dark: #0891b2
--accent-subtle: rgba(6, 182, 212, 0.1)
```

**Gradient:**
```tsx
<div className="bg-gradient-to-r from-cyan-500 to-indigo-600">
```

#### Semantic Colors
```css
Success: #10b981, #34d399
Error: #ef4444, #f87171
Warning: #f59e0b, #fbbf24
Info: #3b82f6, #60a5fa
```

**Usage:**
```tsx
<div className="text-success-light bg-success-bg border-success">
<div className="text-error-light bg-error-bg border-error">
<div className="text-warning-light bg-warning-bg border-warning">
<div className="text-info-light bg-info-bg border-info">
```

### Shadow System
```tsx
shadow-sm    // Subtle elevation
shadow-md    // Standard cards
shadow-lg    // Modals, important elements
shadow-hover // Hover states
shadow-active // Active states
shadow-neural // Special effects
```

### Border Radius
```tsx
rounded-md   // 8px (default)
rounded-lg   // 12px (cards)
rounded-xl   // 16px (modals, inputs)
rounded-2xl  // 20px (large surfaces)
rounded-full // Pills, badges
```

## 🧩 Component Patterns

### Card Component
**Location:** `/components/Card.tsx`

```tsx
import { Card } from '@/components/Card';

// Standard card with hover effect
<Card>Content</Card>

// Static card (no hover)
<Card variant="static">Content</Card>

// Compact padding
<Card variant="compact">Content</Card>
```

**Variants:**
- `default`: Interactive cards with hover effect
- `static`: Display-only, no hover
- `compact`: Reduced padding (p-3)

**Padding Standards:**
- Mobile: `p-4` (16px)
- Desktop: `p-6` (24px)
- Compact: `p-3` (12px)

### Input Focus Rings

**Standard Pattern (use everywhere):**
```tsx
<input
  className="focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
/>
```

All form inputs (text, textarea, select) must use this pattern for consistency.

### Icon Sizes
**Location:** `/lib/icon-sizes.ts`

```tsx
import { ICON_SIZES } from '@/lib/icon-sizes';
import { CheckCircle } from 'lucide-react';

<CheckCircle className={ICON_SIZES.xs} />   // 12px
<CheckCircle className={ICON_SIZES.sm} />   // 16px
<CheckCircle className={ICON_SIZES.base} /> // 20px
<CheckCircle className={ICON_SIZES.md} />   // 24px
<CheckCircle className={ICON_SIZES.lg} />   // 32px
<CheckCircle className={ICON_SIZES.xl} />   // 48px
```

**Context Guidelines:**
- Inline text/badges: `xs` (h-3 w-3)
- Form inputs: `sm` (h-4 w-4)
- Buttons: `sm` (h-4 w-4)
- Navigation: `base` (h-5 w-5)
- Section headers: `base` (h-5 w-5)
- Card icons: `base` to `md` (h-5 w-5 to h-6 w-6)
- Empty states: `lg` (h-8 w-8)
- Hero sections: `xl` (h-12 w-12)

## 📐 Layout Patterns

### Container Padding
```tsx
// Page containers
<div className="p-4 md:p-6 lg:p-8">

// Cards
<Card>  // Already has p-4 md:p-6

// Compact sections
<div className="p-3">
```

### Grid Layouts
```tsx
// Standard grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">

// Stats grid
<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
```

### Spacing
```tsx
// Vertical spacing between sections
<div className="space-y-6">     // Large sections
<div className="space-y-4">     // Medium sections
<div className="space-y-2">     // Small groups

// Horizontal spacing
<div className="space-x-2">     // Buttons
<div className="space-x-4">     // Cards
```

## 🎭 Animation & Transitions

### Standard Transitions
```tsx
transition-all duration-200   // Default (buttons, hovers)
transition-all duration-300   // Smooth (modals)
transition-all duration-150   // Quick (micro-interactions)
```

### Built-in Animations
```tsx
animate-pulse      // Loading skeletons
animate-spin       // Loading spinners
animate-fade-in    // Entry animations
animate-slide-up   // Slide from bottom
```

## 🔤 Typography

### Headings
```tsx
<h1 className="text-3xl font-bold text-text-primary">
<h2 className="text-2xl font-bold text-text-primary">
<h3 className="text-xl font-semibold text-text-primary">
<h4 className="text-lg font-semibold text-text-primary">
```

### Body Text
```tsx
<p className="text-base text-text-secondary">    // Default
<p className="text-sm text-text-secondary">     // Smaller
<p className="text-xs text-text-muted">         // Captions
```

### Labels
```tsx
<label className="text-sm font-medium text-text-primary">
<span className="text-xs uppercase tracking-wide text-text-muted">
```

## 🎯 Best Practices

### DO ✅
- Use semantic color tokens (`text-primary`, `surface-1`)
- Use standard focus ring pattern on all inputs
- Use Card component with appropriate variant
- Use ICON_SIZES constants for icons
- Use FormField wrapper for all form inputs
- Use Toast for user feedback
- Use Skeleton components for loading states
- Use EmptyState for "no data" screens

### DON'T ❌
- Use old color names (`bg0`, `fg1`, `line1`)
- Create custom focus ring patterns
- Mix padding sizes within same context
- Use arbitrary icon sizes
- Create custom toast implementations
- Use inline loading states
- Create custom empty state patterns

## 📚 Quick Reference

### Common Patterns

**Button:**
```tsx
<button className="h-12 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-medium hover:scale-105 transition-all">
```

**Input:**
```tsx
<input className="w-full px-4 py-3 bg-surface-0 border border-surface-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500" />
```

**Modal:**
```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
  <div className="w-full max-w-lg bg-surface-1 border border-surface-border rounded-2xl shadow-2xl">
    {/* Content */}
  </div>
</div>
```

**Badge:**
```tsx
<span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-surface-2 border border-surface-border text-text-secondary">
```

## 🔄 Migration Checklist

If updating existing code:

- [ ] Replace old color variables with new ones
- [ ] Update all input focus rings to standard pattern
- [ ] Replace custom Card implementations with Card component
- [ ] Replace magic numbers for icons with ICON_SIZES
- [ ] Replace custom error displays with FormError
- [ ] Replace custom toast/notification with Toast
- [ ] Add loading skeletons for async content
- [ ] Add empty states for empty lists/screens
- [ ] Verify hover states are consistent
- [ ] Verify padding follows standard patterns

---

**Last Updated:** 2025-11-05
**Design System Version:** 3.0 - "Mindful Intelligence"
