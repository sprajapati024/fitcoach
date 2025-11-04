# FitCoach Design System v2.0
## Minimal & Clean • Mobile-First • Coach-Like

---

## Design Philosophy

**Core Principles:**
- **Minimal & Clean**: Generous whitespace, clear hierarchy, refined typography
- **Subtle Neon Accent**: Electric blue/cyan used sparingly for CTAs and key actions
- **Mobile Comfort**: Large touch targets, thumb-friendly zones, clear affordances
- **Coach-Like Feel**: Professional, trustworthy, supportive (not gamified or flashy)
- **Data Clarity**: Numbers and progress tracking are immediately readable

---

## Color System

### Base Palette (Monochrome Foundation)

**Dark Theme (Default)**
```css
--gray-950: #0a0a0a;  /* Deepest background */
--gray-900: #1a1a1a;  /* Card backgrounds */
--gray-800: #262626;  /* Elevated surfaces */
--gray-700: #404040;  /* Borders, dividers */
--gray-600: #525252;  /* Disabled text */
--gray-400: #a3a3a3;  /* Secondary text */
--gray-200: #e5e5e5;  /* Primary text */
--gray-50:  #fafafa;  /* Headings, emphasis */
```

**Light Theme**
```css
--gray-50:  #fafafa;  /* Deepest background */
--gray-100: #f5f5f5;  /* Card backgrounds */
--gray-200: #e5e5e5;  /* Elevated surfaces */
--gray-300: #d4d4d4;  /* Borders, dividers */
--gray-400: #a3a3a3;  /* Disabled text */
--gray-600: #525252;  /* Secondary text */
--gray-800: #262626;  /* Primary text */
--gray-900: #1a1a1a;  /* Headings, emphasis */
```

### Accent Color (Neon Blue - Used Sparingly)

```css
--accent-primary: #06b6d4;    /* Cyan 500 - Main CTAs */
--accent-light:   #22d3ee;    /* Cyan 400 - Hover states */
--accent-dark:    #0891b2;    /* Cyan 600 - Active states */
--accent-subtle:  #164e63;    /* Cyan 900 - Dark theme backgrounds */
--accent-muted:   rgba(6, 182, 212, 0.1);  /* Subtle highlights */
```

**Usage Rules:**
- Primary CTAs only (Start Workout, Save, Generate Plan)
- Active navigation state
- Progress indicators
- Success states
- NOT for: borders, backgrounds (except CTAs), decorative elements

### Semantic Colors (Functional Feedback)

```css
--success: #10b981;      /* Green 500 */
--success-bg: #064e3b;   /* Green 900 for dark theme */
--error: #ef4444;        /* Red 500 */
--error-bg: #7f1d1d;     /* Red 900 for dark theme */
--warning: #f59e0b;      /* Amber 500 */
--warning-bg: #78350f;   /* Amber 900 for dark theme */
--info: #3b82f6;         /* Blue 500 */
--info-bg: #1e3a8a;      /* Blue 900 for dark theme */
```

---

## Typography

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI",
             Roboto, Helvetica, Arial, sans-serif;
```

### Type Scale (Mobile-First)

| Element | Mobile | Desktop | Weight | Line Height |
|---------|--------|---------|--------|-------------|
| **H1** | 28px | 32px | 700 | 1.2 |
| **H2** | 24px | 28px | 700 | 1.3 |
| **H3** | 20px | 24px | 600 | 1.4 |
| **Body Large** | 17px | 18px | 400 | 1.5 |
| **Body** | 16px | 16px | 400 | 1.5 |
| **Body Small** | 14px | 14px | 400 | 1.4 |
| **Caption** | 13px | 13px | 500 | 1.3 |
| **Micro** | 12px | 12px | 500 | 1.2 |

**Usage:**
- **H1**: Page titles (Dashboard, Plan, Progress)
- **H2**: Section headers (Today's Workout, Week 1)
- **H3**: Card titles, exercise names
- **Body Large**: Important stats, primary content
- **Body**: Default text, descriptions
- **Body Small**: Secondary info, timestamps
- **Caption**: Labels, metadata
- **Micro**: Tiny labels, badges

---

## Spacing System

**Base unit: 4px**

```css
--space-1:  4px;   /* Tight inline spacing */
--space-2:  8px;   /* Small gaps */
--space-3:  12px;  /* Default component padding */
--space-4:  16px;  /* Card padding, list gaps */
--space-5:  20px;  /* Section spacing */
--space-6:  24px;  /* Large gaps */
--space-8:  32px;  /* Page margins */
--space-10: 40px;  /* Major sections */
--space-12: 48px;  /* Extra large spacing */
--space-16: 64px;  /* Hero sections */
```

**Mobile Touch Zones:**
- Minimum tap target: **44px × 44px** (iOS/Android standard)
- Button height: **48px** (comfortable thumb reach)
- Input height: **52px** (easy to tap, room for label)
- Bottom nav icons: **24px** with **8px** padding = **40px** total

---

## Border Radius

```css
--radius-sm:  4px;   /* Tight elements (badges, tags) */
--radius-md:  8px;   /* Default (buttons, inputs, cards) */
--radius-lg:  12px;  /* Large cards */
--radius-xl:  16px;  /* Hero cards, modals */
--radius-full: 9999px; /* Pills, circular buttons */
```

**Usage:**
- **Buttons**: radius-md (8px)
- **Cards**: radius-lg (12px)
- **Inputs**: radius-md (8px)
- **Bottom Nav**: no radius (full-width)
- **Modals**: radius-xl (16px)

---

## Shadows & Elevation

### Subtle Layering (No Heavy Glows)

```css
/* Cards & elevated surfaces */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
             0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
             0 4px 6px -2px rgba(0, 0, 0, 0.05);

