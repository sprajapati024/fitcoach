"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "./BottomNav";

export function ConditionalBottomNav() {
  const pathname = usePathname();

  // Hide bottom nav during onboarding
  if (pathname?.includes('/onboarding')) {
    return null;
  }

  return <BottomNav />;
}
