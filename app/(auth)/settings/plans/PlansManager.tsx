"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Trash2 } from "lucide-react";
import type { plans } from "@/drizzle/schema";
import { deletePlanAction } from "@/app/actions/plan";

type Plan = typeof plans.$inferSelect;

interface PlansManagerProps {
  userPlans: Plan[];
}

export function PlansManager({ userPlans }: PlansManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDeletePlan = (planId: string) => {
    startTransition(async () => {
      try {
        await deletePlanAction(planId);
        setDeleteConfirmId(null);
        router.refresh();
      } catch (error) {
        console.error("Failed to delete plan:", error);
        alert("Failed to delete plan. Please try again.");
      }
    });
  };

  return (
    <div className="pb-24">
      {/* Sticky Header with Back Button */}
      <div className="sticky top-0 z-10 bg-black/95 backdrop-blur-sm border-b border-gray-900 px-4 py-3 -mx-4 mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 active:text-gray-300 transition-colors min-h-[44px]"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="text-sm font-medium">Settings</span>
        </button>
        <h1 className="text-lg font-semibold text-white mt-1">My Plans</h1>
      </div>

      <div className="px-4">
        {userPlans.length === 0 ? (
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-8 text-center">
            <p className="text-sm text-gray-400 mb-4">No workout plans yet.</p>
            <button
              onClick={() => router.push("/plan")}
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 px-6 py-3 text-sm font-semibold text-white transition-transform active:scale-98"
            >
              Generate Your First Plan
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {userPlans.map((plan) => (
              <div
                key={plan.id}
                className="rounded-xl border border-gray-800 bg-gray-900 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-white text-sm">{plan.title}</h3>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium uppercase ${
                          plan.status === "active"
                            ? "bg-green-500/20 text-green-500"
                            : plan.status === "draft"
                            ? "bg-yellow-500/20 text-yellow-500"
                            : "bg-gray-500/20 text-gray-500"
                        }`}
                      >
                        {plan.status}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span>{plan.durationWeeks} weeks</span>
                      <span>{plan.daysPerWeek} days/week</span>
                      <span>Created {new Date(plan.createdAt).toLocaleDateString()}</span>
                    </div>
                    {plan.summary && (
                      <p className="mt-2 text-xs text-gray-400 line-clamp-2">{plan.summary}</p>
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    {deleteConfirmId === plan.id ? (
                      <div className="flex flex-col gap-2">
                        <span className="text-xs text-gray-400 mb-1">Delete plan?</span>
                        <button
                          onClick={() => handleDeletePlan(plan.id)}
                          disabled={isPending}
                          className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-xs font-medium text-white shadow-lg transition-all active:scale-98 disabled:opacity-50"
                        >
                          {isPending ? "Deleting..." : "Confirm"}
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          disabled={isPending}
                          className="flex min-h-[44px] items-center justify-center rounded-xl border border-gray-700 px-4 py-2 text-xs font-medium text-gray-400 transition-all active:bg-gray-800 active:scale-98"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(plan.id)}
                        className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-gray-700 px-4 py-2 text-xs font-medium text-gray-400 transition-all active:border-red-500 active:text-red-500 active:scale-98"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {userPlans.length > 0 && (
              <div className="rounded-xl border border-yellow-900/50 bg-yellow-950/20 p-4 mt-6">
                <p className="text-xs text-yellow-400">
                  ⚠️ Deleting a plan permanently removes all associated workouts and logs
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
