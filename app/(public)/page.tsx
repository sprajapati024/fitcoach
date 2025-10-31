export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-bg0 text-fg0">
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-10 px-6 py-16 sm:px-8">
        <div className="space-y-4 text-left">
          <p className="text-sm uppercase tracking-[0.3em] text-fg2">
            FitCoach · Monochrome PWA
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
            className="inline-flex h-12 items-center justify-center rounded-full bg-fg0 px-6 text-sm font-medium uppercase tracking-wide text-bg0 transition hover:bg-fg1"
          >
            Continue with Google
          </button>
          <p className="text-xs text-fg2">
            By continuing you agree to the training terms and acknowledge FitCoach
            is not medical advice.
          </p>
        </div>
      </main>
      <footer className="px-6 pb-8 text-xs text-fg2 sm:px-8">
        <span>© {new Date().getFullYear()} FitCoach</span>
      </footer>
    </div>
  );
}
