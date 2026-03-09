const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem("learnlab_auth_token");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let response = await fetch(`${API_BASE}${url}`, { ...options, headers });

  if (response.status === 401) {
    // Try refresh token
    const refreshToken = localStorage.getItem("learnlab_refresh_token");
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(`${API_BASE}/auth/refresh/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh: refreshToken }),
        });
        if (refreshResponse.ok) {
          const { access } = await refreshResponse.json();
          localStorage.setItem("learnlab_auth_token", access);
          // Retry original request
          const newHeaders = { ...headers, Authorization: `Bearer ${access}` };
          response = await fetch(`${API_BASE}${url}`, {
            ...options,
            headers: newHeaders,
          });
          return response;
        }
      } catch (error) {
        console.error("Token refresh failed", error);
      }
    }
    // Refresh failed — clear auth and redirect
    localStorage.removeItem("learnlab_auth_token");
    localStorage.removeItem("learnlab_refresh_token");
    window.location.href = "/login";
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
};
