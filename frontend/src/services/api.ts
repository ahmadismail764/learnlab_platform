const API_BASE = normalizeBaseUrl(
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
);
const API_ROOT = getApiRoot(API_BASE);

export type EntityId = string | number;

export class ApiRequestError extends Error {
  status: number;
  fieldErrors?: Record<string, string>;

  constructor(
    message: string,
    status: number,
    fieldErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

function normalizeBaseUrl(rawUrl: string): string {
  return rawUrl.trim().replace(/\/$/, "");
}

function getApiRoot(baseUrl: string): string {
  try {
    return new URL(baseUrl).origin;
  } catch {
    return window.location.origin;
  }
}

function buildUrl(baseUrl: string, path: string): string {
  if (/^https?:\/\//i.test(path)) {
    const targetUrl = new URL(path);
    const baseOrigin = new URL(baseUrl).origin;

    if (targetUrl.origin !== baseOrigin) {
      throw new Error("Refusing to attach auth headers to a non-API origin");
    }

    return targetUrl.toString();
  }

  if (path.startsWith("/")) {
    return `${baseUrl}${path}`;
  }

  return `${baseUrl}/${path}`;
}

function shouldRetryFromApiRoot(response: Response, baseUrl: string): boolean {
  return (
    response.status === 404 &&
    baseUrl === API_BASE &&
    API_BASE !== API_ROOT &&
    API_BASE.includes("/api/")
  );
}

async function fetchFromBase(
  url: string,
  options: RequestInit,
  baseUrl: string,
): Promise<Response> {
  const response = await fetch(buildUrl(baseUrl, url), options);

  if (shouldRetryFromApiRoot(response, baseUrl)) {
    return fetch(buildUrl(API_ROOT, url), options);
  }

  return response;
}

/**
 * Resolve which storage backend holds auth tokens.
 * On login the user's "remember me" choice writes a flag to localStorage.
 * - present & "1" → tokens live in localStorage (persist across sessions)
 * - absent         → tokens live in sessionStorage (cleared on tab close)
 */
export function getTokenStorage(): Storage {
  return localStorage.getItem("learnlab_persist") === "1"
    ? localStorage
    : sessionStorage;
}

/** Read a token from whichever storage currently holds it. */
export function getToken(key: string): string | null {
  // Check both storages — during migration the token might be in either.
  return localStorage.getItem(key) ?? sessionStorage.getItem(key);
}

async function fetchWithAuth(
  url: string,
  options: RequestInit = {},
  baseUrl: string = API_BASE,
) {
  const token = getToken("learnlab_auth_token");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let response = await fetchFromBase(url, { ...options, headers }, baseUrl);

  if (response.status === 401) {
    // Try refresh token
    const refreshToken = getToken("learnlab_refresh_token");
    if (refreshToken) {
      try {
        const refreshResponse = await fetchFromBase("/auth/refresh/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh: refreshToken }),
        }, API_BASE);
        if (refreshResponse.ok) {
          const { access } = await refreshResponse.json();
          const storage = getTokenStorage();
          storage.setItem("learnlab_auth_token", access);
          // Retry original request
          const newHeaders = { ...headers, Authorization: `Bearer ${access}` };
          response = await fetchFromBase(url, {
            ...options,
            headers: newHeaders,
          }, baseUrl);
          return response;
        }
      } catch (error) {
        console.error("Token refresh failed", error);
      }
    }
    // Refresh failed — clear auth from both storages.
    // The AuthContext will detect missing token and redirect to login.
    localStorage.removeItem("learnlab_auth_token");
    localStorage.removeItem("learnlab_refresh_token");
    sessionStorage.removeItem("learnlab_auth_token");
    sessionStorage.removeItem("learnlab_refresh_token");
  }

  return response;
}

async function fetchPublic(
  url: string,
  options: RequestInit = {},
  baseUrl: string = API_BASE,
) {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  return fetchFromBase(url, { ...options, headers }, baseUrl);
}

export async function parseApiError(
  response: Response,
  fallback: string,
): Promise<{ message: string; fieldErrors?: Record<string, string> }> {
  try {
    const data = await response.clone().json();
    if (typeof data.detail === "string") {
      return { message: data.detail };
    }
    if (typeof data.error === "string") {
      return { message: data.error };
    }
    if (Array.isArray(data.non_field_errors) && data.non_field_errors[0]) {
      return { message: String(data.non_field_errors[0]) };
    }

    const fieldErrors = Object.fromEntries(
      Object.entries(data)
        .filter(([, value]) => value != null)
        .map(([key, value]) => [
          key,
          Array.isArray(value) ? String(value[0]) : String(value),
        ]),
    );
    const message = Object.entries(fieldErrors)
      .map(([key, value]) => `${key}: ${value}`)
      .join("; ");

    if (message) {
      return { message, fieldErrors };
    }
  } catch {
    try {
      const text = await response.clone().text();
      if (text.trim()) {
        return { message: text.trim() };
      }
    } catch {
      // Fall through to fallback.
    }
  }

  return { message: fallback };
}

export async function throwApiError(
  response: Response,
  fallback: string,
): Promise<never> {
  const { message, fieldErrors } = await parseApiError(response, fallback);
  throw new ApiRequestError(message, response.status, fieldErrors);
}

export const api = {
  get: (url: string) => fetchWithAuth(url),
  post: (url: string, data: unknown) =>
    fetchWithAuth(url, { method: "POST", body: JSON.stringify(data) }),
  put: (url: string, data: unknown) =>
    fetchWithAuth(url, { method: "PUT", body: JSON.stringify(data) }),
  patch: (url: string, data: unknown) =>
    fetchWithAuth(url, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (url: string) => fetchWithAuth(url, { method: "DELETE" }),
  getFromRoot: (url: string) => fetchWithAuth(url, {}, API_ROOT),
  postPublic: (url: string, data: unknown) =>
    fetchPublic(url, { method: "POST", body: JSON.stringify(data) }),
};
