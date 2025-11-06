"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * RouteTransitionProvider
 *
 * Provides iOS-style page transitions for route changes:
 * - Push (forward): slide from right to left
 * - Pop (back): slide from left to right
 * - 280ms duration with iOS timing curve
 * - Respects prefers-reduced-motion
 */
export function RouteTransitionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prevPathnameRef = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const historyStackRef = useRef<string[]>([]);

  useEffect(() => {
    // Skip on initial render
    if (prevPathnameRef.current === null) {
      prevPathnameRef.current = pathname;
      historyStackRef.current = [pathname];
      return;
    }

    // Skip if pathname hasn't changed
    if (prevPathnameRef.current === pathname) {
      return;
    }

    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      prevPathnameRef.current = pathname;
      return;
    }

    const container = containerRef.current;
    if (!container) {
      prevPathnameRef.current = pathname;
      return;
    }

    // Determine if this is a back navigation
    const isBackNav = historyStackRef.current.includes(pathname);

    if (isBackNav) {
      // Pop navigation - slide from left
      historyStackRef.current = historyStackRef.current.slice(
        0,
        historyStackRef.current.indexOf(pathname) + 1
      );

      container.animate(
        [
          { transform: "translateX(-30%)", opacity: 0.8 },
          { transform: "translateX(0)", opacity: 1 },
        ],
        {
          duration: 280,
          easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
          fill: "forwards",
        }
      );
    } else {
      // Push navigation - slide from right
      historyStackRef.current.push(pathname);

      container.animate(
        [
          { transform: "translateX(100%)", opacity: 0 },
          { transform: "translateX(0)", opacity: 1 },
        ],
        {
          duration: 280,
          easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
          fill: "forwards",
        }
      );
    }

    prevPathnameRef.current = pathname;
  }, [pathname]);

  return (
    <div ref={containerRef} className="route-transition-container">
      {children}
    </div>
  );
}
