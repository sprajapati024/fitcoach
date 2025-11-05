import { signOutAction } from "@/app/actions/auth";
import { getUserProfileAction } from "@/app/actions/profile";
import { getUserPlansAction } from "@/app/actions/plan";
import { SettingsView } from "./SettingsView";

export default async function SettingsPage() {
  const profile = await getUserProfileAction();
  const userPlans = await getUserPlansAction();

  return (
    <div className="min-h-screen bg-surface-0 p-4 text-text-primary md:p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-sm text-text-muted">Manage your preferences and plans</p>
        </div>

        <SettingsView profile={profile} userPlans={userPlans} />

        <div className="rounded-lg border border-surface-border bg-surface-0 p-6">
          <h2 className="mb-4 text-lg font-semibold text-text-primary">Account</h2>
          <form action={signOutAction}>
            <button
              type="submit"
              className="touch-feedback inline-flex h-11 items-center justify-center rounded-full border border-surface-border px-5 text-sm font-medium uppercase tracking-wide text-text-primary transition-all active:bg-surface-2"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
