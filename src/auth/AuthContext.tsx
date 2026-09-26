import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { UserPrincipal, UserRole, Permission, AuthState } from './types';
import {
  getStoredToken,
  getStoredUser,
  setStoredUser,
  clearStoredAuth,
  loginWithCredentials,
  fetchAuthenticatedPrincipal,
  logoutActiveSession,
  DEMO_PERSONAS,
} from './authClient';
import { hasPermission as checkPermission } from './permissions';
import { checkBackendHealth } from '../services/api/client';

export interface UnauthorizedNotice {
  action: string;
  message: string;
  requiredRole?: string;
  timestamp: string;
}

export interface AuthContextValue extends AuthState {
  role: UserRole | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  switchDemoPersona: (usernameOrRole: string) => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
  unauthorizedNotice: UnauthorizedNotice | null;
  clearUnauthorizedNotice: () => void;
  notifyUnauthorizedAction: (action: string, detail?: string, requiredRole?: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserPrincipal | null>(() => getStoredUser());
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOfflineDemo, setIsOfflineDemo] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [unauthorizedNotice, setUnauthorizedNotice] = useState<UnauthorizedNotice | null>(null);

  // Initialize session on mount
  useEffect(() => {
    let isMounted = true;

    async function initializeAuth() {
      setIsLoading(true);
      setError(null);

      const health = await checkBackendHealth();
      if (!isMounted) return;

      if (!health.online) {
        // Backend offline -> Enter offline demonstration mode
        setIsOfflineDemo(true);
        if (!user) {
          const defaultDemo = DEMO_PERSONAS[0];
          const demoUser: UserPrincipal = {
            id: defaultDemo.id,
            username: defaultDemo.username,
            email: defaultDemo.username,
            displayName: defaultDemo.displayName,
            role: defaultDemo.role,
            isActive: true,
          };
          setUser(demoUser);
          setStoredUser(demoUser);
        }
        setIsLoading(false);
        return;
      }

      setIsOfflineDemo(false);
      const existingToken = getStoredToken();

      if (existingToken) {
        try {
          const validatedUser = await fetchAuthenticatedPrincipal(existingToken);
          if (isMounted) {
            setUser(validatedUser);
            setToken(existingToken);
            setStoredUser(validatedUser);
          }
        } catch {
          // Token expired or invalid -> clear stale session and refresh with valid demo credentials
          clearStoredAuth();
          try {
            const authResp = await loginWithCredentials('medic@demo.prana', 'prana-demo-2026');
            if (isMounted) {
              setUser(authResp.user);
              setToken(authResp.accessToken);
            }
          } catch (e: any) {
            if (isMounted) {
              setUser(null);
              setToken(null);
            }
          }
        }
      } else {
        // Auto-login to default Medic persona for zero-friction demonstration startup
        try {
          const authResp = await loginWithCredentials('medic@demo.prana', 'prana-demo-2026');
          if (isMounted) {
            setUser(authResp.user);
            setToken(authResp.accessToken);
          }
        } catch (e: any) {
          if (isMounted) {
            setError(e.message || 'Auto-login initialization failed');
          }
        }
      }

      if (isMounted) setIsLoading(false);
    }

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const resp = await loginWithCredentials(username, password);
      setUser(resp.user);
      setToken(resp.accessToken);
      setIsOfflineDemo(false);
    } catch (err: any) {
      setError(err.message || 'Sign in failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await logoutActiveSession();
    } finally {
      setUser(null);
      setToken(null);
      setIsLoading(false);
    }
  }, []);

  const switchDemoPersona = useCallback(async (identifier: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Find matching demo persona
      const persona = DEMO_PERSONAS.find(
        p => p.username === identifier || p.role === identifier || p.id === identifier
      ) || DEMO_PERSONAS[0];

      if (isOfflineDemo) {
        const demoUser: UserPrincipal = {
          id: persona.id,
          username: persona.username,
          email: persona.username,
          displayName: persona.displayName,
          role: persona.role,
          isActive: true,
        };
        setUser(demoUser);
        setStoredUser(demoUser);
        setIsLoading(false);
        return;
      }

      const resp = await loginWithCredentials(persona.username, 'prana-demo-2026');
      setUser(resp.user);
      setToken(resp.accessToken);
    } catch (err: any) {
      setError(err.message || 'Persona switch failed');
    } finally {
      setIsLoading(false);
    }
  }, [isOfflineDemo]);

  const hasPermission = useCallback((permission: Permission): boolean => {
    return checkPermission(user?.role, permission);
  }, [user?.role]);

  const notifyUnauthorizedAction = useCallback((action: string, detail?: string, requiredRole?: string) => {
    const notice: UnauthorizedNotice = {
      action,
      message: detail || 'You do not have permission to perform this action.',
      requiredRole,
      timestamp: new Date().toLocaleTimeString(),
    };
    setUnauthorizedNotice(notice);
  }, []);

  const clearUnauthorizedNotice = useCallback(() => {
    setUnauthorizedNotice(null);
  }, []);

  const value: AuthContextValue = {
    user,
    role: user?.role || null,
    token,
    isAuthenticated: !!user && !!token,
    isOfflineDemo,
    isLoading,
    error,
    login,
    logout,
    switchDemoPersona,
    hasPermission,
    unauthorizedNotice,
    clearUnauthorizedNotice,
    notifyUnauthorizedAction,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
