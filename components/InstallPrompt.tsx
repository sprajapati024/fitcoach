"use client";

import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(() => {
      setShow(false);
      setDeferredPrompt(null);
    });
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom md:left-auto md:right-8 md:w-auto">
      <div className="flex items-center gap-3 rounded-lg border border-gray-800 bg-gray-950/95 p-4 shadow-lg backdrop-blur-sm">
        <div className="flex-1">
          <p className="font-medium text-white">Install FitCoach</p>
          <p className="text-sm text-gray-400">Add to home screen for quick access</p>
        </div>
        <button
          onClick={handleInstall}
          className="flex items-center gap-1 rounded-md bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-2 text-sm font-semibold text-black transition-all hover:scale-105 active:scale-95"
        >
          <Download className="h-4 w-4" />
          Install
        </button>
        <button
          onClick={() => setShow(false)}
          className="rounded-md p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
          aria-label="Close install prompt"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
