/**
 * Standardized icon sizes for consistent UI
 *
 * Usage with Lucide React:
 * ```tsx
 * import { CheckCircle } from 'lucide-react';
 * import { ICON_SIZES } from '@/lib/icon-sizes';
 *
 * <CheckCircle className={ICON_SIZES.sm} />
 * ```
 */

export const ICON_SIZES = {
  /** Extra small: 12px (0.75rem) - for inline text icons, badges */
  xs: 'h-3 w-3',

  /** Small: 16px (1rem) - for buttons, form inputs, compact UI */
  sm: 'h-4 w-4',

  /** Base: 20px (1.25rem) - default size for most icons */
  base: 'h-5 w-5',

  /** Medium: 24px (1.5rem) - for larger buttons, section headers */
  md: 'h-6 w-6',

  /** Large: 32px (2rem) - for prominent actions, empty states */
  lg: 'h-8 w-8',

  /** Extra large: 48px (3rem) - for hero sections, illustrations */
  xl: 'h-12 w-12',
} as const;

/**
 * Context-specific icon size guidelines:
 *
 * - Inline text/badges: xs (h-3 w-3)
 * - Form inputs: sm (h-4 w-4)
 * - Buttons (standard): sm (h-4 w-4)
 * - Navigation icons: base (h-5 w-5)
 * - Section headers: base (h-5 w-5)
 * - Card icons: base to md (h-5 w-5 to h-6 w-6)
 * - Primary actions: md (h-6 w-6)
 * - Empty states: lg (h-8 w-8)
 * - Hero/Feature sections: xl (h-12 w-12)
 */

export type IconSize = keyof typeof ICON_SIZES;
