"use client";

import type { Session } from "./types";

const SESSION_KEY = "ae.session";
const EXPIRED_KEY = "ae.session-expired";
const SESSION_EVENT = "ae-session-changed";

let cached: Session | null | undefined;

export function loadSession(): Session | null {
  if (cached !== undefined) return cached;
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) {
      cached = null;
      return null;
    }
    const parsed = JSON.parse(raw) as Session;
    if (!parsed?.accessToken || !parsed?.user?.id) {
      cached = null;
      return null;
    }
    cached = parsed;
    return parsed;
  } catch {
    cached = null;
    return null;
  }
}

export function saveSession(session: Session): void {
  cached = session;
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function clearSession(options: { expired?: boolean } = {}): void {
  cached = null;
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
  if (options.expired) {
    window.sessionStorage.setItem(EXPIRED_KEY, "1");
  }
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function markSessionExpired(): void {
  clearSession({ expired: true });
}

export function consumeExpiredFlag(): boolean {
  if (typeof window === "undefined") return false;
  const expired = window.sessionStorage.getItem(EXPIRED_KEY) === "1";
  if (expired) window.sessionStorage.removeItem(EXPIRED_KEY);
  return expired;
}

export function onSessionChange(listener: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const handleStorage = (event: StorageEvent) => {
    if (event.key === SESSION_KEY) {
      cached = undefined;
      listener();
    }
  };
  const handleCustom = () => {
    cached = undefined;
    listener();
  };
  window.addEventListener("storage", handleStorage);
  window.addEventListener(SESSION_EVENT, handleCustom);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(SESSION_EVENT, handleCustom);
  };
}
