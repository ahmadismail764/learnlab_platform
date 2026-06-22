import {
  api,
  clearStoredAuth,
  getTokenStorage,
  getToken,
  parseApiError,
  throwApiError,
} from "./api";
import { logger } from "@/utils/logger";

import {
  coerceBackendUser,
  type BackendAuthUser,
} from "./mappers/backendUser";

export type { BackendAuthUser } from "./mappers/backendUser";

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
  first_name: string;
  last_name: string;
}

export class AuthRequestError extends Error {
  fieldErrors?: Record<string, string>;

  constructor(message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = "AuthRequestError";
    this.fieldErrors = fieldErrors;
  }
}

export interface UpdateCurrentUserPayload {
  email?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export type UserPreferences = Record<string, unknown>;

interface PreferencesResponse {
  preferences?: UserPreferences;
}

function normalizeAuthError(
  message: string,
  mode: "login" | "register",
): string {
  const text = message.toLowerCase();

  if (text.includes("failed to fetch") || text.includes("networkerror")) {
    return "Cannot reach backend server. Please ensure the backend is running.";
  }

  if (mode === "login") {
    if (
      text.includes("no active account") ||
      text.includes("invalid credentials")
    ) {
      return "Account does not exist or password is incorrect.";
    }
  }

  if (mode === "register") {
    if (text.includes("email") && text.includes("already")) {
      return "Email already registered. Please sign in instead.";
    }
    if (text.includes("username") && text.includes("already")) {
      return "This username is already taken. Please choose another one.";
    }
  }

  return message;
}

function normalizeFieldErrors(
  fieldErrors: Record<string, string> | undefined,
  mode: "login" | "register",
): Record<string, string> | undefined {
  if (!fieldErrors) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(fieldErrors).map(([key, value]) => [
      key,
      normalizeAuthError(value, mode),
    ]),
  );
}

export const authService = {
  login: async (credentials: LoginCredentials) => {
    try {
      const identifier = credentials.email.trim();

      // Backend supports both username and email login (case-insensitive).
      const response = await api.postPublic("/auth/login/", {
        username: identifier,
        password: credentials.password,
      });
      if (!response.ok) {
        const { message, fieldErrors } = await parseApiError(response, "Login failed");
        throw new AuthRequestError(
          normalizeAuthError(message, "login"),
          normalizeFieldErrors(fieldErrors, "login"),
        );
      }
      const data = await response.json();

      // Determine storage based on "remember me" preference
      const persist = credentials.rememberMe !== false; // default true
      if (persist) {
        localStorage.setItem("learnlab_persist", "1");
      } else {
        localStorage.removeItem("learnlab_persist");
      }

      const storage = getTokenStorage();
      // Clear the other storage to avoid stale tokens
      const otherStorage = persist ? sessionStorage : localStorage;
      otherStorage.removeItem("learnlab_auth_token");
      otherStorage.removeItem("learnlab_refresh_token");

      storage.setItem("learnlab_auth_token", data.access);
      storage.setItem("learnlab_refresh_token", data.refresh);

      return data;
    } catch (error) {
      if (error instanceof AuthRequestError) {
        throw error;
      }
      const message = error instanceof Error ? error.message : "Login failed";
      throw new AuthRequestError(normalizeAuthError(message, "login"));
    }
  },

  register: async (userData: RegisterPayload) => {
    try {
      const response = await api.postPublic("/auth/register/", userData);
      if (!response.ok) {
        const { message, fieldErrors } = await parseApiError(
          response,
          "Registration failed",
        );
        throw new AuthRequestError(
          normalizeAuthError(message, "register"),
          normalizeFieldErrors(fieldErrors, "register"),
        );
      }
      return await response.json();
    } catch (error) {
      if (error instanceof AuthRequestError) {
        throw error;
      }
      const message =
        error instanceof Error ? error.message : "Registration failed";
      throw new AuthRequestError(normalizeAuthError(message, "register"));
    }
  },

  logout: async () => {
    const refresh = getToken("learnlab_refresh_token");
    const blacklistRequest = refresh
      ? api.post("/auth/logout/", { refresh }).catch((error) => {
          console.error("Failed to blacklist refresh token", error);
        })
      : Promise.resolve();

    // Clear tokens from both storages immediately; the blacklist request already captured them.
    localStorage.removeItem("learnlab_auth_token");
    localStorage.removeItem("learnlab_refresh_token");
    localStorage.removeItem("learnlab_persist");
    sessionStorage.removeItem("learnlab_auth_token");
    sessionStorage.removeItem("learnlab_refresh_token");

    await blacklistRequest;
  },

  refreshToken: async () => {
    const refresh = getToken("learnlab_refresh_token");
    if (!refresh) throw new Error("No refresh token");
    const response = await api.postPublic("/auth/refresh/", { refresh });
    if (!response.ok) throw new Error("Refresh failed");
    return await response.json();
  },

  getCurrentUser: async (): Promise<BackendAuthUser> => {
    let response: Response | null = null;

    try {
      response = await api.get("/auth/users/me/");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Current user request failed before reaching /auth/users/me/.";
      throw new Error(message);
    }

    if (response.ok) {
      const data = await response.json();
      return coerceBackendUser(data as Partial<BackendAuthUser>);
    }

    if (response.status === 401 || response.status === 403) {
      throw new Error("Authentication expired. Please sign in again.");
    }

    const { message } = await parseApiError(
      response,
      "Current user request failed.",
    );
    throw new Error(`Current user request failed at /auth/users/me/. ${message}`);
  },

  updateCurrentUser: async (payload?: UpdateCurrentUserPayload): Promise<BackendAuthUser> => {
    if (!payload) {
      throw new Error("No payload provided for profile update.");
    }
    const response = await api.patch("/auth/users/me/", payload);
    if (!response.ok) {
      await throwApiError(response, "Failed to update profile");
    }
    const data = await response.json();
    return coerceBackendUser(data as Partial<BackendAuthUser>);
  },

  getPreferences: async (): Promise<UserPreferences> => {
    const response = await api.get("/auth/users/me/preferences/");
    if (!response.ok) {
      await throwApiError(response, "Failed to fetch preferences");
    }
    const data = await response.json() as PreferencesResponse;
    return data.preferences ?? {};
  },

  updatePreferences: async (preferences: UserPreferences): Promise<UserPreferences> => {
    const response = await api.patch("/auth/users/me/preferences/", preferences);
    if (!response.ok) {
      await throwApiError(response, "Failed to update preferences");
    }
    const data = await response.json() as PreferencesResponse;
    return data.preferences ?? {};
  },

  requestPasswordReset: async (email: string) => {
    const response = await api.postPublic("/auth/password-reset/", { email });

    if (!response.ok) {
      await throwApiError(response, "Failed to request password reset");
    }

    if (response.status === 204) {
      return null;
    }

    try {
      return await response.json();
    } catch {
      return null;
    }
  },

  confirmPasswordReset: async (data: {
    uid: string;
    token: string;
    password: string;
  }) => {
    const response = await api.postPublic("/auth/password-reset/confirm/", data);

    if (!response.ok) {
      await throwApiError(response, "Failed to reset password");
    }

    return response.status === 204 ? null : await response.json();
  },
};
