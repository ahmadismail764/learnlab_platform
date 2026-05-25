import {
  api,
  getTokenStorage,
  getToken,
  parseApiError,
  throwApiError,
} from "./api";

import {
  coerceBackendUser,
  type BackendAuthUser,
} from "./mappers/backendUser";

export type { BackendAuthUser } from "./mappers/backendUser";

const AUTH_USER_SNAPSHOT_KEY = "learnlab_user_snapshot";

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

export interface CurrentUserOptions {
  allowFallback?: boolean;
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

function isEndpointMissing(response: Response): boolean {
  return response.status === 404 || response.status === 405;
}

async function postFirstAvailable(
  paths: string[],
  payloads: unknown[],
): Promise<Response> {
  let lastResponse: Response | null = null;

  for (const path of paths) {
    for (const payload of payloads) {
      const response = await api.postPublic(path, payload);

      if (response.ok) {
        return response;
      }

      lastResponse = response;

      if (!isEndpointMissing(response) && response.status !== 400 && response.status !== 401) {
        return response;
      }
    }
  }

  return lastResponse ?? api.postPublic(paths[0] ?? "/auth/login/", payloads[0] ?? {});
}


function decodeJwtPayload(token: string | null): Record<string, unknown> | null {
  if (!token) {
    return null;
  }

  try {
    const [, payload] = token.split(".");
    if (!payload) {
      return null;
    }
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join(""),
    );
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function saveUserSnapshot(user: Partial<BackendAuthUser>) {
  const storage = getTokenStorage();
  storage.setItem(AUTH_USER_SNAPSHOT_KEY, JSON.stringify(coerceBackendUser(user)));
}

function readUserSnapshot(): BackendAuthUser | null {
  const raw =
    localStorage.getItem(AUTH_USER_SNAPSHOT_KEY) ??
    sessionStorage.getItem(AUTH_USER_SNAPSHOT_KEY);

  if (!raw) {
    return null;
  }

  try {
    return coerceBackendUser(JSON.parse(raw) as Partial<BackendAuthUser>);
  } catch {
    return null;
  }
}

function getFallbackCurrentUser(): BackendAuthUser {
  const snapshot = readUserSnapshot();
  if (snapshot) {
    return snapshot;
  }

  const claims = decodeJwtPayload(getToken("learnlab_auth_token"));
  const id = claims?.user_id ?? claims?.sub ?? claims?.id ?? "learner";
  const email = typeof claims?.email === "string" ? claims.email : "";
  const username =
    typeof claims?.username === "string"
      ? claims.username
      : email.split("@")[0] || String(id);
  const role = claims?.role === "admin" ? "admin" : "learner";

  return coerceBackendUser({
    id: String(id),
    email,
    username,
    role,
    is_staff: role === "admin" || claims?.is_staff === true,
  });
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
      const response = await postFirstAvailable(
        ["/auth/login/"],
        [{ username: identifier, password: credentials.password }],
      );
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

      // The login response includes a `user` object with full profile data.
      // Fall back to JWT decode if user object is missing (older backends).
      if (data.user) {
        saveUserSnapshot({
          id: String(data.user.id ?? ""),
          email: data.user.email ?? "",
          username: data.user.username ?? identifier,
          first_name: data.user.first_name ?? "",
          last_name: data.user.last_name ?? "",
          role: data.user.role ?? (data.user.is_staff ? "admin" : "learner"),
          is_staff: data.user.is_staff ?? false,
        });
      } else {
        const claims = decodeJwtPayload(data.access);
        saveUserSnapshot({
          id: String(claims?.user_id ?? claims?.sub ?? ""),
          email: typeof claims?.email === "string" ? claims.email : "",
          username: typeof claims?.username === "string" ? claims.username : identifier,
          role: claims?.role === "admin" ? "admin" : (claims?.is_staff === true ? "admin" : "learner"),
          is_staff: claims?.is_staff === true || claims?.role === "admin",
        });
      }

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
      const response = await postFirstAvailable(
        ["/auth/register/"],
        [userData],
      );
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

  logout: () => {
    // Clear tokens from both storages
    localStorage.removeItem("learnlab_auth_token");
    localStorage.removeItem("learnlab_refresh_token");
    localStorage.removeItem("learnlab_persist");
    localStorage.removeItem(AUTH_USER_SNAPSHOT_KEY);
    sessionStorage.removeItem("learnlab_auth_token");
    sessionStorage.removeItem("learnlab_refresh_token");
    sessionStorage.removeItem(AUTH_USER_SNAPSHOT_KEY);
  },

  refreshToken: async () => {
    const refresh = getToken("learnlab_refresh_token");
    if (!refresh) throw new Error("No refresh token");
    const response = await api.postPublic("/auth/refresh/", { refresh });
    if (!response.ok) throw new Error("Refresh failed");
    return await response.json();
  },

  getCurrentUser: async (options: CurrentUserOptions = {}): Promise<BackendAuthUser> => {
    try {
      const response = await api.get("/auth/users/me/");
      if (response.ok) {
        const data = await response.json();
        const user = coerceBackendUser(data as Partial<BackendAuthUser>);
        saveUserSnapshot(user);
        return user;
      }
    } catch {
      // Network error — fall through to fallback if allowed.
    }

    // Fallback: use the locally-stored snapshot (useful during network issues).
    if (options.allowFallback) {
      return getFallbackCurrentUser();
    }
    throw new Error("Failed to fetch current user from /auth/users/me/.");
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
    const user = coerceBackendUser(data as Partial<BackendAuthUser>);
    saveUserSnapshot(user);
    return user;
  },

  requestPasswordReset: async (email: string) => {
    const response = await postFirstAvailable(
      [
        "/auth/password-reset/",
        "/auth/password/reset/",
        "/auth/forgot-password/",
      ],
      [{ email }],
    );

    if (!response.ok) {
      if (isEndpointMissing(response)) {
        throw new AuthRequestError(
          "Password reset is not available on this backend yet.",
        );
      }
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
    uid?: string;
    token: string;
    password: string;
  }) => {
    const response = await postFirstAvailable(
      [
        "/auth/password-reset/confirm/",
        "/auth/password/reset/confirm/",
        "/auth/reset-password/confirm/",
      ],
      [data],
    );

    if (!response.ok) {
      await throwApiError(response, "Failed to reset password");
    }

    return response.status === 204 ? null : await response.json();
  },
};
