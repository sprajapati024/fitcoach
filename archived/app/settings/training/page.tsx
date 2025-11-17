import { getUserProfileAction } from "@/app/actions/profile";
import { TrainingForm } from "./TrainingForm";

export default async function TrainingSettingsPage() {
  const profile = await getUserProfileAction();

  return <TrainingForm profile={profile} />;
}
