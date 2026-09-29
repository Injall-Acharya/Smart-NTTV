import axios, { AxiosError } from 'axios';
// import type { LoginResponse } from '@/types/auth';

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,     // sends httpOnly refresh cookie
});

// Access token stored in memory only
let token: string | null = null;
export const setToken = (t: string | null) => { token = t; };

// Attach token to every request
api.interceptors.request.use((config) => {
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401 → refresh once → retry
let refreshing: Promise<string> | null = null;

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as any;

    // Don't refresh on refresh itself, or if we already retried
    if (
      error.response?.status !== 401 ||
      original._retry ||
      original.url?.includes('/auth/refresh/')
    ) {
      return Promise.reject(error);
    }
    original._retry = true;

    // Only one refresh in flight at a time
    if (!refreshing) {
      refreshing = axios
        .post(`${API_URL}/auth/refresh/`, {}, { withCredentials: true })
        .then((r) => {
          token = r.data.access;
          return r.data.access;
        })
        .finally(() => { refreshing = null; });
    }

    try {
      const newToken = await refreshing;
      original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);
    } catch {
      // Refresh failed → bounce to login
      setToken(null);
      window.location.href = '/login';
      return Promise.reject(error);
    }
  }
);