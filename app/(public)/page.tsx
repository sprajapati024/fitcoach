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
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white">
      {/* AI Pulse Breathing Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 animate-ai-pulse bg-gradient-to-br from-gray-950 via-gray-900 to-black" />
      </div>

      {/* Hero Section - Full Viewport */}
      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-20 text-center">
        <div className="mx-auto w-full max-w-3xl space-y-12">
          {/* Eyebrow */}
          <div className="animate-fade-in opacity-0" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
              AI-Powered Training
            </p>
          </div>

          {/* Logo / Title */}
          <div className="animate-fade-in space-y-6 opacity-0" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
            <h1 className="text-6xl font-bold tracking-tight text-white sm:text-7xl md:text-8xl">
              FitCoach
            </h1>
            <p className="text-xl text-gray-400 sm:text-2xl">
              AI builds your plan. You build your strength.
            </p>
          </div>

          {/* CTA Button - Neural Shimmer */}
          <div className="animate-fade-in space-y-6 opacity-0" style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>
            <button
              type="button"
              onClick={handleSignIn}
              disabled={isLoading || !supabase}
              className="group relative inline-flex h-14 items-center justify-center gap-3 overflow-hidden rounded-md bg-gradient-to-r from-cyan-500 to-indigo-600 px-10 text-base font-semibold text-black shadow-[0_0_20px_rgba(79,70,229,0.2)] transition-all duration-200 hover:scale-105 hover:shadow-[0_0_30px_rgba(79,70,229,0.3)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            >
              {/* Neural Shimmer Effect */}
              <div
                className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-all duration-500 group-hover:translate-x-[100%] group-hover:opacity-100"
                style={{ transition: 'transform 0.6s ease-in-out, opacity 0.3s ease-in-out' }}
              />

              {isLoading ? (
                <>
                  <Loader2 className="relative z-10 h-5 w-5 animate-spin" />
                  <span className="relative z-10">Getting ready...</span>
                </>
              ) : (
                <span className="relative z-10">Start Training</span>
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
          <div className="animate-fade-in opacity-0" style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}>
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

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes ai-pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.85;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-ai-pulse {
          animation: ai-pulse 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
