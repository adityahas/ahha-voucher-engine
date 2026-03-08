import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  user: any | null;
  apiKey: string | null;
  setAuth: (token: string, user: any, apiKey?: string) => void;
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
