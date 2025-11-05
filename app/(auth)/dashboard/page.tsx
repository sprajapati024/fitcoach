import { getCurrentUser } from "@/lib/auth";
import { getTodayWorkout } from "@/app/actions/dashboard";
import { getUserProfileAction } from "@/app/actions/profile";
import { getTodayNutrition } from "@/app/actions/nutrition";
import { TodayView } from "./TodayView";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/');
  }

  const [workout, profile, nutrition] = await Promise.all([
    getTodayWorkout(),
    getUserProfileAction(),
    getTodayNutrition(),
  ]);

  return <TodayView workout={workout} userId={user.id} userName={profile?.fullName} nutrition={nutrition} />;
}
