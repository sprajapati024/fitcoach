import { getUserProfileAction } from "@/app/actions/profile";
import { signOutAction } from "@/app/actions/auth";
import { ProfileForm } from "./ProfileForm";

export default async function ProfileSettingsPage() {
  const profile = await getUserProfileAction();

  return <ProfileForm profile={profile} signOutAction={signOutAction} />;
}
