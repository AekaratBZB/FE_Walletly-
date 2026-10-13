import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, getStoredToken, healthApi } from '../shared/api';
import { toAuthError, toUserData, restoreStoredUser } from './authHelpers';

const AUTH_STORAGE_KEY = 'future_wallet_auth_user';
const REMEMBER_ME_KEY = 'future_wallet_remember_email';

const PROVIDER_NAMES = { google: 'Google', facebook: 'Facebook' };

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

const persistUser = (userData) => {
  try {
    if (userData) localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
    else localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to persist user auth state:', e);
  }
};

const readStorage = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
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
  const [user, setUser] = useState(() => restoreStoredUser(readStorage(AUTH_STORAGE_KEY), !!getStoredToken()));
  const [savedEmail, setSavedEmail] = useState(() => readStorage(REMEMBER_ME_KEY) || '');
  const [backendStatus, setBackendStatus] = useState('checking'); // 'connected' | 'offline' | 'checking'
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // ลิงก์ยืนยันอีเมล: {VITE_APP_URL}/verify-email?token=...
  const [emailVerification, setEmailVerification] = useState(() => {
    const isVerifyPath = window.location.pathname.replace(/\/+$/, '') === '/verify-email';
    const token = new URLSearchParams(window.location.search).get('token');
    return isVerifyPath && token ? { status: 'verifying', token, message: '' } : null;
  });

  const rememberEmail = (email) => {
    try {
      if (email) localStorage.setItem(REMEMBER_ME_KEY, email);
      else localStorage.removeItem(REMEMBER_ME_KEY);
    } catch (e) {
      console.error('Failed to store remembered email:', e);
    }
    setSavedEmail(email || '');
  };

  // ใช้หลัง BE ออก token ให้แล้วเท่านั้น
  const signIn = (dto, extra) => {
    clearMockLocalStorage();
    const userData = toUserData(dto, extra);
    setUser(userData);
    persistUser(userData);
    setBackendStatus('connected');
    return userData;
  };

  const runAuth = async (action) => {
    setIsAuthLoading(true);
    try {
      return await action();
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Check Backend health and verify user token on app mount
  useEffect(() => {
    let isMounted = true;

    const verifyEmailFromLink = async (token) => {
      // ลบ token ออกจาก URL ทันที ไม่ให้ค้างใน history / ถูกแชร์ต่อ
      window.history.replaceState(null, '', '/');
      try {
        const data = await verifyEmailOnce(token);
        if (!isMounted) return;
        signIn(data, { registeredAt: new Date().toISOString() });
        rememberEmail(data.email);
        setEmailVerification({ status: 'success', message: 'ยืนยันอีเมลสำเร็จ ยินดีต้อนรับสู่ Future Wallet!' });
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

        if (getStoredToken()) {
          try {
            const me = await authApi.getMe();
            if (isMounted && me) {
              const updatedUser = toUserData(me, { isGuest: me.isGuest || false, lastLoginAt: me.lastLoginAt });
              setUser(updatedUser);
              persistUser(updatedUser);
            }
          } catch (err) {
            console.warn('Session verification failed:', err);
            if (err?.status === 401) {
              authApi.logout();
              clearMockLocalStorage();
              persistUser(null);
              if (isMounted) setUser(null);
            }
          }
        }
      } catch (err) {
        console.warn('Backend server unreachable:', err);
        if (isMounted) setBackendStatus('offline');
      }
    };

    verifySession();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = (email, password, rememberMe = true) =>
    runAuth(async () => {
      try {
        const data = await authApi.login(email, password);
        const userData = signIn(data, { loginAt: new Date().toISOString() });
        rememberEmail(rememberMe ? email : '');
        return { success: true, user: userData };
      } catch (err) {
        console.warn('Login failed:', err);
        return { success: false, error: toAuthError(err, { fallback: 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง' }) };
      }
    });

  const register = (fullName, email, password) =>
    runAuth(async () => {
      try {
        const data = await authApi.register(fullName, email, password);

        // BE เปิดยืนยันอีเมล: ยังไม่มีบัญชี/token จนกว่าผู้ใช้จะกดลิงก์ในอีเมล
        if (!data?.accessToken) {
          rememberEmail(email);
          setBackendStatus('connected');
          return {
            success: true,
            pendingVerification: true,
            message: data?.message || 'เราได้ส่งลิงก์ยืนยันไปที่อีเมลแล้ว กรุณาตรวจสอบกล่องจดหมาย'
          };
        }

        const userData = signIn(data, { registeredAt: new Date().toISOString() });
        rememberEmail(email);
        return { success: true, user: userData };
      } catch (err) {
        console.warn('Register failed:', err);
        return { success: false, error: toAuthError(err, { fallback: 'ไม่สามารถสมัครสมาชิกได้ กรุณาตรวจสอบข้อมูล' }) };
      }
    });

  // token = Google ID token หรือ Facebook access token จาก SDK จริง
  const loginWithSocial = (provider, token) =>
    runAuth(async () => {
      try {
        const data = await authApi.loginSocial(provider, token);
        const userData = signIn(data, { provider, loginAt: new Date().toISOString() });
        return { success: true, user: userData };
      } catch (err) {
        console.warn(`${provider} login failed:`, err);
        const message = `เข้าสู่ระบบด้วย ${PROVIDER_NAMES[provider] || provider} ไม่สำเร็จ กรุณาลองใหม่หรือใช้อีเมล`;
        return { success: false, error: toAuthError(err, { fallback: message, unauthorized: message }) };
      }
    });

  const loginAsGuest = () => {
    const guestUser = {
      name: 'ผู้เยี่ยมชม (Guest)',
      email: 'guest@futurewallet.app',
      isGuest: true,
      loginAt: new Date().toISOString()
    };

    setUser(guestUser);
    persistUser(guestUser);
    return { success: true, user: guestUser };
  };

  const logout = () => {
    authApi.logout();
    clearMockLocalStorage();
    setUser(null);
    persistUser(null);
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
