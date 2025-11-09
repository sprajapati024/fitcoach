"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/components/navigation/BottomNav";
import { cn } from "@/lib/utils";

export function DesktopNav() {
  const pathname = usePathname();

  return (
    <header className="navbar sticky top-0 z-30 hidden px-8 py-4 shadow-md md:block">
      <nav className="mx-auto flex max-w-6xl items-center justify-between">
        <span className="text-xl font-bold tracking-tight text-white">
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
                    ? "bg-gray-800 text-white"
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
