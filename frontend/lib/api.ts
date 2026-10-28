"use client";

import { clearSession, loadSession, markSessionExpired, saveSession } from "./auth-store";
import type { ApiEnvelope, AuthResponse, RefreshResponse } from "./types";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
  skipRefresh?: boolean;
}

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const session = loadSession();
    if (!session?.refreshToken) return null;

    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: session.refreshToken }),
        cache: "no-store",
      });
      const json = (await response.json().catch(() => null)) as ApiEnvelope<RefreshResponse> | null;
      const accessToken = json?.data?.accessToken;

      if (!response.ok || !json?.success || !accessToken) {
        markSessionExpired();
        return null;
      }

      saveSession({ ...session, accessToken });
      return accessToken;
    } catch {
      markSessionExpired();
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuth = false, skipRefresh = false, ...init } = options;
  const headers = new Headers(init.headers);
  const session = loadSession();

  if (!skipAuth && session?.accessToken) {
    headers.set("Authorization", `Bearer ${session.accessToken}`);
  }

  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      ...init,
      headers,
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      "Could not reach the API. Check that the backend is running and try again.",
      0,
    );
  }

  if (response.status === 401 && !skipAuth && !skipRefresh) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return api<T>(path, { ...options, skipRefresh: true });
    }
  }

  const json = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok || json?.success === false) {
    if (response.status === 401 && !skipAuth) {
      clearSession();
    }
    throw new ApiError(
      json?.message || `The request failed (${response.status}).`,
      response.status,
    );
  }

  return json?.data as T;
}

export async function loginRequest(
  email: string,
  password: string,
): Promise<AuthResponse> {
  return api<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    skipAuth: true,
    skipRefresh: true,
  });
}

export async function registerRequest(
  companyName: string,
  email: string,
  password: string,
): Promise<AuthResponse> {
  return api<AuthResponse>("/auth/register-company", {
    method: "POST",
    body: JSON.stringify({ companyName, email, password }),
    skipAuth: true,
    skipRefresh: true,
  });
}

export async function logoutRequest(): Promise<void> {
  await api<{ success: boolean }>("/auth/logout", { method: "POST" });
}
