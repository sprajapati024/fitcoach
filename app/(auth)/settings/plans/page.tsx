import { getUserPlansAction } from "@/app/actions/plan";
import { PlansManager } from "./PlansManager";

export default async function PlansSettingsPage() {
  const userPlans = await getUserPlansAction();

  return <PlansManager userPlans={userPlans} />;
}
