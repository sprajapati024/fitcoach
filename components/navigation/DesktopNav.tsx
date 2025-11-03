"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/components/navigation/BottomNav";
import { cn } from "@/lib/utils";

export function DesktopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 hidden border-b border-line1 bg-bg0/95 px-8 py-4 shadow-[0_1px_0_rgba(0,212,255,0.05)] backdrop-blur-xl md:block">
      <nav className="mx-auto flex max-w-5xl items-center justify-between">
        <span className="text-sm font-semibold uppercase tracking-[0.35em] text-fg2">
          FitCoach
        </span>
        <div className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href || pathname?.startsWith(`${item.href}/`) ||
              (Array.isArray(item.match) && item.match.some((route) => pathname === route || pathname?.startsWith(`${route}/`))) ||
              (typeof item.match === "string" && (pathname === item.match || pathname?.startsWith(`${item.match}/`)));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "touch-feedback rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-gradient-to-br from-[var(--neon-primary)] to-[var(--neon-glow)] text-bg0 shadow-[0_2px_8px_rgba(0,212,255,0.3),0_0_12px_rgba(0,212,255,0.15)]"
                    : "text-fg2"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
