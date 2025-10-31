import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { OnboardingForm } from "./OnboardingForm";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles } from "@/drizzle/schema";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/");
  }

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, user.id),
  });

  return <OnboardingForm initialProfile={profile} />;
}
