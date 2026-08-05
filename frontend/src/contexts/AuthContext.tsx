import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  authApi,
  setAuthSessionListener,
  type AuthSession,
  type AuthUser,
  type UserRole,
} from '../api/client';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function isWebRole(role: UserRole): role is 'admin' | 'gabai' {
  return role === 'admin' || role === 'gabai';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const applySession = (session: AuthSession | null) => {
      if (session && isWebRole(session.user.role)) {
        setUser(session.user);
        return;
      }
      setUser(null);
      queryClient.clear();
    };

    setAuthSessionListener(applySession);

    let cancelled = false;
    authApi
      .refresh()
      .then(async session => {
        if (session.user.role === 'congregant') {
          await authApi.logout().catch(() => undefined);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setIsInitializing(false);
      });

    return () => {
      cancelled = true;
      setAuthSessionListener(null);
    };
  }, [queryClient]);

  const login = async (username: string, password: string) => {
    const session = await authApi.login(username.trim(), password);
    if (!isWebRole(session.user.role)) {
      await authApi.logout().catch(() => undefined);
      throw new Error('הכניסה למערכת הניהול זמינה למנהלים ולגבאים בלבד.');
    }
  };

  const logout = async () => {
    await authApi.logout().catch(() => undefined);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isInitializing,
      login,
      logout,
      hasRole: (...roles) => user !== null && roles.includes(user.role),
    }),
    [isInitializing, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
