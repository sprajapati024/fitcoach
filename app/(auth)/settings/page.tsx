import Link from "next/link";
import { User, MessageSquare, Smartphone, ChevronRight } from "lucide-react";

export default function SettingsMenuPage() {
  return (
    <div className="space-y-4 pb-24">
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
                <p className="text-xs text-gray-400">Nutrition guidance, tone, preferences</p>
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
