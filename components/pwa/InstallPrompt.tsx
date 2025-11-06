"use client";

import { useState, useEffect } from "react";
import { X, Share, PlusSquare } from "lucide-react";

interface InstallPromptProps {
  onClose: () => void;
}

export function InstallPrompt({ onClose }: InstallPromptProps) {
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Detect iOS Safari
    const ua = window.navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;

    setIsIOS(isIOSDevice);
    setIsInstalled(isStandalone);
  }, []);

  // Don't show if already installed or not iOS
  if (!isIOS || isInstalled) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-surface-1 border border-surface-border rounded-2xl shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-surface-border">
          <h2 className="text-xl font-bold text-text-primary">Install FitCoach</h2>
          <button
            onClick={onClose}
            className="touch-feedback rounded-full p-2 hover:bg-surface-2 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-text-muted" />
          </button>
        </div>

        {/* Instructions */}
        <div className="p-6 space-y-6">
          <p className="text-text-secondary">
            Install FitCoach on your home screen for the best experience. It works just like a native app!
          </p>

          {/* Step 1 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 flex items-center justify-center text-gray-950 font-bold">
              1
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Share className="h-5 w-5 text-cyan-500" />
                <h3 className="font-semibold text-text-primary">Tap the Share button</h3>
              </div>
              <p className="text-sm text-text-secondary">
                Tap the <Share className="inline h-4 w-4" /> Share icon in your Safari toolbar (at the bottom or top of the screen)
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 flex items-center justify-center text-gray-950 font-bold">
              2
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <PlusSquare className="h-5 w-5 text-cyan-500" />
                <h3 className="font-semibold text-text-primary">Add to Home Screen</h3>
              </div>
              <p className="text-sm text-text-secondary">
                Scroll down and tap <span className="font-semibold">"Add to Home Screen"</span> from the menu
              </p>
            </div>
          </div>

          {/* Visual indicator */}
          <div className="bg-surface-0 border border-surface-border rounded-xl p-4">
            <p className="text-xs text-text-muted text-center">
              Once installed, FitCoach will appear on your home screen and open in full-screen mode without browser controls.
            </p>
          </div>

          {/* Done button */}
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-surface-2 border border-surface-border rounded-xl text-text-primary font-medium hover:bg-surface-border transition-colors"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}
