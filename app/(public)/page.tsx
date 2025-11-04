'use client';

import { useCallback, useState } from 'react';
import { Brain, Shield, WifiOff, ArrowRight, Check, Smartphone } from 'lucide-react';
import { publicEnv } from '@/lib/env/public';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Card } from '@/components/Card';

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
    <div className="flex min-h-screen flex-col bg-bg0 text-fg0">
      {/* Hero Section */}
      <main className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 md:py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left Column - Copy & CTA */}
          <div className="flex flex-col justify-center space-y-8">
            <div className="space-y-6">
              <p className="text-sm font-semibold uppercase tracking-widest text-fg2">
                {publicEnv.NEXT_PUBLIC_APP_NAME}
              </p>
              <h1 className="text-4xl font-bold leading-tight text-fg0 sm:text-5xl md:text-6xl">
                Train Like You Have a Coach. For Free.
              </h1>
              <p className="max-w-xl text-lg text-fg1">
                Personalized workout plans that adapt to your performance. PCOS-safe programming.
                Offline-ready logging. No BS.
              </p>
            </div>

            {/* CTA */}
            <div className="space-y-4">
              <PrimaryButton
                onClick={handleSignIn}
                disabled={isLoading || !supabase}
                loading={isLoading}
                className="h-14 w-full max-w-sm text-base"
              >
                {isLoading ? 'Redirecting...' : 'Continue with Google'}
              </PrimaryButton>

              {/* Trust Signals */}
              <div className="flex flex-col gap-2 text-sm text-fg2">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-accent" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-accent" />
                  <span>Takes 2 minutes to start</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-accent" />
                  <span>Free forever</span>
                </div>
              </div>

              {errorMessage && (
                <p className="text-sm text-error">{errorMessage}</p>
              )}
            </div>

            {/* PWA Install Message */}
            <div className="rounded-lg border border-accent-subtle bg-accent-muted p-4">
              <div className="flex items-start gap-3">
                <Smartphone className="h-5 w-5 flex-shrink-0 text-accent" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-fg0">Built for Mobile</p>
                  <p className="text-xs text-fg2">
                    Add FitCoach to your home screen for an app-like experience.
                    Works offline, loads instantly.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - App Preview Placeholder */}
          <div className="flex items-center justify-center lg:justify-end">
            <div className="relative w-full max-w-sm">
              {/* Phone Mockup Frame */}
              <div className="relative aspect-[9/19.5] w-full rounded-3xl border-8 border-line1 bg-bg1 shadow-2xl">
                {/* Screen Content - Placeholder */}
                <div className="flex h-full flex-col items-center justify-center space-y-4 p-8 text-center">
                  <div className="h-24 w-24 rounded-full bg-accent-muted" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 rounded bg-line1" />
                    <div className="h-4 w-24 rounded bg-line1" />
                  </div>
                  <p className="text-xs text-fg2">App Screenshot Placeholder</p>
                </div>
              </div>
              {/* Glow Effect */}
              <div className="absolute inset-0 -z-10 rounded-3xl bg-accent opacity-5 blur-3xl" />
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="border-t border-line1 bg-bg1 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-fg0 sm:text-4xl">
              Everything You Need. Nothing You Don't.
            </h2>
            <p className="mt-4 text-lg text-fg1">
              Professional coaching without the complexity.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <Card className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent-muted">
                <Brain className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-fg0">Smart Planning</h3>
              <p className="text-sm text-fg1">
                AI generates workout structure (micro-cycles, splits, volume). You control the loads
                with math-based progression. Plans adapt week-by-week based on actual performance.
              </p>
            </Card>

            {/* Feature 2 */}
            <Card className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent-muted">
                <Shield className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-fg0">PCOS-Safe Training</h3>
              <p className="text-sm text-fg1">
                Built-in guardrails: Zone-2 cardio, low-impact options. No HIIT over 60s,
                recovery-focused programming. Medical-grade safety without sacrificing results.
              </p>
            </Card>

            {/* Feature 3 */}
            <Card className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent-muted">
                <WifiOff className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-fg0">Offline-Ready</h3>
              <p className="text-sm text-fg1">
                Log workouts anywhere, no internet needed. Automatic sync when you're back online.
                PWA technology for app-like experience on mobile.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-fg0 sm:text-4xl">How It Works</h2>
            <p className="mt-4 text-lg text-fg1">
              Three simple steps to start training smarter.
            </p>
          </div>

          <div className="space-y-12">
            {/* Step 1 */}
            <div className="flex gap-6">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-accent text-lg font-bold text-gray-950">
                1
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-fg0">Quick Onboarding</h3>
                <p className="text-fg1">
                  Tell us your goals, experience, and available equipment. Takes 2 minutes.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-6">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-accent text-lg font-bold text-gray-950">
                2
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-fg0">Get Your Plan</h3>
                <p className="text-fg1">
                  AI generates Week 1 structure based on your profile. You track performance with
                  simple logging.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-6">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-accent text-lg font-bold text-gray-950">
                3
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-fg0">Progress Intelligently</h3>
                <p className="text-fg1">
                  Plans adapt based on actual performance, not guesswork. Progressive overload that's
                  actually progressive.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="border-t border-line1 bg-bg1 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-fg0 sm:text-4xl">
              Built for Lifters, by Lifters
            </h2>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            {/* Testimonial 1 */}
            <Card className="space-y-4">
              <p className="text-fg1">
                "Finally, a fitness app that feels like working with a real coach. No gimmicks, just
                solid programming that adapts to my progress."
              </p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-accent-muted" />
                <div>
                  <p className="font-semibold text-fg0">Sarah M.</p>
                  <p className="text-sm text-fg2">Intermediate Lifter</p>
                </div>
              </div>
            </Card>

            {/* Testimonial 2 */}
            <Card className="space-y-4">
              <p className="text-fg1">
                "PCOS-safe training that doesn't feel restrictive. The week-by-week adaptation keeps
                me motivated and progressing safely."
              </p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-accent-muted" />
                <div>
                  <p className="font-semibold text-fg0">Jessica K.</p>
                  <p className="text-sm text-fg2">Beginner, PCOS</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="mb-4 text-3xl font-bold text-fg0 sm:text-4xl">Ready to Train Smarter?</h2>
          <p className="mb-8 text-lg text-fg1">
            Join lifters who are progressing with structure and intelligence.
          </p>

          <PrimaryButton
            onClick={handleSignIn}
            disabled={isLoading || !supabase}
            loading={isLoading}
            className="h-14 text-base"
          >
            {isLoading ? 'Redirecting...' : 'Start Your Free Plan'}
            {!isLoading && <ArrowRight className="ml-2 h-5 w-5" />}
          </PrimaryButton>

          <p className="mt-4 text-sm text-fg2">No credit card. No BS. Just training.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line1 py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 text-sm text-fg2 sm:flex-row">
            <p>
              © {new Date().getFullYear()} {publicEnv.NEXT_PUBLIC_APP_NAME}
            </p>
            <div className="flex gap-6">
              <button className="hover:text-fg0 transition-colors">Privacy</button>
              <button className="hover:text-fg0 transition-colors">Terms</button>
              <button className="hover:text-fg0 transition-colors">Medical Disclaimer</button>
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-fg2">
            {publicEnv.NEXT_PUBLIC_APP_NAME} is not medical advice. Consult your doctor before
            starting any new fitness program.
          </p>
        </div>
      </footer>
    </div>
  );
}
