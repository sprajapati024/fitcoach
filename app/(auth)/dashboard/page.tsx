import { getCurrentUser } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  return (
    <div className="space-y-2 p-6 text-fg0">
      <div>
        <h1 className="text-2xl font-semibold">Today</h1>
        <p className="text-sm text-fg2">Dashboard view coming soon.</p>
      </div>
      {user ? (
        <p className="text-xs text-fg2">
          Signed in as
          {" "}
          <span className="font-medium text-fg1">{user.email}</span>
        </p>
      ) : null}
    </div>
  );
}
