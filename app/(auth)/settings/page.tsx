import { signOutAction } from "@/app/actions/auth";

export default function SettingsPage() {
  return (
    <div className="space-y-6 p-6 text-fg0">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-fg2">Manage preferences coming soon.</p>
      </div>

      <form action={signOutAction}>
        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center rounded-full border border-line1 px-5 text-sm font-medium uppercase tracking-wide text-fg0 transition hover:bg-bg1"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
