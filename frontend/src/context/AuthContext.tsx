import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { authService } from "../services/auth.ts";
import type {
  AuthUser,
  AuthSession,
  LoginRequest,
  RegisterRequest,
} from "../types/index.ts";

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface AuthContextType {
  user: AuthUser | null;
  companyName: string | null;
  tokens: TokenPair | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function readStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(key);
}

function writeSession(session: AuthSession) {
  localStorage.setItem("access_token", session.tokens.accessToken);
  localStorage.setItem("refresh_token", session.tokens.refreshToken);
  localStorage.setItem("auth_user", JSON.stringify(session.user));
  localStorage.setItem("auth_company", session.company?.name ?? "");
}

function clearSession() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("auth_user");
  localStorage.removeItem("auth_company");
}

function readCachedUser(): AuthUser | null {
  const raw = readStorage("auth_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [tokens, setTokens] = useState<TokenPair | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const access = readStorage("access_token");
    const refresh = readStorage("refresh_token");
    if (access && refresh) {
      setTokens({ accessToken: access, refreshToken: refresh });
      setUser(readCachedUser());
      setCompanyName(readStorage("auth_company") || null);
    }
    setLoading(false);
  }, []);

  // The API layer raises this when a session can no longer be renewed. Clear
  // React state so PrivateRoute immediately redirects to /login.
  useEffect(() => {
    const handleExpired = () => {
      clearSession();
      setUser(null);
      setCompanyName(null);
      setTokens(null);
    };

    window.addEventListener("auth:expired", handleExpired);
    return () => window.removeEventListener("auth:expired", handleExpired);
  }, []);

  const applySession = (session: AuthSession) => {
    writeSession(session);
    setTokens(session.tokens);
    setUser(session.user);
    setCompanyName(session.company?.name ?? null);
  };

  const login = async (data: LoginRequest) => {
    const session = await authService.login(data);
    applySession(session);
  };

  const register = async (data: RegisterRequest) => {
    const session = await authService.register(data);
    applySession(session);
  };

  const logout = async () => {
    try {
      if (tokens) await authService.logout();
    } catch {
      // The local session must always be cleared, even if the server call
      // fails (expired token, offline, etc.).
    } finally {
      clearSession();
      setUser(null);
      setCompanyName(null);
      setTokens(null);
    }
  };

  const refresh = async () => {
    if (!tokens?.refreshToken) throw new Error("No refresh token");
    const res = await authService.refresh(tokens.refreshToken);
    const next: TokenPair = {
      accessToken: res.accessToken,
      refreshToken: tokens.refreshToken,
    };
    setTokens(next);
    localStorage.setItem("access_token", next.accessToken);
    localStorage.setItem("refresh_token", next.refreshToken);
  };

  const isAuthenticated = !!tokens?.accessToken;

  return (
    <AuthContext.Provider
      value={{
        user,
        companyName,
        tokens,
        loading,
        isAuthenticated,
        login,
        register,
        logout,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
