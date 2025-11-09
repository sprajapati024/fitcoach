"use client";

import Link from "next/link";
import { Settings } from "lucide-react";
import { getTimeBasedGreeting, getFirstName } from "@/lib/greetings";

interface MobileHeaderProps {
  userName?: string | null;
}

export function MobileHeader({ userName }: MobileHeaderProps) {
  const { message, icon: Icon } = getTimeBasedGreeting();
  const firstName = getFirstName(userName);

  return (
    <header className="navbar sticky top-0 z-30 px-4 py-4 shadow-md md:hidden">
      <nav className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-emerald-400" />
          <span className="text-base font-medium tracking-tight text-white">
            {message}, {firstName}
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
