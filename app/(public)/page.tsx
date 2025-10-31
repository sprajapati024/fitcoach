'use client';

import { useCallback, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { publicEnv } from '@/lib/env/public';
import { useSupabase } from '@/components/providers/SupabaseProvider';

export default function Home() {
  const supabase = useSupabase();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignIn = useCallback(async () => {
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
    <div className="flex min-h-screen flex-col bg-bg0 text-fg0">
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-10 px-6 py-16 sm:px-8">
        <div className="space-y-4 text-left">
          <p className="text-sm uppercase tracking-[0.3em] text-fg2">
            {publicEnv.NEXT_PUBLIC_APP_NAME} · Monochrome PWA
          </p>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
            Train with structure. Progress with guardrails.
          </h1>
          <p className="max-w-lg text-base text-fg1">
            Personalized programming, PCOS-aware safety, and offline logging—
            all from a lightweight, installable coaching app.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleSignIn}
            disabled={isLoading}
            className="inline-flex h-12 items-center justify-center rounded-full bg-fg0 px-6 text-sm font-medium uppercase tracking-wide text-bg0 transition hover:bg-fg1 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Redirecting…
              </span>
            ) : (
              'Continue with Google'
            )}
          </button>
          <p className="text-xs text-fg2">
            By continuing you agree to the training terms and acknowledge {publicEnv.NEXT_PUBLIC_APP_NAME}
            {' '}
            is not medical advice.
          </p>
          {errorMessage ? (
            <p className="text-xs text-fg2">
              {errorMessage}
            </p>
          ) : null}
        </div>
      </main>
      <footer className="px-6 pb-8 text-xs text-fg2 sm:px-8">
        <span>
          ©
          {' '}
          {new Date().getFullYear()}
          {' '}
          {publicEnv.NEXT_PUBLIC_APP_NAME}
        </span>
      </footer>
    </div>
  );
}
