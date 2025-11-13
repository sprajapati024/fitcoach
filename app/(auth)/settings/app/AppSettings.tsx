"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Download, Bell, Database, Info } from "lucide-react";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";

export function AppSettings() {
  const router = useRouter();
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  return (
    <div className="pb-24">
      {/* Install Prompt Modal */}
      {showInstallPrompt && <InstallPrompt onClose={() => setShowInstallPrompt(false)} />}

      {/* Back Button */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 active:text-gray-300 transition-colors min-h-[44px]"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
      </div>

      <div className="space-y-6">
        {/* Install App */}
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Installation</h2>

          <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/10 flex-shrink-0">
                <Download className="h-5 w-5 text-cyan-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">Install FitCoach</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Install the app on your home screen for quick access and full offline support
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowInstallPrompt(true)}
              className="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-sm font-medium text-white transition-all active:bg-gray-700 active:scale-98"
            >
              <Download className="h-4 w-4" />
              Install App
            </button>
          </div>
        </div>

        {/* Notifications - Coming Soon */}
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Notifications</h2>

          <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10 flex-shrink-0">
                <Bell className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">Push Notifications</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Get notified about workout reminders, rest timer completion, and coach messages
                </p>
              </div>
            </div>
            <div className="rounded-lg border border-yellow-900/50 bg-yellow-950/20 p-3">
              <p className="text-xs text-yellow-400">
                Coming soon! Notifications will be available in a future update.
              </p>
            </div>
          </div>
        </div>

        {/* Data & Storage */}
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Data & Storage</h2>

          <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10 flex-shrink-0">
                <Database className="h-5 w-5 text-green-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-white mb-1">Offline Storage</h3>
                <p className="text-xs text-gray-400 leading-relaxed mb-3">
                  Your data is cached locally for offline access. It automatically syncs when you're back online.
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                  Automatic sync enabled
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* App Info */}
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">About</h2>

          <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/10 flex-shrink-0">
                <Info className="h-5 w-5 text-indigo-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-white mb-2">FitCoach</h3>
                <div className="space-y-1 text-xs text-gray-400">
                  <div className="flex justify-between">
                    <span>Version</span>
                    <span className="text-white">1.0.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Type</span>
                    <span className="text-white">Progressive Web App</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Offline Support</span>
                    <span className="text-green-400">Enabled</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Help & Support */}
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Support</h2>

          <div className="space-y-2">
            <button
              onClick={() => window.open("https://github.com/fitcoach/issues", "_blank")}
              className="flex w-full min-h-[44px] items-center justify-between rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 text-sm text-white transition-all active:bg-gray-800 active:scale-98"
            >
              <span>Report an Issue</span>
              <span className="text-gray-500">→</span>
            </button>

            <button
              onClick={() => window.open("https://github.com/fitcoach/discussions", "_blank")}
              className="flex w-full min-h-[44px] items-center justify-between rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 text-sm text-white transition-all active:bg-gray-800 active:scale-98"
            >
              <span>Community Forum</span>
              <span className="text-gray-500">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
