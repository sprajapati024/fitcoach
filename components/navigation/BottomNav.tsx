"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { CalendarDays, Home, LineChart, Settings, Dumbbell, Apple, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/Tooltip";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  match?: string | string[];
};

// All navigation items for desktop
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

// Mobile navigation items (4 main + More)
const MOBILE_NAV_ITEMS: NavItem[] = [
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
    href: "/progress",
    label: "Progress",
    icon: LineChart,
  },
  {
    href: "/more",
    label: "More",
    icon: MoreHorizontal,
    match: ["/more", "/exercises", "/settings"],
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
    <nav
      className="tabbar fixed bottom-0 left-0 right-0 z-40 md:hidden"
      style={{ paddingBottom: 'var(--safe-bottom)' }}
    >
      {/* iOS-style tab bar flush to bottom edge */}
      <div className="flex items-center justify-between px-4 py-2">
        {MOBILE_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname ?? "", item);

          return (
            <Tooltip key={item.href} content={item.label} side="top">
              <Link
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
            </Tooltip>
          );
        })}
      </div>
    </nav>
  );
}
