import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthUser {
  email?: string;
  [key: string]: unknown;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  apiKey: string | null;
  setAuth: (token: string, user: AuthUser, apiKey?: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      apiKey: null,
      setAuth: (token, user, apiKey) => set({ token, user, apiKey: apiKey || null }),
      clearAuth: () => set({ token: null, user: null, apiKey: null }),
    }),
    {
      name: 'consumer-auth-storage',
    }
  )
);
