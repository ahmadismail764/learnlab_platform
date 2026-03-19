import { api } from './api';

async function parseError(response: Response, fallback: string): Promise<string> {
  try {
    const data = await response.json();
    if (data.detail) return data.detail;
    if (data.non_field_errors) return data.non_field_errors[0];
    const fieldErrors = Object.entries(data)
      .map(([key, val]) => `${key}: ${Array.isArray(val) ? val[0] : val}`)
      .join('; ');
    if (fieldErrors) return fieldErrors;
  } catch {
    // Non-JSON response
  }
  return fallback;
}

function normalizeAuthError(message: string, mode: 'login' | 'register'): string {
  const text = message.toLowerCase();

  if (text.includes('failed to fetch') || text.includes('networkerror')) {
    return 'Cannot reach backend server. Please ensure the backend is running.';
  }

  if (mode === 'login') {
    if (text.includes('no active account') || text.includes('invalid credentials')) {
      return 'Account does not exist or password is incorrect.';
    }
  }

  if (mode === 'register') {
    if (text.includes('email') && text.includes('already')) {
      return 'Email already registered. Please sign in instead.';
    }
  }

  return message;
}

export const authService = {
  login: async (credentials: { email: string; password: string }) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1"}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      if (!response.ok) {
        const message = await parseError(response, 'Login failed');
        throw new Error(normalizeAuthError(message, 'login'));
      }
      const data = await response.json();
      localStorage.setItem('learnlab_auth_token', data.access);
      localStorage.setItem('learnlab_refresh_token', data.refresh);
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      throw new Error(normalizeAuthError(message, 'login'));
    }
  },

  register: async (userData: { email: string; username: string; password: string; first_name: string; last_name: string }) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1"}/auth/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (!response.ok) {
        const message = await parseError(response, 'Registration failed');
        throw new Error(normalizeAuthError(message, 'register'));
      }
      return await response.json();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      throw new Error(normalizeAuthError(message, 'register'));
    }
  },

  logout: () => {
    localStorage.removeItem('learnlab_auth_token');
    localStorage.removeItem('learnlab_refresh_token');
  },

  refreshToken: async () => {
    const refresh = localStorage.getItem('learnlab_refresh_token');
    if (!refresh) throw new Error('No refresh token');
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1"}/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
    if (!response.ok) throw new Error('Refresh failed');
    return await response.json();
  },

  getCurrentUser: async () => {
    const response = await api.get('/users/me/');
    if (!response.ok) throw new Error('Failed to fetch user');
    return await response.json();
  }
};
