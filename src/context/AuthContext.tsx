import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, SessionInfo, SystemSettings, AuthMode, TestDispatch } from '../types/auth';
import { ApiClient } from '../services/api';

interface AuthContextType {
  user: User | null;
  session: SessionInfo | null;
  settings: SystemSettings | null;
  activeAuthMode: AuthMode;
  isLoading: boolean;
  testDispatches: TestDispatch[];
  isInspectorOpen: boolean;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setIsInspectorOpen: (open: boolean) => void;
  toggleInspector: () => void;
  refreshSettings: () => Promise<void>;
  refreshCurrentUser: () => Promise<void>;
  refreshTestDispatches: () => Promise<void>;
  switchAuthMode: (mode: AuthMode) => Promise<void>;
  loginStep1: (email: string, password: string) => Promise<any>;
  verifyMobileOtp: (email: string, code: string) => Promise<any>;
  verifyEmailOtp: (email: string, code: string) => Promise<any>;
  verifyTotp: (email: string, code: string) => Promise<any>;
  resendOtp: (email: string, type: 'MOBILE' | 'EMAIL') => Promise<any>;
  expireOtpForTest: (email: string, type?: 'MOBILE' | 'EMAIL') => Promise<any>;
  logout: () => Promise<void>;
  triggerDemoReset: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [activeAuthMode, setActiveAuthMode] = useState<AuthMode>('PASSWORD_ONLY');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [testDispatches, setTestDispatches] = useState<TestDispatch[]>([]);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('authshield_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark'; // Default sleek dark theme inspired by Reference Image 2
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('authshield_theme', theme);
  }, [theme]);

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const toggleInspector = useCallback(() => {
    setIsInspectorOpen(prev => !prev);
  }, []);

  const refreshSettings = useCallback(async () => {
    try {
      const data = await ApiClient.getSettings();
      setSettings(data);
      if (data.activeAuthMode) {
        setActiveAuthMode(data.activeAuthMode);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  }, []);

  const refreshTestDispatches = useCallback(async () => {
    try {
      const res = await ApiClient.getTestDispatches();
      setTestDispatches(res.dispatches || []);
    } catch {
      // ignore
    }
  }, []);

  const refreshCurrentUser = useCallback(async () => {
    const token = ApiClient.getToken();
    if (!token) {
      setUser(null);
      setSession(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await ApiClient.getCurrentUser();
      setUser(res.user);
      setSession(res.session);
    } catch (err) {
      // Session invalid or expired
      ApiClient.clearToken();
      setUser(null);
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
    refreshCurrentUser();
    refreshTestDispatches();

    // Poll test dispatches every 2.5 seconds so evaluator sees incoming OTPs in real-time
    const interval = setInterval(() => {
      refreshTestDispatches();
    }, 2500);

    return () => clearInterval(interval);
  }, [refreshSettings, refreshCurrentUser, refreshTestDispatches]);

  const switchAuthMode = async (mode: AuthMode) => {
    await ApiClient.setAuthMode(mode);
    setActiveAuthMode(mode);
    await refreshSettings();
  };

  const loginStep1 = async (email: string, password: string) => {
    const res = await ApiClient.loginStep1(email, password);
    if (res.sessionToken && res.user) {
      ApiClient.setToken(res.sessionToken);
      setUser(res.user);
      setSession({
        token: res.sessionToken,
        authMode: res.mode,
        expiresAt: new Date(Date.now() + 30 * 60000).toISOString(),
      });
    }
    await refreshTestDispatches();
    return res;
  };

  const verifyMobileOtp = async (email: string, code: string) => {
    const res = await ApiClient.verifyMobileOtp(email, code);
    if (res.sessionToken && res.user) {
      ApiClient.setToken(res.sessionToken);
      setUser(res.user);
      setSession({
        token: res.sessionToken,
        authMode: res.mode,
        expiresAt: new Date(Date.now() + 30 * 60000).toISOString(),
      });
    }
    await refreshTestDispatches();
    return res;
  };

  const verifyEmailOtp = async (email: string, code: string) => {
    const res = await ApiClient.verifyEmailOtp(email, code);
    if (res.sessionToken && res.user) {
      ApiClient.setToken(res.sessionToken);
      setUser(res.user);
      setSession({
        token: res.sessionToken,
        authMode: res.mode,
        expiresAt: new Date(Date.now() + 30 * 60000).toISOString(),
      });
    }
    await refreshTestDispatches();
    return res;
  };

  const verifyTotp = async (email: string, code: string) => {
    const res = await ApiClient.verifyTotp(email, code);
    if (res.sessionToken && res.user) {
      ApiClient.setToken(res.sessionToken);
      setUser(res.user);
      setSession({
        token: res.sessionToken,
        authMode: res.mode,
        expiresAt: new Date(Date.now() + 30 * 60000).toISOString(),
      });
    }
    return res;
  };

  const resendOtp = async (email: string, type: 'MOBILE' | 'EMAIL') => {
    const res = await ApiClient.resendOtp(email, type);
    await refreshTestDispatches();
    return res;
  };

  const expireOtpForTest = async (email: string, type?: 'MOBILE' | 'EMAIL') => {
    const res = await ApiClient.expireOtpForTest(email, type);
    await refreshTestDispatches();
    return res;
  };

  const logout = async () => {
    try {
      await ApiClient.logout();
    } finally {
      setUser(null);
      setSession(null);
      ApiClient.clearToken();
    }
  };

  const triggerDemoReset = async () => {
    await ApiClient.resetDemonstration();
    await refreshSettings();
    await refreshCurrentUser();
    await refreshTestDispatches();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        settings,
        activeAuthMode,
        isLoading,
        testDispatches,
        isInspectorOpen,
        theme,
        setTheme,
        toggleTheme,
        setIsInspectorOpen,
        toggleInspector,
        refreshSettings,
        refreshCurrentUser,
        refreshTestDispatches,
        switchAuthMode,
        loginStep1,
        verifyMobileOtp,
        verifyEmailOtp,
        verifyTotp,
        resendOtp,
        expireOtpForTest,
        logout,
        triggerDemoReset,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
