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
    <div className="min-h-screen bg-bg0 p-4 text-fg0 md:p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-4 text-2xl font-semibold md:mb-6">Your Training Plan</h1>
        <PlanView
          activePlan={activePlan}
          userPlans={userPlans}
          workouts={workouts}
          workoutLogs={workoutLogs}
        />
      </div>
    </div>
  );
}
