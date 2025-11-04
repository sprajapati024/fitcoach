"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/components/navigation/BottomNav";
import { cn } from "@/lib/utils";

export function DesktopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 hidden border-b border-surface-border bg-surface-0 px-8 py-4 shadow-md md:block">
      <nav className="mx-auto flex max-w-6xl items-center justify-between">
        <span className="bg-gradient-to-r from-cyan-500 to-indigo-600 bg-clip-text text-xl font-bold tracking-tight text-transparent">
          FitCoach
        </span>
        <div className="flex items-center gap-2">
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
                  "touch-feedback rounded-md px-4 py-2 text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-gray-950 shadow-[0_0_10px_rgba(79,70,229,0.1)]"
                    : "text-text-muted hover:bg-surface-2 hover:text-text-primary"
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
