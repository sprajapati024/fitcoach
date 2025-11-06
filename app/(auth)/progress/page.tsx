import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { workoutLogs, workoutLogSets } from "@/drizzle/schema";
import { desc, eq, sql } from "drizzle-orm";
import { ProgressView } from "./ProgressView";

function toIsoDate(value: string | Date | null): Date | null {
  if (!value) return null;
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

export default async function ProgressPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/");
  }

  const logs = await db
    .select()
    .from(workoutLogs)
    .where(eq(workoutLogs.userId, user.id))
    .orderBy(desc(workoutLogs.sessionDate), desc(workoutLogs.createdAt))
    .limit(90);

  const totalSetsResult = await db
    .select({
      totalSets: sql<number>`count(*)`,
    })
    .from(workoutLogSets)
    .innerJoin(workoutLogs, eq(workoutLogs.id, workoutLogSets.logId))
    .where(eq(workoutLogs.userId, user.id));

  const totalSets = Number(totalSetsResult[0]?.totalSets ?? 0);

  const completedLogs = logs.filter((log) => Number(log.totalDurationMinutes ?? 0) > 0);
  const skippedLogs = logs.filter((log) => Number(log.totalDurationMinutes ?? 0) === 0);

  const totalCompleted = completedLogs.length;
  const totalSkipped = skippedLogs.length;

  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 6);

  const windowLogs = logs.filter((log) => {
    const session = toIsoDate(log.sessionDate);
    if (!session) return false;
    return session >= sevenDaysAgo && session <= now;
  });

  const completedWindow = windowLogs.filter((log) => Number(log.totalDurationMinutes ?? 0) > 0).length;
  const windowCompliance =
    windowLogs.length > 0 ? Math.round((completedWindow / windowLogs.length) * 100) : null;

  const recentRpeValues = completedLogs
    .map((log) => (log.rpeLastSet ? Number(log.rpeLastSet) : null))
    .filter((value): value is number => typeof value === "number" && !Number.isNaN(value))
    .slice(0, 5);

  const averageRpe =
    recentRpeValues.length > 0
      ? Math.round(
          (recentRpeValues.reduce((sum, value) => sum + value, 0) / recentRpeValues.length) * 10,
        ) / 10
      : null;

  const lastWorkout = completedLogs[0];
  const lastWorkoutDate = toIsoDate(lastWorkout?.sessionDate)?.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  }) ?? null;

  return (
    <ProgressView
      totalCompleted={totalCompleted}
      totalSkipped={totalSkipped}
      totalSets={totalSets}
      windowCompliance={windowCompliance}
      completedWindow={completedWindow}
      windowTotal={windowLogs.length}
      averageRpe={averageRpe}
      recentRpeCount={recentRpeValues.length}
      lastWorkoutDate={lastWorkoutDate}
    />
  );
}
