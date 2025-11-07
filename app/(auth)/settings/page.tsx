import { signOutAction } from "@/app/actions/auth";
import { getUserProfileAction } from "@/app/actions/profile";
import { getUserPlansAction } from "@/app/actions/plan";
import { SettingsViewWrapper } from "./SettingsViewWrapper";

export default async function SettingsPage() {
  const profile = await getUserProfileAction();
  const userPlans = await getUserPlansAction();

  return (
    <SettingsViewWrapper
      profile={profile}
      userPlans={userPlans}
      signOutAction={signOutAction}
    />
  );
}
