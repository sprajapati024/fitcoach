import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { DesktopNav } from "@/components/navigation/DesktopNav";
import { MobileHeader } from "@/components/navigation/MobileHeader";
import { ConditionalBottomNav } from "@/components/navigation/ConditionalBottomNav";

interface AuthLayoutProps {
  children: ReactNode;
}

export default async function AuthLayout({ children }: AuthLayoutProps) {
  const session = await getSession();
  if (!session) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen-ios flex-col bg-black text-text-primary" style={{ paddingTop: 'var(--safe-top)' }}>
      <MobileHeader />
      <DesktopNav />
      <main className="flex-1 px-4 pb-32 pt-6 md:px-8 md:pb-8 md:pt-6">{children}</main>
      <ConditionalBottomNav />
    </div>
  );
}