/* Accent glow (very subtle, CTAs only) */
--glow-accent: 0 0 20px rgba(6, 182, 212, 0.15);
```

**Usage:**
- **Cards**: shadow-md
- **Modals/Sheets**: shadow-lg
- **Bottom Nav**: shadow-lg (top shadow)
- **Primary Buttons**: shadow-md + glow-accent (subtle!)
- **Inputs (focus)**: thin accent border (no glow)

---

## Components

### Primary Button (Call-to-Action)
```tsx
<button className="
  h-12 px-6
  bg-accent-primary text-gray-950
  rounded-md font-semibold
  shadow-md hover:shadow-lg
  hover:bg-accent-light
  active:scale-[0.98]
  disabled:opacity-50 disabled:cursor-not-allowed
  transition-all duration-150
">
  Start Workout
</button>
```

**Visual**: Solid cyan background, dark text, subtle shadow, NO heavy glow

### Secondary Button (Less Emphasis)
```tsx
<button className="
  h-12 px-6
  bg-gray-800 text-gray-200
  border border-gray-700
  rounded-md font-medium
  hover:bg-gray-700 hover:border-gray-600
  active:scale-[0.98]
  transition-all duration-150
">
  Cancel
</button>
```

### Ghost Button (Tertiary)
```tsx
<button className="
  h-10 px-4
  text-gray-400
  hover:text-gray-200 hover:bg-gray-800
  rounded-md font-medium
  transition-all duration-150
">
  Skip
</button>
```

### Card
```tsx
<div className="
  bg-gray-900
  border border-gray-800
  rounded-lg
  p-4 md:p-6
  shadow-md
">
  {/* Content */}
</div>
```

**Visual**: Dark card, subtle border, clean shadow (no glow)

### Input Field
```tsx
<input className="
  h-13 px-4
  bg-gray-900 text-gray-200
  border border-gray-700
  rounded-md
  placeholder:text-gray-600
  focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent
  disabled:opacity-50 disabled:cursor-not-allowed
  transition-all duration-150
" />
```

**Visual**: Clean focus ring (2px cyan), no glow

### Bottom Navigation
```tsx
<nav className="
  fixed bottom-0 left-0 right-0
  h-16
  bg-gray-950 border-t border-gray-800
  shadow-lg
  md:hidden
">
  {/* Nav items */}
</nav>
```

**Nav Item (Active)**
```tsx
<button className="
  flex flex-col items-center justify-center
  flex-1 py-2
  text-accent-primary  /* Active state */
">
  <Icon size={24} />
  <span className="text-xs font-medium mt-1">Today</span>
</button>
```

**Nav Item (Inactive)**
```tsx
<button className="
  flex flex-col items-center justify-center
  flex-1 py-2
  text-gray-600  /* Inactive state */
  hover:text-gray-400
">
  <Icon size={24} />
  <span className="text-xs font-medium mt-1">Plan</span>
</button>
```

### Desktop Navigation
```tsx
<header className="
  sticky top-0 z-50
  h-16 px-6
  bg-gray-950/80 backdrop-blur-lg
  border-b border-gray-800
  hidden md:flex items-center justify-between
">
  {/* Logo + Nav links */}
</header>
```

---

## Layout Patterns

### Page Container
```tsx
<div className="min-h-screen bg-gray-950 pb-20 md:pb-0">
  <div className="max-w-7xl mx-auto px-4 py-6 md:px-6 md:py-8">
    {/* Page content */}
  </div>
