/// <reference types="vite/client" />
import type { ApiError } from "../types/index.ts";

// Service paths already start with "/api/...", so the base must not append
// another "/api". Empty base = same-origin requests, proxied by Vite in dev.
const API_BASE =
  (typeof import.meta.env !== "undefined" &&
    (import.meta.env as { VITE_API_URL?: string }).VITE_API_URL) ||
  "";

const AUTH_PATHS = new Set([
  "/api/auth/login",
  "/api/auth/register-company",
  "/api/auth/refresh",
  "/api/auth/logout",
]);

const SESSION_NOTICE_KEY = "auth_notice";

class ApiErrorClass extends Error implements ApiError {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
  }
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refresh_token");
}

function clearStoredSession() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("auth_user");
  localStorage.removeItem("auth_company");
}

/**
 * Read a JWT payload without verifying the signature. Used only to recognise
 * an obviously dead refresh token (malformed or past its exp claim) before
 * asking the server. Signature verification still happens on the backend.
 */
function refreshTokenIsDead(token: string): boolean {
  try {
    const part = token.split(".")[1];
    if (!part) return true;

    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const payload = JSON.parse(new TextDecoder().decode(bytes)) as {
      exp?: number;
    };

    if (typeof payload.exp !== "number") return false;
    return payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

function requestPath(input: RequestInfo | URL): string {
  try {
    return new URL(String(input), window.location.origin).pathname;
  } catch {
    return String(input);
  }
}

let refreshInFlight: Promise<"ok" | "invalid" | "transient"> | null = null;

/**
 * Exchange the stored refresh token for a new access token.
 *
 * Single-flight: if several requests receive 401 at the same time, only one
 * refresh request is sent. The backend keeps the refresh token server-side in
 * Redis and rejects anything that does not match, so this is safe.
 */
function renewSession(): Promise<"ok" | "invalid" | "transient"> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async (): Promise<"ok" | "invalid" | "transient"> => {
    const refreshToken = getRefreshToken();
    if (!refreshToken || refreshTokenIsDead(refreshToken)) return "invalid";

    try {
      const res = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      // A rejected refresh token can never be recovered — end the session.
      if (res.status === 400 || res.status === 401 || res.status === 403) {
        return "invalid";
      }
      if (!res.ok) return "transient";

      const body = (await res.json()) as unknown;
      const payload =
        body &&
        typeof body === "object" &&
        (body as { success?: boolean }).success === true &&
        "data" in (body as Record<string, unknown>)
          ? (body as { data: { accessToken?: string } }).data
          : (body as { accessToken?: string });

      if (!payload?.accessToken) return "invalid";

      localStorage.setItem("access_token", payload.accessToken);
      return "ok";
    } catch {
      // Network failure: do not destroy a potentially valid session.
      return "transient";
    }
  })();

  return refreshInFlight.finally(() => {
    refreshInFlight = null;
  });
}

function expireSession() {
  clearStoredSession();
  try {
    sessionStorage.setItem(
      SESSION_NOTICE_KEY,
      "Your session expired. Please sign in again."
    );
  } catch {
    // sessionStorage may be unavailable; the redirect still works.
  }
  // AuthContext listens for this, clears React state, and PrivateRoute sends
  // the user to /login.
  window.dispatchEvent(new Event("auth:expired"));
}

async function send(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  token: string | null
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init?.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  const callerSignal = init?.signal;
  const forwardAbort = () => controller.abort();
  if (callerSignal) {
    if (callerSignal.aborted) {
      controller.abort();
    } else {
      callerSignal.addEventListener("abort", forwardAbort);
    }
  }

  try {
    return await fetch(`${API_BASE}${input}`, {
      ...init,
      headers,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
    if (callerSignal) {
      callerSignal.removeEventListener("abort", forwardAbort);
    }
  }
}

async function request<T>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const path = requestPath(input);
  const isAuthEndpoint = AUTH_PATHS.has(path);

  let token = getToken();
  let response: Response;
  let sessionExpired = false;

  try {
    response = await send(input, init, token);
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new ApiErrorClass("Request timed out", 504);
    }
    throw new ApiErrorClass((err as Error)?.message ?? "Unknown error", 500);
  }

  // Access tokens last 15 minutes. On expiry, renew silently and replay the
  // request once. Never retry credentials endpoints or requests with no token.
  if (response.status === 401 && token && !isAuthEndpoint) {
    const outcome = await renewSession();

    if (outcome === "ok") {
      token = getToken();
      try {
        response = await send(input, init, token);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          throw new ApiErrorClass("Request timed out", 504);
        }
        throw new ApiErrorClass(
          (err as Error)?.message ?? "Unknown error",
          500
        );
      }
    } else if (outcome === "invalid") {
      expireSession();
      sessionExpired = true;
    }
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = (await response.json()) as { message?: string };
      if (body?.message) message = body.message;
    } catch {
      // ignore parse errors
    }

    if (sessionExpired) {
      message = "Your session expired. Please sign in again.";
    } else if (response.status === 401 && path === "/api/auth/login") {
      message = "Invalid email or password.";
    } else if (response.status >= 500) {
      message = "The server could not complete the request. Please try again.";
    }

    throw new ApiErrorClass(message, response.status);
  }

  if (response.status === 204) return undefined as T;

  const body = (await response.json()) as unknown;

  // The backend wraps every response as { success: true, data: ... }.
  if (
    body &&
    typeof body === "object" &&
    (body as { success?: boolean }).success === true &&
    "data" in (body as Record<string, unknown>)
  ) {
    return (body as { data: T }).data;
  }

  return body as T;
}

export const api = {
  get: <T>(path: string, init?: RequestInit) => request<T>(path, init),
  post: <T>(path: string, body: unknown, init?: RequestInit) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body), ...init }),
  patch: <T>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>(path, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
      ...init,
    }),
  delete: <T>(path: string, init?: RequestInit) =>
    request<T>(path, { method: "DELETE", ...init }),
};

export type { ApiErrorClass };
