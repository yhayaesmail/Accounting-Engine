"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { BootScreen } from "@/components/boot-screen";
import { AppShell } from "@/components/app-shell";
import { useSession } from "@/lib/session";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { session, ready } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (ready && !session) {
      router.replace("/login");
    }
  }, [ready, session, router]);

  if (!ready || !session) {
    return <BootScreen label="Preparing your workspace…" />;
  }

  return <AppShell>{children}</AppShell>;
}
