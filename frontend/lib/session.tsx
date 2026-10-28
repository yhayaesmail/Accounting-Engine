"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { loadSession, onSessionChange, saveSession, clearSession } from "./auth-store";
import { logoutRequest } from "./api";
import type { AuthResponse, Session } from "./types";

interface SessionContextValue {
  session: Session | null;
  ready: boolean;
  signIn: (payload: AuthResponse) => Session;
  signOut: () => Promise<void>;
  updateCompany: (name: string) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

function toSession(payload: AuthResponse): Session {
  return {
    user: payload.user,
    company: payload.company,
    accessToken: payload.tokens.accessToken,
    refreshToken: payload.tokens.refreshToken,
  };
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setSession(loadSession());
    setReady(true);
    return onSessionChange(() => setSession(loadSession()));
  }, []);

  const signIn = useCallback((payload: AuthResponse) => {
    const next = toSession(payload);
    saveSession(next);
    setSession(next);
    return next;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      // The local session should still be cleared if the server session has already gone.
    }
    clearSession();
    setSession(null);
    router.replace("/login");
  }, [router]);

  const updateCompany = useCallback((name: string) => {
    const current = loadSession();
    if (!current?.company) return;
    const next = { ...current, company: { ...current.company, name } };
    saveSession(next);
    setSession(next);
  }, []);

  const value = useMemo(
    () => ({ session, ready, signIn, signOut, updateCompany }),
    [session, ready, signIn, signOut, updateCompany],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used inside SessionProvider");
  }
  return context;
}
