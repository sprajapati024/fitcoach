import {
  getActivePlanAction,
  getUserPlansAction,
  getPlanWorkoutsAction,
  getPlanWorkoutLogsAction,
} from "@/app/actions/plan";
import { PlanView } from "./PlanView";

export default async function PlanPage() {
  const activePlan = await getActivePlanAction();
  const userPlans = await getUserPlansAction();

  // Fetch workouts if there's an active plan
  const workouts = activePlan ? await getPlanWorkoutsAction(activePlan.id) : [];
  const workoutLogs = activePlan ? await getPlanWorkoutLogsAction(activePlan.id) : [];

  return (
    <PlanView
      activePlan={activePlan}
      userPlans={userPlans}
      workouts={workouts}
      workoutLogs={workoutLogs}
    />
  );
}
