import { getCurrentUser } from "@/lib/auth";
import { getUserProfileAction } from "@/app/actions/profile";
import { getTodayNutrition } from "@/app/actions/nutrition";
import { TodayView } from "./TodayView";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/');
  }

  const [profile, nutrition] = await Promise.all([
    getUserProfileAction(),
    getTodayNutrition(),
  ]);

  return <TodayView userId={user.id} nutrition={nutrition} />;
}
