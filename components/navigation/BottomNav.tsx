"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { CalendarDays, Home, LineChart, Settings } from "lucide-react";
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
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
      {/* Clean, elevated navigation bar */}
      <div className="flex items-center justify-between border-t border-line1 bg-bg0 px-2 py-2 shadow-lg">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname ?? "", item);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "touch-feedback flex flex-1 flex-col items-center gap-1 rounded-md px-3 py-2 text-xs font-medium transition-all duration-150",
                active
                  ? "text-accent"
                  : "text-fg2 hover:text-fg1 active:bg-bg2"
              )}
            >
              <Icon
                className={cn(
                  "h-6 w-6 transition-all",
                  active ? "text-accent" : "text-fg1"
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
