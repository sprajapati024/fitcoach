"use client";

import { ProfileMenu } from "@/components/navigation/ProfileMenu";

export function MobileHeader() {
  return (
    <header className="navbar sticky top-0 z-30 px-4 py-4 shadow-md md:hidden">
      <nav className="flex items-center justify-between">
        <span className="bg-gradient-to-r from-cyan-500 to-indigo-600 bg-clip-text text-xl font-bold tracking-tight text-transparent">
          FitCoach
        </span>
        <ProfileMenu />
      </nav>
    </header>
  );
}
