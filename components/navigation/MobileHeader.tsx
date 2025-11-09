"use client";

import Link from "next/link";
import { Settings } from "lucide-react";

export function MobileHeader() {
  return (
    <header className="navbar sticky top-0 z-30 px-4 py-4 shadow-md md:hidden">
      <nav className="flex items-center justify-between">
        <span className="text-xl font-bold tracking-tight text-white">
          FitCoach
        </span>
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
