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
    <nav className="fixed bottom-4 left-1/2 z-40 w-full max-w-md -translate-x-1/2 px-4 md:hidden">
      <div className="flex items-center justify-between rounded-full border border-line1 bg-bg0/95 px-4 py-2 shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname ?? "", item);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-wide transition",
                active
                  ? "bg-fg0 text-bg0 shadow-inner"
                  : "text-fg2 hover:text-fg0"
              )}
            >
              <Icon className={cn("h-5 w-5", active ? "text-bg0" : "text-fg1")} aria-hidden />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
