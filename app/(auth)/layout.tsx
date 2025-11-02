import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { DesktopNav } from "@/components/navigation/DesktopNav";
import { BottomNav } from "@/components/navigation/BottomNav";

interface AuthLayoutProps {
  children: ReactNode;
}

export default async function AuthLayout({ children }: AuthLayoutProps) {
  const session = await getSession();
  if (!session) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg0 text-fg0">
      <DesktopNav />
      <main className="flex-1 pb-28 md:pb-8">{children}</main>
      <BottomNav />
    </div>
  );
}
