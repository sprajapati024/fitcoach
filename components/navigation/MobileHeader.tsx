"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import { getTimeBasedGreeting, getFirstName } from "@/lib/greetings";

interface MobileHeaderProps {
  userName?: string | null;
}

// Map routes to page names
const PAGE_NAMES: Record<string, string> = {
  "/dashboard": "", // Empty string means show greeting
  "/settings": "Settings",
  "/plan": "Plan",
  "/progress": "Progress",
  "/exercises": "Exercises",
  "/nutrition": "Nutrition",
};

export function MobileHeader({ userName }: MobileHeaderProps) {
  const pathname = usePathname();
  const { message, icon: Icon } = getTimeBasedGreeting();
  const firstName = getFirstName(userName);

  // Get the page name based on the current route
  const pageName = PAGE_NAMES[pathname || "/dashboard"];
  const isHomePage = pathname === "/dashboard" || pageName === "";

  return (
    <header className="navbar sticky top-0 z-30 px-4 py-4 shadow-md md:hidden">
      <nav className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isHomePage && <Icon className="h-5 w-5 text-emerald-400" />}
          <span className="text-base font-medium tracking-tight text-white">
            {isHomePage ? `${message}, ${firstName}` : pageName}
          </span>
        </div>
        <Link
          href="/settings"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 text-gray-400 transition hover:bg-gray-800 hover:text-white active:scale-95"
          aria-label="Settings"
        >
          <Settings className="h-5 w-5" />
        </Link>
      </nav>
    </header>
  );
}
