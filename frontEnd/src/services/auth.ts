import { api } from "./api";
import type { LoginCredentials, RegisterData } from "@/features/auth/types";

export const authService = {
  login: async (credentials: LoginCredentials) => {
    const response = await api.post("/auth/login/", credentials);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Login failed");
    }
    const data = await response.json();
    localStorage.setItem("learnlab_auth_token", data.access);
    localStorage.setItem("learnlab_refresh_token", data.refresh);
    return data;
  },

  register: async (userData: RegisterData) => {
    const response = await api.post("/auth/register/", userData);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Registration failed");
    }
    return await response.json();
  },

  logout: () => {
    localStorage.removeItem("learnlab_auth_token");
    localStorage.removeItem("learnlab_refresh_token");
  },

  refreshToken: async () => {
    const refresh = localStorage.getItem("learnlab_refresh_token");
    if (!refresh) throw new Error("No refresh token");
    const response = await api.post("/auth/refresh/", { refresh });
    if (!response.ok) throw new Error("Refresh failed");
    return await response.json();
  },

  getCurrentUser: async () => {
    const response = await api.get("/users/me/");
    if (!response.ok) throw new Error("Failed to fetch user");
    return await response.json();
  },
};
