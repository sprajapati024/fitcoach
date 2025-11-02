import { getActivePlanAction, getUserPlansAction, getPlanWorkoutsAction } from "@/app/actions/plan";
import { PlanView } from "./PlanView";

export default async function PlanPage() {
  const activePlan = await getActivePlanAction();
  const userPlans = await getUserPlansAction();

  // Fetch workouts if there's an active plan
  const workouts = activePlan ? await getPlanWorkoutsAction(activePlan.id) : [];

  return (
    <div className="min-h-screen bg-bg0 p-6 text-fg0">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-6 text-2xl font-semibold">Your Training Plan</h1>
        <PlanView activePlan={activePlan} userPlans={userPlans} workouts={workouts} />
      </div>
    </div>
  );
}
