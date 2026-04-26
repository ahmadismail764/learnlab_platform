import { api } from "./api";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1"
).replace(/\/$/, "");

export interface LoginCredentials {
  email: string;
  password: string;
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

export interface BackendAuthUser {
  id: number | string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: "learner" | "admin" | string;
  is_staff: boolean;
  date_joined: string;
}

export interface UpdateCurrentUserPayload {
  email?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

async function parseError(
  response: Response,
  fallback: string,
): Promise<{ message: string; fieldErrors?: Record<string, string> }> {
  try {
    const data = await response.json();
    if (data.detail) {
      return { message: data.detail };
    }
    if (data.non_field_errors) {
      return { message: data.non_field_errors[0] };
    }

    const fieldErrors = Object.fromEntries(
      Object.entries(data).map(([key, val]) => [
        key,
        Array.isArray(val) ? String(val[0]) : String(val),
      ]),
    );
    const message = Object.entries(fieldErrors)
      .map(([key, val]) => `${key}: ${val}`)
      .join("; ");

    if (message) {
      return { message, fieldErrors };
    }
  } catch {
    // Non-JSON response
  }
  return { message: fallback };
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
      const response = await fetch(
        `${API_BASE_URL}/auth/login/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
        },
      );
      if (!response.ok) {
        const { message, fieldErrors } = await parseError(response, "Login failed");
        throw new AuthRequestError(
          normalizeAuthError(message, "login"),
          normalizeFieldErrors(fieldErrors, "login"),
        );
      }
      const data = await response.json();
      localStorage.setItem("learnlab_auth_token", data.access);
      localStorage.setItem("learnlab_refresh_token", data.refresh);
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
      const response = await fetch(
        `${API_BASE_URL}/auth/register/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData),
        },
      );
      if (!response.ok) {
        const { message, fieldErrors } = await parseError(
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

  logout: () => {
    localStorage.removeItem("learnlab_auth_token");
    localStorage.removeItem("learnlab_refresh_token");
  },

  refreshToken: async () => {
    const refresh = localStorage.getItem("learnlab_refresh_token");
    if (!refresh) throw new Error("No refresh token");
    const response = await fetch(
      `${API_BASE_URL}/auth/refresh/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      },
    );
    if (!response.ok) throw new Error("Refresh failed");
    return await response.json();
  },

  getCurrentUser: async (): Promise<BackendAuthUser> => {
    const response = await api.get("/auth/users/me/");
    if (!response.ok) {
      const { message } = await parseError(response, "Failed to fetch current user");
      throw new Error(message);
    }
    return (await response.json()) as BackendAuthUser;
  },

  updateCurrentUser: async (
    data: UpdateCurrentUserPayload,
  ): Promise<BackendAuthUser> => {
    const response = await api.patch("/auth/users/me/", data);
    if (!response.ok) {
      const { message } = await parseError(response, "Failed to update profile");
      throw new Error(message);
    }
    return (await response.json()) as BackendAuthUser;
  },
};
