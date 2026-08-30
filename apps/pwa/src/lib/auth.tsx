import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, clearToken, getToken, setToken } from './api';

interface User {
  id: string;
  phone: string;
  role: 'BUYER' | 'SELLER' | 'ADMIN';
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  requestOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, code: string) => Promise<void>;
  devLogin: (phone: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    api
      .get<User>('/users/me')
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  async function requestOtp(phone: string) {
    await api.post('/auth/otp/request', { phone });
  }

  async function verifyOtp(phone: string, code: string) {
    const res = await api.post<{ accessToken: string; user: User }>('/auth/otp/verify', {
      phone,
      code,
    });
    setToken(res.accessToken);
    setUser(res.user);
  }

  // Temporaire — voir AuthService.devLogin() côté API.
  async function devLogin(phone: string) {
    const res = await api.post<{ accessToken: string; user: User }>('/auth/dev-login', { phone });
    setToken(res.accessToken);
    setUser(res.user);
  }

  function logout() {
    clearToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, requestOtp, verifyOtp, devLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
