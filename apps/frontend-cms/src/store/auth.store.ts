import { create } from 'zustand';

interface AuthState {
  token: string | null;
  tenant: string | null;
  apiKey: string | null;
  user: { email: string } | null;
  login: (token: string, tenant: string, apiKey: string, email: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initialize from LocalStorage gracefully
  token: localStorage.getItem('ahha_token'),
  tenant: localStorage.getItem('ahha_tenant'),
  apiKey: localStorage.getItem('ahha_api_key'),
  user: localStorage.getItem('ahha_email')
    ? { email: localStorage.getItem('ahha_email') as string }
    : null,

  login: (token, tenant, apiKey, email) => {
    localStorage.setItem('ahha_token', token);
    localStorage.setItem('ahha_tenant', tenant);
    localStorage.setItem('ahha_api_key', apiKey);
    localStorage.setItem('ahha_email', email);
    set({ token, tenant, apiKey, user: { email } });
  },

  logout: () => {
    localStorage.removeItem('ahha_token');
    localStorage.removeItem('ahha_tenant');
    localStorage.removeItem('ahha_api_key');
    localStorage.removeItem('ahha_email');
    set({ token: null, tenant: null, apiKey: null, user: null });
  },

  isAuthenticated: () => {
    const { token, tenant, apiKey } = get();
    return !!(token && tenant && apiKey);
  },
}));
