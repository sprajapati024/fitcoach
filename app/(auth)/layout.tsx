import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { DesktopNav } from "@/components/navigation/DesktopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { RouteTransitionProvider } from "@/components/providers/RouteTransitionProvider";

interface AuthLayoutProps {
  children: ReactNode;
}

export default async function AuthLayout({ children }: AuthLayoutProps) {
  const session = await getSession();
  if (!session) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen-ios flex-col bg-surface-0 text-text-primary" style={{ paddingTop: 'var(--safe-top)' }}>
      <DesktopNav />
      <RouteTransitionProvider>
        <main className="flex-1 px-4 pb-32 pt-6 md:px-8 md:pb-8 md:pt-6">{children}</main>
      </RouteTransitionProvider>
      <BottomNav />
    </div>
  );
}
