import { api } from './api';

export const authService = {
  login: async (credentials: any) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1"}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!response.ok) throw new Error('Login failed');
    const data = await response.json();
    localStorage.setItem('learnlab_auth_token', data.access);
    localStorage.setItem('learnlab_refresh_token', data.refresh);
    return data;
  },

  register: async (userData: any) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1"}/auth/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    if (!response.ok) throw new Error('Registration failed');
    return await response.json();
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