</div>
```

### Two-Column Layout (Desktop)
```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <div>{/* Left column */}</div>
  <div>{/* Right column */}</div>
</div>
```

### Card Grid
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {cards.map(card => <Card key={card.id} {...card} />)}
</div>
```

---

## Interaction States

### Touch Feedback (Mobile)
```css
/* Scale down on press */
active:scale-[0.98]
transition-transform duration-150

/* Add subtle bg on press for ghost buttons */
active:bg-gray-800
```

### Hover States (Desktop)
```css
/* Buttons */
hover:bg-accent-light      /* Primary CTA */
hover:bg-gray-700          /* Secondary */
hover:bg-gray-800          /* Ghost */

/* Cards */
hover:border-gray-700      /* Subtle highlight */
```

### Focus States (Accessibility)
```css
/* Inputs */
focus:outline-none
focus:ring-2
focus:ring-accent-primary
focus:border-transparent

/* Buttons */
focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-accent-primary
focus-visible:ring-offset-2
focus-visible:ring-offset-gray-950
```

### Loading States
```tsx
<button disabled className="relative">
  <span className="opacity-0">Button Text</span>
  <Loader2 className="absolute inset-0 m-auto animate-spin" size={20} />
</button>
```

---

## Animation Guidelines

**Principle: Fast & Purposeful**

```css
/* Default transitions */
transition-all duration-150 ease-out

/* Smooth page transitions */
transition-all duration-300 ease-in-out

/* Micro-interactions */
transition-transform duration-100 ease-out
```

**Usage:**
- Button press: 150ms scale
- Hover effects: 150ms opacity/bg
- Page transitions: 300ms fade/slide
- Modal enter/exit: 200ms scale + fade
- No heavy glows, no pulsing animations (unless loading)

---

## Coach-Like Principles

### Tone
- **Supportive**: "You're making progress" not "Good job!"
- **Clear**: "Complete 3 sets of 8-12 reps" not "Do your thing"
- **Guiding**: "Rest 90 seconds between sets" not just a timer

### Visual Hierarchy
1. **What's next** (primary action, largest)
2. **Today's context** (workout overview)
3. **Progress/data** (supporting info)
4. **Settings/secondary** (de-emphasized)

### Information Density
- **Mobile**: One main action visible at a time
- **Desktop**: Allow scanning with clear sections
- **Workout logging**: One exercise in focus, swipe to next

---

## Accessibility

### Contrast Ratios (WCAG AA)
- **Body text**: 4.5:1 minimum (gray-200 on gray-950 = 15:1 ✓)
- **Large text**: 3:1 minimum
- **Interactive elements**: Clear focus indicators

### Touch Targets
- Minimum 44×44px (iOS/Android standard)
- Sufficient spacing between tappable elements (8px min)

### Motion
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Mobile-First Breakpoints

```css
/* Tailwind default breakpoints */
sm: 640px   /* Large phone, small tablet */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
```

**Strategy:**
- Design for **375px** width (iPhone SE) first
- Enhance for **768px+** (tablet/desktop)
- Bottom nav disappears at **768px+**, replaced by top nav

---

## Implementation Priority

### Phase 1: Foundation (30 min)
1. Update `styles/globals.css` with new design tokens
2. Update `tailwind.config.ts` to map new colors
3. Create base component files in `/components/ui/`

### Phase 2: Core Components (45 min)
4. Button (Primary, Secondary, Ghost)
5. Card
6. Input
7. BottomNav & DesktopNav

### Phase 3: Page Layouts (60 min)
8. Dashboard/Today
9. Plan Calendar
10. Workout Detail
11. Progress
12. Settings
13. Onboarding

### Total Time: ~2.5 hours for complete redesign

---

## Visual Comparison

### Before (Current Neon Style)
- Heavy cyan gradient backgrounds
- Multiple layered glows and shadows
- Neon used everywhere (borders, backgrounds, text)
- Feels "gamified" and flashy

### After (Minimal & Clean)
- Monochrome foundation (gray-900 cards on gray-950 background)
- Subtle shadows (no glows except tiny accent on CTAs)
- Cyan accent used ONLY for primary CTAs and active states
- Feels "professional coach" and trustworthy

---

## Questions for You

1. **Accent color intensity**: The cyan (#06b6d4) is bright but not glowing. Good, or want it more muted?
2. **Card borders**: Keep subtle borders on cards, or go full borderless (just shadows)?
3. **Button corner radius**: 8px (slightly rounded) or 6px (tighter)?
4. **Success color**: Keep green (#10b981) for "workout complete" feedback, or use accent cyan?

Let me know and I'll start implementing! 🎨
