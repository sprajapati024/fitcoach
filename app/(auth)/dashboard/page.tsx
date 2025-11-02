import { getCurrentUser } from "@/lib/auth";
import { getTodayWorkout } from "@/app/actions/dashboard";
import { TodayView } from "./TodayView";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/');
  }

  const workout = await getTodayWorkout();

  return <TodayView workout={workout} userId={user.id} />;
}
