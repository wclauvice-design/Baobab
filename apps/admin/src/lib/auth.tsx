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
  impersonatedShopName: string | null;
  requestOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, code: string) => Promise<void>;
  devLogin: (phone: string) => Promise<void>;
  impersonate: (phone: string, shopName: string) => Promise<void>;
  stopImpersonation: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const BACKUP_TOKEN_KEY = 'westzone_admin_backup_token';
const IMPERSONATED_SHOP_KEY = 'westzone_admin_impersonated_shop';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [impersonatedShopName, setImpersonatedShopName] = useState<string | null>(() =>
    localStorage.getItem(IMPERSONATED_SHOP_KEY)
  );

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

  async function impersonate(phone: string, shopName: string) {
    const currentToken = getToken();
    if (!currentToken) return;

    // Backup current admin token if not already impersonating
    if (!localStorage.getItem(BACKUP_TOKEN_KEY)) {
      localStorage.setItem(BACKUP_TOKEN_KEY, currentToken);
    }
    localStorage.setItem(IMPERSONATED_SHOP_KEY, shopName);
    setImpersonatedShopName(shopName);

    const res = await api.post<{ accessToken: string; user: User }>('/auth/dev-login', { phone });
    setToken(res.accessToken);
    setUser(res.user);
  }

  async function stopImpersonation() {
    const backupToken = localStorage.getItem(BACKUP_TOKEN_KEY);
    localStorage.removeItem(BACKUP_TOKEN_KEY);
    localStorage.removeItem(IMPERSONATED_SHOP_KEY);
    setImpersonatedShopName(null);

    if (backupToken) {
      setToken(backupToken);
      try {
        const adminUser = await api.get<User>('/users/me');
        setUser(adminUser);
      } catch {
        clearToken();
        setUser(null);
      }
    }
  }

  function logout() {
    localStorage.removeItem(BACKUP_TOKEN_KEY);
    localStorage.removeItem(IMPERSONATED_SHOP_KEY);
    setImpersonatedShopName(null);
    clearToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        impersonatedShopName,
        requestOtp,
        verifyOtp,
        devLogin,
        impersonate,
        stopImpersonation,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
