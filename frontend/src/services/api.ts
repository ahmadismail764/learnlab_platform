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
    return path;
  }

  if (path.startsWith("/")) {
    return `${baseUrl}${path}`;
  }

  return `${baseUrl}/${path}`;
}

async function fetchWithAuth(
  url: string,
  options: RequestInit = {},
  baseUrl: string = API_BASE,
) {
  const token = localStorage.getItem("learnlab_auth_token");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let response = await fetch(buildUrl(baseUrl, url), { ...options, headers });

  if (response.status === 401) {
    // Try refresh token
    const refreshToken = localStorage.getItem("learnlab_refresh_token");
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(buildUrl(API_BASE, "/auth/refresh/"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh: refreshToken }),
        });
        if (refreshResponse.ok) {
          const { access } = await refreshResponse.json();
          localStorage.setItem("learnlab_auth_token", access);
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
    // Refresh failed — clear auth. 
    // The AuthContext will detect missing token and redirect to login.
    localStorage.removeItem("learnlab_auth_token");
    localStorage.removeItem("learnlab_refresh_token");
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
