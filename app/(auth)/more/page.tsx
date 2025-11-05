import Link from "next/link";
import { Settings, Dumbbell, ChevronRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "More | FitCoach",
  description: "Additional settings and features",
};

const MORE_ITEMS = [
  {
    href: "/exercises",
    label: "Exercises",
    description: "Browse and manage exercise library",
    icon: Dumbbell,
  },
  {
    href: "/settings",
    label: "Settings",
    description: "App settings and preferences",
    icon: Settings,
  },
];

export default function MorePage() {
  return (
    <main className="min-h-screen bg-surface-0 pb-24 md:pb-8">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="mb-6 text-3xl font-bold text-text-primary">More</h1>

        <div className="space-y-3">
          {MORE_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-4 rounded-2xl border border-surface-border bg-surface-1 p-4 transition-all duration-150 hover:border-cyan-500/30 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] active:scale-[0.98]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/10 to-indigo-600/10">
                  <Icon className="h-6 w-6 text-cyan-500" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-text-primary">
                    {item.label}
                  </h2>
                  <p className="text-sm text-text-muted">{item.description}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-text-muted transition-transform group-hover:translate-x-1" />
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
