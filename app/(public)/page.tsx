'use client';

import { useCallback, useState, useEffect } from 'react';
import { Loader2, Zap } from 'lucide-react';
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
  const [scrollProgress, setScrollProgress] = useState(0);

  // Auto-cycle taglines every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTagline((prev) => (prev + 1) % CYCLING_TAGLINES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Track scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.min(scrolled / Math.max(maxScroll, 1), 1);
      setScrollProgress(progress);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-950 via-black to-gray-900">
      {/* Animated Background Gradient */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.03),transparent_50%)] animate-pulse-slow" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute left-1/4 top-1/4 h-96 w-96 animate-drift-slow rounded-full bg-accent/5 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 h-96 w-96 animate-drift-slower rounded-full bg-purple-500/5 blur-3xl" />
        </div>
      </div>

      {/* Noise Texture Overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.015]">
        <div className="h-full w-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')]" />
      </div>

      {/* Hero Section - Full Viewport */}
      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-20 text-center">
        <div className="mx-auto w-full max-w-3xl space-y-12">
          {/* Eyebrow */}
          <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
              AI-Powered Training
            </p>
          </div>

          {/* Logo / Title */}
          <div className="animate-fade-in-up space-y-6 opacity-0" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
            <div className="relative inline-flex items-center justify-center">
              <div className="absolute inset-0 animate-pulse-glow rounded-full bg-accent/10 blur-2xl" />
              <h1 className="relative text-6xl font-bold tracking-tight text-white sm:text-7xl md:text-8xl">
                FitCoach
              </h1>
            </div>
            <p className="text-xl text-gray-400 sm:text-2xl">
              AI builds your plan. You build your strength.
            </p>
          </div>

          {/* CTA Button */}
          <div className="animate-fade-in-up space-y-6 opacity-0" style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>
            <button
              type="button"
              onClick={handleSignIn}
              disabled={isLoading || !supabase}
              className="group relative inline-flex h-16 items-center justify-center gap-3 overflow-hidden rounded-full bg-accent px-12 text-lg font-semibold text-gray-950 shadow-[0_0_40px_rgba(6,182,212,0.3)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_60px_rgba(6,182,212,0.5)] active:scale-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            >
              <div className="absolute inset-0 -z-10 bg-gradient-to-r from-accent-light via-accent to-accent-dark opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Getting ready...</span>
                </>
              ) : (
                <>
                  <span>Start Training — Free</span>
                  <Zap className="h-5 w-5" />
                </>
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
          <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}>
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

      {/* Scroll Fade Sections */}
      <div className="relative z-10 space-y-96 px-6 pb-96 pt-32">
        {/* Section 1 */}
        <div
          className="mx-auto max-w-3xl text-center transition-opacity duration-1000"
          style={{ opacity: Math.min(scrollProgress * 3, 1) }}
        >
          <h2 className="mb-4 text-4xl font-bold text-white sm:text-5xl">
            AI-Generated Fitness Plans.
            <br />
            <span className="text-gray-400">Smarter every workout.</span>
          </h2>
          <p className="text-lg text-gray-500">
            No subscriptions. No uploads. Just you and your data.
          </p>
        </div>

        {/* Section 2 */}
        <div
          className="mx-auto max-w-3xl text-center transition-opacity duration-1000"
          style={{ opacity: Math.min((scrollProgress - 0.3) * 3, 1) }}
        >
          <h2 className="mb-4 text-4xl font-bold text-white sm:text-5xl">
            Made for real people.
          </h2>
          <p className="text-lg text-gray-400">
            Beginner to athlete — FitCoach adjusts your volume, intensity, and recovery as you log workouts.
          </p>
        </div>

        {/* Final CTA */}
        <div
          className="mx-auto max-w-3xl text-center transition-opacity duration-1000"
          style={{ opacity: Math.min((scrollProgress - 0.6) * 3, 1) }}
        >
          <p className="mb-8 text-2xl text-gray-400">
            Join lifters training smarter →
          </p>
          <button
            type="button"
            onClick={handleSignIn}
            disabled={isLoading || !supabase}
            className="group relative inline-flex h-16 items-center justify-center gap-3 overflow-hidden rounded-full bg-accent px-12 text-lg font-semibold text-gray-950 shadow-[0_0_40px_rgba(6,182,212,0.3)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_60px_rgba(6,182,212,0.5)] active:scale-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-accent-light via-accent to-accent-dark opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Getting ready...</span>
              </>
            ) : (
              <>
                <span>Start Training Free</span>
                <Zap className="h-5 w-5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 pb-8 text-center">
        <p className="text-xs text-gray-600">
          © FitCoach {new Date().getFullYear()}. Not medical advice. Train smart.
        </p>
      </footer>

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.5;
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            opacity: 0.4;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.05);
          }
        }

        @keyframes drift-slow {
          0%, 100% {
            transform: translate(0, 0);
          }
          33% {
            transform: translate(-50px, 50px);
          }
          66% {
            transform: translate(50px, -30px);
          }
        }

        @keyframes drift-slower {
          0%, 100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(80px, -80px);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out;
        }

        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }

        .animate-pulse-glow {
          animation: pulse-glow 4s ease-in-out infinite;
        }

        .animate-drift-slow {
          animation: drift-slow 30s ease-in-out infinite;
        }

        .animate-drift-slower {
          animation: drift-slower 40s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
