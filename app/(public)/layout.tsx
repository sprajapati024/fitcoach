import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

interface PublicLayoutProps {
  children: ReactNode;
}

export default async function PublicLayout({ children }: PublicLayoutProps) {
  const user = await getCurrentUser();
  if (user) {
    // Check if user has completed onboarding
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, user.id),
    });

    // Redirect to onboarding if no profile, otherwise to dashboard
    redirect(profile ? "/dashboard" : "/onboarding");
  }
  return <>{children}</>;
}
