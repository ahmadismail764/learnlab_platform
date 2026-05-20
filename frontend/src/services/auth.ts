import {
  api,
  getTokenStorage,
  getToken,
  parseApiError,
  throwApiError,
} from "./api";

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

function coerceBackendUser(partial: Partial<BackendAuthUser>): BackendAuthUser {
  const now = new Date().toISOString();
  const username = partial.username || partial.email?.split("@")[0] || "learner";

  return {
    id: partial.id ?? username,
    email: partial.email ?? "",
    username,
    first_name: partial.first_name ?? "",
    last_name: partial.last_name ?? "",
    role: partial.role ?? (partial.is_staff ? "admin" : "learner"),
    is_staff: partial.is_staff ?? partial.role === "admin",
    date_joined: partial.date_joined ?? now,
  };
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

      // Backend uses USERNAME_FIELD = 'username', so we send { username }.
      // If the user typed an email, we still send it as `username` — the backend
      // should support email-based login (see backend_issues.md #2).
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

      // Save a user snapshot from the JWT claims.
      // NOTE: The backend JWT currently only contains { user_id }. Once the backend
      // adds role/email/username to the JWT claims (see backend_issues.md #10),
      // remove the fallback values below.
      const claims = decodeJwtPayload(data.access);
      saveUserSnapshot({
        id: String(claims?.user_id ?? claims?.sub ?? ""),
        email: typeof claims?.email === "string" ? claims.email : "",
        username: typeof claims?.username === "string" ? claims.username : identifier,
        role: claims?.role === "admin" ? "admin" : (claims?.is_staff === true ? "admin" : "learner"),
        is_staff: claims?.is_staff === true || claims?.role === "admin",
      });

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
    // Try the real endpoint first — the backend should implement this (see backend_issues.md #4).
    try {
      const response = await api.get("/auth/users/me/");
      if (response.ok) {
        const data = await response.json();
        const user = coerceBackendUser(data as Partial<BackendAuthUser>);
        saveUserSnapshot(user);
        return user;
      }
    } catch {
      // Endpoint doesn't exist yet — fall through to fallback.
    }

    // Fallback: use the locally-stored snapshot from the last login.
    // This is lossy (no role/name/email from the backend) until /users/me/ is implemented.
    if (options.allowFallback) {
      return getFallbackCurrentUser();
    }
    throw new Error("Current user endpoint (/auth/users/me/) is not available on this backend.");
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  updateCurrentUser: async (..._args: [UpdateCurrentUserPayload?]): Promise<BackendAuthUser> => {
    throw new Error("Profile update endpoint is not available on this backend.");
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
