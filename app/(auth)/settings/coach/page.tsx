import { getUserProfileAction } from "@/app/actions/profile";
import { CoachForm } from "./CoachForm";

export default async function CoachSettingsPage() {
  const profile = await getUserProfileAction();

  return <CoachForm profile={profile} />;
}
