import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, getStoredToken, healthApi } from '../shared/api';

const AUTH_STORAGE_KEY = 'future_wallet_auth_user';
const REMEMBER_ME_KEY = 'future_wallet_remember_email';

export const clearMockLocalStorage = () => {
  try {
    localStorage.removeItem('finsmart_transactions_v1');
    localStorage.removeItem('finsmart_fixed_costs_v1');
    localStorage.removeItem('finsmart_savings_goals_v1');
    localStorage.removeItem('finsmart_debts_v1');
  } catch (e) {
    console.error('Failed to clear mock storage:', e);
  }
};

const AuthContext = createContext();

// token ยืนยันอีเมลใช้ได้ครั้งเดียว: กันเรียกซ้ำเมื่อ effect รันสองรอบ (React.StrictMode)
let pendingEmailVerification = null;
const verifyEmailOnce = (token) => {
  if (pendingEmailVerification?.token !== token) {
    pendingEmailVerification = { token, promise: authApi.verifyEmail(token) };
  }
  return pendingEmailVerification.promise;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.error('Failed to load user auth state:', e);
      return null;
    }
  });

  const [savedEmail, setSavedEmail] = useState(() => {
    return localStorage.getItem(REMEMBER_ME_KEY) || '';
  });

  const [backendStatus, setBackendStatus] = useState('checking'); // 'connected' | 'offline' | 'checking'
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // ลิงก์ยืนยันอีเมล: {VITE_APP_URL}/verify-email?token=...
  const [emailVerification, setEmailVerification] = useState(() => {
    const isVerifyPath = window.location.pathname.replace(/\/+$/, '') === '/verify-email';
    const token = new URLSearchParams(window.location.search).get('token');
    return isVerifyPath && token ? { status: 'verifying', token, message: '' } : null;
  });

  // Check Backend health and verify user token on app mount
  useEffect(() => {
    let isMounted = true;

    const verifyEmailFromLink = async (token) => {
      // ลบ token ออกจาก URL ทันที ไม่ให้ค้างใน history / ถูกแชร์ต่อ
      window.history.replaceState(null, '', '/');
      try {
        const data = await verifyEmailOnce(token);
        if (!isMounted) return;
        clearMockLocalStorage();
        const userData = {
          id: data.id,
          name: data.displayName,
          email: data.email,
          avatarUrl: data.avatarUrl,
          isGuest: false,
          registeredAt: new Date().toISOString()
        };
        setUser(userData);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
        localStorage.setItem(REMEMBER_ME_KEY, data.email);
        setSavedEmail(data.email);
        setEmailVerification({ status: 'success', message: 'ยืนยันอีเมลสำเร็จ ยินดีต้อนรับสู่ Walletly!' });
      } catch (err) {
        if (!isMounted) return;
        setEmailVerification({
          status: 'error',
          message: err?.message || 'ลิงก์ยืนยันอีเมลไม่ถูกต้องหรือหมดอายุแล้ว'
        });
      }
    };

    if (emailVerification?.status === 'verifying') {
      verifyEmailFromLink(emailVerification.token);
    }

    const verifySession = async () => {
      try {
        await healthApi.check();
        if (isMounted) setBackendStatus('connected');

        const token = getStoredToken();
        if (token) {
          try {
            const me = await authApi.getMe();
            if (isMounted && me) {
              const updatedUser = {
                id: me.id,
                name: me.displayName,
                email: me.email,
                avatarUrl: me.avatarUrl,
                isGuest: me.isGuest || false,
                lastLoginAt: me.lastLoginAt
              };
              setUser(updatedUser);
              localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
            }
          } catch (err) {
            console.warn('Session verification failed, logging out or offline:', err);
            // If token expired (401), clear invalid auth
            if (err?.status === 401) {
              authApi.logout();
              clearMockLocalStorage();
              if (isMounted) setUser(null);
            }
          }
        }
      } catch (err) {
        console.warn('Backend server unreachable, running in local/offline mode:', err);
        if (isMounted) setBackendStatus('offline');
      }
    };

    verifySession();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email, password, rememberMe = true) => {
    setIsAuthLoading(true);
    try {
      const data = await authApi.login(email, password);
      clearMockLocalStorage();
      const userData = {
        id: data.id,
        name: data.displayName || email.split('@')[0],
        email: data.email,
        avatarUrl: data.avatarUrl,
        isGuest: false,
        loginAt: new Date().toISOString()
      };

      setUser(userData);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));

      if (rememberMe) {
        localStorage.setItem(REMEMBER_ME_KEY, email);
        setSavedEmail(email);
      } else {
        localStorage.removeItem(REMEMBER_ME_KEY);
        setSavedEmail('');
      }

      setBackendStatus('connected');
      setIsAuthLoading(false);
      return { success: true, user: userData };
    } catch (err) {
      console.warn('Backend login failed:', err);

      // If backend is offline or network error, allow simulated fallback for demo/offline test
      if (err.status === undefined || err.status === 0 || err.status >= 500) {
        const username = email.split('@')[0] || 'ผู้ใช้งาน';
        const formattedName = username.charAt(0).toUpperCase() + username.slice(1);
        const userData = {
          name: formattedName,
          email: email,
          isGuest: false,
          isOffline: true,
          loginAt: new Date().toISOString()
        };
        setUser(userData);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
        if (rememberMe) {
          localStorage.setItem(REMEMBER_ME_KEY, email);
          setSavedEmail(email);
        }
        setIsAuthLoading(false);
        return { success: true, user: userData, isOffline: true };
      }

      setIsAuthLoading(false);
      return {
        success: false,
        error: err.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง'
      };
    }
  };

  const register = async (fullName, email, password) => {
    setIsAuthLoading(true);
    try {
      const data = await authApi.register(fullName, email, password);

      // BE เปิดยืนยันอีเมล: ยังไม่มีบัญชี/token จนกว่าผู้ใช้จะกดลิงก์ในอีเมล
      if (!data?.accessToken) {
        localStorage.setItem(REMEMBER_ME_KEY, email);
        setSavedEmail(email);
        setBackendStatus('connected');
        setIsAuthLoading(false);
        return {
          success: true,
          pendingVerification: true,
          message: data?.message || 'เราได้ส่งลิงก์ยืนยันไปที่อีเมลแล้ว กรุณาตรวจสอบกล่องจดหมาย'
        };
      }

      clearMockLocalStorage();
      const userData = {
        id: data.id,
        name: data.displayName || fullName,
        email: data.email,
        avatarUrl: data.avatarUrl,
        isGuest: false,
        registeredAt: new Date().toISOString()
      };

      setUser(userData);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
      localStorage.setItem(REMEMBER_ME_KEY, email);
      setSavedEmail(email);

      setBackendStatus('connected');
      setIsAuthLoading(false);
      return { success: true, user: userData };
    } catch (err) {
      console.warn('Backend register failed:', err);

      if (err.status === undefined || err.status === 0 || err.status >= 500) {
        const userData = {
          name: fullName || 'สมาชิกใหม่',
          email: email,
          isGuest: false,
          isOffline: true,
          registeredAt: new Date().toISOString()
        };
        setUser(userData);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
        localStorage.setItem(REMEMBER_ME_KEY, email);
        setSavedEmail(email);
        setIsAuthLoading(false);
        return { success: true, user: userData, isOffline: true };
      }

      setIsAuthLoading(false);
      return {
        success: false,
        error: err.message || 'ไม่สามารถลงทะเบียนได้ กรุณาตรวจสอบข้อมูล'
      };
    }
  };

  const loginWithSocial = async (provider, accountInfo = null) => {
    setIsAuthLoading(true);
    const providerName = provider === 'google' ? 'Google' : 'Facebook';
    const emailToUse =
      typeof accountInfo === 'string'
        ? accountInfo
        : accountInfo?.email ||
          (provider === 'google' ? 'user.future@gmail.com' : 'user.future@facebook.com');
    const displayNameToUse =
      accountInfo?.displayName ||
      (emailToUse ? emailToUse.split('@')[0] : `${providerName} User`);
    const avatarUrlToUse =
      accountInfo?.avatarUrl ||
      (provider === 'google'
        ? 'https://lh3.googleusercontent.com/a/default-user'
        : 'https://graph.facebook.com/user/picture');

    try {
      const data = await authApi.loginSocial(provider, {
        email: emailToUse,
        displayName: displayNameToUse,
        avatarUrl: avatarUrlToUse
      });

      clearMockLocalStorage();
      const userData = {
        id: data.id,
        name: data.displayName || displayNameToUse,
        email: data.email,
        avatarUrl: data.avatarUrl || avatarUrlToUse,
        provider: provider,
        isGuest: false,
        loginAt: new Date().toISOString()
      };

      setUser(userData);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
      setBackendStatus('connected');
      setIsAuthLoading(false);
      return { success: true, user: userData };
    } catch (err) {
      // BE ตอบกลับมาแล้วแต่ปฏิเสธ (เช่น ยังไม่ได้เชื่อม Google/Facebook SDK จึงไม่มี token จริง):
      // ห้ามแอบล็อกอินแบบ local เพราะจะได้ผู้ใช้ที่ไม่มี token และเรียก API ไม่ได้ทั้งแอป
      if (err?.status && err.status < 500) {
        console.warn('Social backend login rejected:', err);
        setIsAuthLoading(false);
        return {
          success: false,
          error: `ยังไม่รองรับการเข้าสู่ระบบด้วย ${providerName} กรุณาใช้อีเมลและรหัสผ่าน`
        };
      }

      console.warn('Social backend login failed (offline), falling back to local:', err);
      const userData = {
        name: displayNameToUse,
        email: emailToUse,
        provider: provider,
        isGuest: false,
        loginAt: new Date().toISOString()
      };
      setUser(userData);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
      setIsAuthLoading(false);
      return { success: true, user: userData };
    }
  };

  const loginAsGuest = () => {
    const guestUser = {
      name: 'ผู้เยี่ยมชม (Guest)',
      email: 'guest@futurewallet.app',
      isGuest: true,
      loginAt: new Date().toISOString()
    };

    setUser(guestUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(guestUser));
    return { success: true, user: guestUser };
  };

  const logout = () => {
    authApi.logout();
    clearMockLocalStorage();
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        savedEmail,
        backendStatus,
        isAuthLoading,
        emailVerification,
        clearEmailVerification: () => setEmailVerification(null),
        login,
        register,
        loginWithSocial,
        loginAsGuest,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
