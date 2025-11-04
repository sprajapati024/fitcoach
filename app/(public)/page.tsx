'use client';

import { useCallback, useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { publicEnv } from '@/lib/env/public';
import { useSupabase } from '@/components/providers/SupabaseProvider';

const CYCLING_TAGLINES = [
  "Learns your habits. Evolves your plan.",
  "Tracks every rep. Adapts every week.",
  "Offline-first. Train anywhere.",
  "Built for lifters. Backed by AI.",
];

export default function Home() {
  const supabase = useSupabase();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentTagline, setCurrentTagline] = useState(0);

  // Auto-cycle taglines every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTagline((prev) => (prev + 1) % CYCLING_TAGLINES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSignIn = useCallback(async () => {
    if (!supabase) {
      setErrorMessage('Supabase is still initializing. Please try again.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
          queryParams: { prompt: 'consent', access_type: 'offline' },
        },
      });
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Google sign-in failed', error);
      setIsLoading(false);
      setErrorMessage('Google sign-in failed. Please try again.');
    }
  }, [supabase]);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-black text-white">
      {/* Hero Section - Full Viewport */}
      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-20 text-center">
        <div className="mx-auto w-full max-w-3xl space-y-12">
          {/* Eyebrow */}
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
              AI-Powered Training
            </p>
          </div>

          {/* Logo / Title */}
          <div className="space-y-6">
            <h1 className="text-6xl font-bold tracking-tight text-white sm:text-7xl md:text-8xl">
              FitCoach
            </h1>
            <p className="text-xl text-gray-400 sm:text-2xl">
              AI builds your plan. You build your strength.
            </p>
          </div>

          {/* CTA Button */}
          <div className="space-y-6">
            <button
              type="button"
              onClick={handleSignIn}
              disabled={isLoading || !supabase}
              className="inline-flex h-14 items-center justify-center gap-3 rounded-md bg-gradient-to-r from-cyan-500 to-indigo-600 px-10 text-base font-semibold text-black transition-all duration-200 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Getting ready...</span>
                </>
              ) : (
                <span>Start Training</span>
              )}
            </button>

            {errorMessage ? (
              <p className="text-sm text-red-400">{errorMessage}</p>
            ) : (
              <p className="text-sm tracking-wide text-gray-500">
                Adaptive. Private. Offline-ready.
              </p>
            )}
          </div>

          {/* Cycling Tagline */}
          <div>
            <div className="relative h-8 overflow-hidden">
              {CYCLING_TAGLINES.map((tagline, index) => (
                <p
                  key={tagline}
                  className={`absolute inset-0 flex items-center justify-center text-base text-gray-400 transition-all duration-700 ${
                    index === currentTagline
                      ? 'translate-y-0 opacity-100'
                      : index < currentTagline
                        ? '-translate-y-full opacity-0'
                        : 'translate-y-full opacity-0'
                  }`}
                >
                  {tagline}
                </p>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 pb-8 text-center">
        <p className="text-xs text-gray-600">
          © FitCoach {new Date().getFullYear()}. Not medical advice. Train smart.
        </p>
      </footer>
    </div>
  );
}
