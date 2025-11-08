"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { Settings, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/app/actions/auth";

export function ProfileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleSignOut = async () => {
    await signOutAction();
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "touch-feedback flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 transition-all duration-150",
          isOpen && "ring-2 ring-cyan-500 ring-offset-2 ring-offset-black"
        )}
        aria-label="Profile menu"
      >
        <User className="h-5 w-5 text-gray-950" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-48 rounded-lg bg-surface-2 shadow-lg ring-1 ring-white/10">
          <div className="p-2">
            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="touch-feedback flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium text-text-primary transition-all duration-150 hover:bg-surface-3"
            >
              <Settings className="h-4 w-4 text-text-secondary" />
              Settings
            </Link>
            <button
              onClick={handleSignOut}
              className="touch-feedback flex w-full items-center gap-3 rounded-md px-4 py-3 text-sm font-medium text-red-400 transition-all duration-150 hover:bg-surface-3"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
