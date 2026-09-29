import { create } from 'zustand';
import { authApi} from '@/api/endpoints';
import type { RegisterPayload } from '@/types/auth';
import { setToken } from '@/api/client';
import type { User } from '@/types/user';

interface AuthState {
  user: User | null;
  ready: boolean;         // true once bootstrap has run
  loading: boolean;
  error: string | null;

  login: (username: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  bootstrap: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  ready: false,
  loading: false,
  error: null,

  login: async (username, password) => {
    set({ loading: true, error: null });
    try {
      const data = await authApi.login(username, password);
      setToken(data.access);
      set({ user: data.user });
    } catch {
      set({ error: 'Invalid username or password' });
      throw new Error('login failed');
    } finally {
      set({ loading: false });
    }
  },

  register: async (payload) => {
    set({ loading: true, error: null });
    try {
      await authApi.register(payload);
      // Auto-login after register
      await get().login(payload.username, payload.password);
    } catch (e: any) {
      const msg =
        e?.response?.data?.username?.[0] ??
        e?.response?.data?.email?.[0] ??
        'Registration failed';
      set({ error: msg });
      throw e;
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    setToken(null);
    set({ user: null });
  },

  bootstrap: async () => {
    try {
      const data = await authApi.refresh();
      setToken(data.access);
      set({ user: data.user });
    } catch {
      set({ user: null });
    } finally {
      set({ ready: true });
    }
  },
}));