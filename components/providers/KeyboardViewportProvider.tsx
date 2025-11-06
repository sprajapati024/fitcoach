"use client";

import { useEffect } from "react";

/**
 * KeyboardViewportProvider
 *
 * Listens to iOS visualViewport changes (keyboard show/hide) and sets a CSS variable
 * --kb-safe that represents the keyboard height. Use this to lift fixed elements above the keyboard.
 *
 * Usage: Apply `style={{ marginBottom: 'var(--kb-safe)' }}` to bottom-fixed elements.
 */
export function KeyboardViewportProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only run on client with visualViewport support
    if (typeof window === "undefined" || !window.visualViewport) {
      return;
    }

    const vv = window.visualViewport;

    const updateKeyboardSafe = () => {
      // Calculate the difference between window height and visual viewport height
      // This gives us the keyboard height when it's visible
      const keyboardHeight = Math.max(0, window.innerHeight - vv.height);
      document.documentElement.style.setProperty("--kb-safe", `${keyboardHeight}px`);
    };

    // Update on resize (keyboard show/hide)
    vv.addEventListener("resize", updateKeyboardSafe);
    vv.addEventListener("scroll", updateKeyboardSafe);

    // Initial call
    updateKeyboardSafe();

    return () => {
      vv.removeEventListener("resize", updateKeyboardSafe);
      vv.removeEventListener("scroll", updateKeyboardSafe);
    };
  }, []);

  return <>{children}</>;
}
