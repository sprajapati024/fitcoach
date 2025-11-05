"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { CalendarDays, Home, LineChart, Settings, Dumbbell, Apple } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  match?: string | string[];
};

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Today",
    icon: Home,
    match: ["/dashboard", "/workout"],
  },
  {
    href: "/plan",
    label: "Plan",
    icon: CalendarDays,
  },
  {
    href: "/nutrition",
    label: "Nutrition",
    icon: Apple,
  },
  {
    href: "/exercises",
    label: "Exercises",
    icon: Dumbbell,
  },
  {
    href: "/progress",
    label: "Progress",
    icon: LineChart,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
  },
];

function isActive(pathname: string, item: NavItem) {
  if (Array.isArray(item.match)) {
    return item.match.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  }
  if (typeof item.match === "string") {
    return pathname === item.match || pathname.startsWith(`${item.match}/`);
  }
  return pathname === item.href;
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-4 left-1/2 z-40 w-full max-w-md -translate-x-1/2 px-4 md:hidden">
      {/* Clean, floating navigation bar with v3.0 neural precision */}
      <div className="flex items-center justify-between rounded-full border border-surface-border bg-surface-0/95 px-4 py-2 shadow-lg backdrop-blur-xl">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname ?? "", item);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "touch-feedback flex flex-1 flex-col items-center gap-1 rounded-full px-3 py-2 text-xs font-medium transition-all duration-150",
                active
                  ? "text-cyan-500"
                  : "text-text-muted hover:text-text-secondary active:bg-surface-2"
              )}
            >
              <Icon
                className={cn(
                  "h-6 w-6 transition-all",
                  active ? "text-cyan-500" : "text-text-secondary"
                )}
                aria-hidden
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
