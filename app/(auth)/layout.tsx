import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

interface AuthLayoutProps {
  children: ReactNode;
}

export default async function AuthLayout({ children }: AuthLayoutProps) {
  const session = await getSession();
  if (!session) {
    redirect("/");
  }

  return <div className="min-h-screen bg-bg0 text-fg0">{children}</div>;
}
