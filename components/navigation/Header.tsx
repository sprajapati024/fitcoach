"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

/**
 * iOS-style large title header that collapses on scroll
 */
export function Header({ title, subtitle, children }: HeaderProps) {
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Collapse when scrolled more than 40px
      setIsCompact(window.scrollY > 40);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 transition-all duration-200 bg-surface-0/95 backdrop-blur-xl border-b border-surface-border",
        isCompact ? "py-3" : "py-6"
      )}
      data-compact={isCompact}
    >
      <div className="px-4 md:px-8">
        <h1
          className={cn(
            "font-bold text-text-primary transition-all duration-200",
            isCompact ? "text-xl" : "text-3xl md:text-4xl"
          )}
        >
          {title}
        </h1>
        {subtitle && !isCompact && (
          <p className="mt-1 text-sm text-text-secondary animate-fade-in">
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </header>
  );
}
