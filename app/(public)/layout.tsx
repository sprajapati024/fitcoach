import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

interface PublicLayoutProps {
  children: ReactNode;
}

export default async function PublicLayout({ children }: PublicLayoutProps) {
  const session = await getSession();
  if (session) {
    // Check if user has completed onboarding
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, session.user.id),
    });

    // Redirect to onboarding if no profile, otherwise to dashboard
    redirect(profile ? "/dashboard" : "/onboarding");
  }
  return <>{children}</>;
}
