"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapsibleCardProps {
  icon?: LucideIcon;
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function CollapsibleCard({
  icon: Icon,
  title,
  children,
  defaultOpen = false,
  className,
}: CollapsibleCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={cn("rounded-lg border border-gray-800 bg-gray-900", className)}>
      {/* Header - Clickable to toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-4 text-left transition-all hover:bg-gray-800/50 active:scale-[0.99]"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon className="h-5 w-5 text-cyan-500" />}
          <h3 className="text-base font-semibold text-white">{title}</h3>
        </div>
        <ChevronDown
          className={cn(
            "h-5 w-5 text-gray-400 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Content - Expandable */}
      <div
        className={cn(
          "grid transition-all duration-200 ease-in-out",
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t border-gray-800 p-4 pt-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
