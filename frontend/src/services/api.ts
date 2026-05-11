const API_BASE = normalizeBaseUrl(
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1",
);
const API_ROOT = getApiRoot(API_BASE);

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

  let response = await fetch(buildUrl(baseUrl, url), { ...options, headers });

  if (response.status === 401) {
    // Try refresh token
    const refreshToken = getToken("learnlab_refresh_token");
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(buildUrl(API_BASE, "/auth/refresh/"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh: refreshToken }),
        });
        if (refreshResponse.ok) {
          const { access } = await refreshResponse.json();
          const storage = getTokenStorage();
          storage.setItem("learnlab_auth_token", access);
          // Retry original request
          const newHeaders = { ...headers, Authorization: `Bearer ${access}` };
          response = await fetch(buildUrl(baseUrl, url), {
            ...options,
            headers: newHeaders,
          });
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
};
