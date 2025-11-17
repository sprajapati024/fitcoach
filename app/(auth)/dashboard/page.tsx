import { getCurrentUser } from "@/lib/auth";
import { getUserProfileAction } from "@/app/actions/profile";
import { getTodayNutrition } from "@/app/actions/nutrition";
import { getActivePlanAction } from "@/app/actions/plan";
import { TodayView } from "./TodayView";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/');
  }

  const [profile, nutrition, activePlan] = await Promise.all([
    getUserProfileAction(),
    getTodayNutrition(),
    getActivePlanAction(),
  ]);

  return <TodayView userId={user.id} nutrition={nutrition} hasActivePlan={!!activePlan} />;
}
