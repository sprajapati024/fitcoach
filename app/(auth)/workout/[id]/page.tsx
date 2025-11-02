import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { workouts } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { WorkoutDetailView } from "./WorkoutDetailView";

interface WorkoutPageProps {
  params: Promise<{ id: string }>;
}

export default async function WorkoutPage({ params }: WorkoutPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/");
  }

  const { id } = await params;

  // Fetch workout by ID
  const [workout] = await db
    .select()
    .from(workouts)
    .where(eq(workouts.id, id))
    .limit(1);

  if (!workout) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-semibold text-fg0 mb-2">Workout Not Found</h1>
        <p className="text-fg2">The workout you&apos;re looking for doesn&apos;t exist.</p>
      </div>
    );
  }

  // Verify this workout belongs to the user
  if (workout.userId !== user.id) {
    redirect("/dashboard");
  }

  return <WorkoutDetailView workout={workout} />;
}
