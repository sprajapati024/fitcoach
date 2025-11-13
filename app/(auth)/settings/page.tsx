import Link from "next/link";
import { User, Dumbbell, MessageSquare, CalendarDays, Smartphone, ChevronRight } from "lucide-react";
import { getUserPlansAction } from "@/app/actions/plan";

export default async function SettingsMenuPage() {
  const userPlans = await getUserPlansAction();
  const activePlansCount = userPlans.filter(p => p.status === "active").length;

  return (
    <div className="space-y-3 pb-24 px-4">
      {/* Header */}
      <div className="py-4">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-gray-400 mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile & Account Card */}
      <Link href="/settings/profile">
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 active:bg-gray-800 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/10">
                <User className="h-5 w-5 text-cyan-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Profile & Account</h3>
                <p className="text-xs text-gray-400">Personal info, units, account</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </div>
        </div>
      </Link>

      {/* Training Setup Card */}
      <Link href="/settings/training">
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 active:bg-gray-800 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10">
                <Dumbbell className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Training Setup</h3>
                <p className="text-xs text-gray-400">Goals, schedule, equipment</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </div>
        </div>
      </Link>

      {/* AI Coach Card */}
      <Link href="/settings/coach">
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 active:bg-gray-800 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/10">
                <MessageSquare className="h-5 w-5 text-indigo-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">AI Coach</h3>
                <p className="text-xs text-gray-400">Tone, preferences, instructions</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </div>
        </div>
      </Link>

      {/* My Plans Card */}
      <Link href="/settings/plans">
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 active:bg-gray-800 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                <CalendarDays className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">My Plans</h3>
                <p className="text-xs text-gray-400">
                  {activePlansCount > 0 ? `${activePlansCount} active plan${activePlansCount > 1 ? 's' : ''}` : 'Manage your plans'}
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </div>
        </div>
      </Link>

      {/* App Settings Card */}
      <Link href="/settings/app">
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 active:bg-gray-800 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10">
                <Smartphone className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">App Settings</h3>
                <p className="text-xs text-gray-400">Install, notifications, data</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </div>
        </div>
      </Link>
    </div>
  );
}
