'use client';

import { useCallback, useState } from 'react';
import { Loader2, Zap, Target, Wifi } from 'lucide-react';
import { publicEnv } from '@/lib/env/public';
import { useSupabase } from '@/components/providers/SupabaseProvider';

export default function Home() {
  const supabase = useSupabase();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-bg0 text-fg0">
      {/* Animated Gradient Orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -left-1/4 top-1/4 h-96 w-96 animate-float-slow rounded-full bg-gradient-to-br from-accent/20 via-accent/10 to-transparent blur-3xl"
          style={{ animationDelay: '0s' }}
        />
        <div
          className="absolute right-0 top-0 h-[32rem] w-[32rem] animate-float-slower rounded-full bg-gradient-to-bl from-purple-500/15 via-accent/10 to-transparent blur-3xl"
          style={{ animationDelay: '2s' }}
        />
        <div
          className="absolute -bottom-48 left-1/3 h-80 w-80 animate-float rounded-full bg-gradient-to-tr from-accent/15 via-cyan-400/10 to-transparent blur-3xl"
          style={{ animationDelay: '4s' }}
        />
      </div>

      {/* Content */}
      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-12 px-6 py-20 sm:px-8 md:gap-16 md:py-24">
        {/* Hero Section */}
        <div className="space-y-8 text-center fade-in">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.25em] text-fg2 md:text-sm">
              AI-Powered Training
            </p>
            <h1 className="bg-gradient-to-br from-fg0 via-fg0 to-fg1 bg-clip-text text-5xl font-bold leading-tight text-transparent sm:text-6xl md:text-7xl">
              Train like you have
              <br />
              a coach.
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-fg1 md:text-xl">
              AI builds your plan. You build your strength.
            </p>
          </div>

          {/* CTA */}
          <div className="flex flex-col items-center gap-4">
            <button
              type="button"
              onClick={handleSignIn}
              disabled={isLoading || !supabase}
              className="group relative inline-flex h-14 items-center justify-center gap-2 overflow-hidden rounded-full bg-accent px-10 text-base font-semibold text-gray-950 shadow-lg shadow-accent/25 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-accent/30 active:scale-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            >
              <div className="absolute inset-0 -z-10 bg-gradient-to-r from-accent-light to-accent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                  <span>Getting ready...</span>
                </>
              ) : (
                <>
                  <span>Start Training Free</span>
                  <Zap className="h-5 w-5" />
                </>
              )}
            </button>

            {errorMessage ? (
              <p className="text-sm text-error">{errorMessage}</p>
            ) : (
              <p className="text-xs text-fg2 md:text-sm">
                Free. Fast. Offline-ready.
              </p>
            )}
          </div>
        </div>

        {/* Features - Glassmorphic Cards */}
        <div className="grid gap-4 sm:grid-cols-3 md:gap-6">
          <div className="glass-card group flex flex-col gap-3 rounded-2xl border border-line1/50 bg-bg1/40 p-6 backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:border-accent/30 hover:bg-bg1/60 hover:shadow-lg hover:shadow-accent/10">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 transition-colors group-hover:bg-accent/20">
              <Zap className="h-6 w-6 text-accent" />
            </div>
            <h3 className="text-lg font-semibold text-fg0">Smart Plans</h3>
            <p className="text-sm leading-relaxed text-fg2">
              AI generates personalized workout programs based on your goals and experience.
            </p>
          </div>

          <div className="glass-card group flex flex-col gap-3 rounded-2xl border border-line1/50 bg-bg1/40 p-6 backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:border-accent/30 hover:bg-bg1/60 hover:shadow-lg hover:shadow-accent/10">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 transition-colors group-hover:bg-accent/20">
              <Target className="h-6 w-6 text-accent" />
            </div>
            <h3 className="text-lg font-semibold text-fg0">PCOS-Safe</h3>
            <p className="text-sm leading-relaxed text-fg2">
              Built-in safety guardrails for PCOS-aware programming. Train confidently.
            </p>
          </div>

          <div className="glass-card group flex flex-col gap-3 rounded-2xl border border-line1/50 bg-bg1/40 p-6 backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:border-accent/30 hover:bg-bg1/60 hover:shadow-lg hover:shadow-accent/10">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 transition-colors group-hover:bg-accent/20">
              <Wifi className="h-6 w-6 rotate-45 text-accent" />
            </div>
            <h3 className="text-lg font-semibold text-fg0">Works Offline</h3>
            <p className="text-sm leading-relaxed text-fg2">
              Add to home screen. Log workouts anywhere. Syncs when you're back online.
            </p>
          </div>
        </div>

        {/* Social Proof */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="glass-card inline-flex items-center gap-2 rounded-full border border-line1/50 bg-bg1/30 px-6 py-3 backdrop-blur-xl">
            <div className="flex -space-x-2">
              <div className="h-8 w-8 rounded-full border-2 border-bg0 bg-gradient-to-br from-accent to-accent-dark" />
              <div className="h-8 w-8 rounded-full border-2 border-bg0 bg-gradient-to-br from-purple-500 to-accent" />
              <div className="h-8 w-8 rounded-full border-2 border-bg0 bg-gradient-to-br from-cyan-400 to-accent" />
            </div>
            <p className="text-sm text-fg1">
              Join lifters training smarter
            </p>
          </div>
          <p className="max-w-md text-xs text-fg2">
            By continuing you agree this is not medical advice. Just a really good training tool.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-6 pb-8 text-center text-xs text-fg2 sm:px-8">
        <span>
          © {new Date().getFullYear()} {publicEnv.NEXT_PUBLIC_APP_NAME}
        </span>
      </footer>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -30px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        @keyframes float-slow {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(-40px, 40px) scale(1.15);
          }
        }

        @keyframes float-slower {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(60px, -50px) scale(0.85);
          }
        }

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

        .animate-float {
          animation: float 20s ease-in-out infinite;
        }

        .animate-float-slow {
          animation: float-slow 25s ease-in-out infinite;
        }

        .animate-float-slower {
          animation: float-slower 30s ease-in-out infinite;
        }

        .fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }

        .glass-card {
          animation: fade-in 0.8s ease-out forwards;
        }

        .glass-card:nth-child(1) {
          animation-delay: 0.1s;
          opacity: 0;
        }

        .glass-card:nth-child(2) {
          animation-delay: 0.2s;
          opacity: 0;
        }

        .glass-card:nth-child(3) {
          animation-delay: 0.3s;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}
