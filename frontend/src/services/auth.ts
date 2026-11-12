import { api } from "./api.ts";
import type {
  LoginRequest,
  RegisterRequest,
  AuthSession,
  RefreshResult,
} from "../types/index.ts";

export const authService = {
  login: (data: LoginRequest) => api.post<AuthSession>("/api/auth/login", data),

  register: (data: RegisterRequest) =>
    api.post<AuthSession>("/api/auth/register-company", data),

  refresh: (refreshToken: string) =>
    api.post<RefreshResult>("/api/auth/refresh", { refreshToken }),

  logout: () => api.post<{ message: string }>("/api/auth/logout", {}),
};
