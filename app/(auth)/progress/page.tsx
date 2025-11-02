import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { workoutLogs, workoutLogSets } from "@/drizzle/schema";
import { desc, eq, sql } from "drizzle-orm";
import { Card } from "@/components/Card";

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

  const totalSets = totalSetsResult[0]?.totalSets ?? 0;

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
  });

  return (
    <div className="min-h-screen bg-bg0 p-6 text-fg0">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold">Progress</h1>
          <p className="text-sm text-fg2">Quick snapshot of your recent training momentum.</p>
        </div>

        <Card className="space-y-4 bg-bg1/80">
          <div>
            <h2 className="text-lg font-semibold text-fg0">Training Summary</h2>
            <p className="text-sm text-fg2">
              Totals reflect the most recent 90 sessions we have on record.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-line1/60 bg-bg0 p-4">
              <p className="text-xs uppercase tracking-wide text-fg2">Workouts completed</p>
              <p className="mt-1 text-2xl font-semibold text-fg0">{totalCompleted}</p>
              <p className="text-xs text-fg2">Last workout {lastWorkoutDate ?? "—"}</p>
            </div>

            <div className="rounded-lg border border-line1/60 bg-bg0 p-4">
              <p className="text-xs uppercase tracking-wide text-fg2">Workouts skipped</p>
              <p className="mt-1 text-2xl font-semibold text-fg0">{totalSkipped}</p>
              <p className="text-xs text-fg2">Includes logged rest or missed sessions.</p>
            </div>

            <div className="rounded-lg border border-line1/60 bg-bg0 p-4">
              <p className="text-xs uppercase tracking-wide text-fg2">Sets logged</p>
              <p className="mt-1 text-2xl font-semibold text-fg0">{Number(totalSets)}</p>
              <p className="text-xs text-fg2">All time recorded sets.</p>
            </div>

            <div className="rounded-lg border border-line1/60 bg-bg0 p-4">
              <p className="text-xs uppercase tracking-wide text-fg2">7-day adherence</p>
              <p className="mt-1 text-2xl font-semibold text-fg0">
                {windowCompliance !== null ? `${windowCompliance}%` : "—"}
              </p>
              <p className="text-xs text-fg2">
                {windowLogs.length > 0
                  ? `${completedWindow}/${windowLogs.length} scheduled sessions`
                  : "No sessions logged this week."}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-line1/60 bg-bg0 p-4">
            <p className="text-xs uppercase tracking-wide text-fg2">Average RPE (last 5)</p>
            <p className="mt-1 text-xl font-semibold text-fg0">
              {averageRpe !== null ? averageRpe.toFixed(1) : "—"}
            </p>
            <p className="text-xs text-fg2">
              {recentRpeValues.length > 0
                ? "Based on your five most recent completed workouts."
                : "Log a few sessions with RPE to see this populate."}
            </p>
          </div>

          {logs.length === 0 ? (
            <p className="text-sm text-fg2">
              No training history yet. Once you start logging workouts, we&apos;ll chart your streaks
              and load.
            </p>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
