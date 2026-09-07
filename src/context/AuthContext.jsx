import React, { createContext, useContext, useState, useEffect } from 'react';

const AUTH_STORAGE_KEY = 'future_wallet_auth_user';
const REMEMBER_ME_KEY = 'future_wallet_remember_email';

const AuthContext = createContext();

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

  const login = (email, password, rememberMe = true) => {
    // Generate/lookup simulated user
    const username = email.split('@')[0] || 'ผู้ใช้งาน';
    const formattedName = username.charAt(0).toUpperCase() + username.slice(1);
    const userData = {
      name: formattedName,
      email: email,
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

    return { success: true, user: userData };
  };

  const register = (fullName, email, password) => {
    const userData = {
      name: fullName || 'สมาชิกใหม่',
      email: email,
      isGuest: false,
      registeredAt: new Date().toISOString()
    };

    setUser(userData);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
    localStorage.setItem(REMEMBER_ME_KEY, email);
    setSavedEmail(email);

    return { success: true, user: userData };
  };

  const loginWithSocial = (provider) => {
    const providerName = provider === 'google' ? 'Google' : 'Facebook';
    const mockEmail = provider === 'google' ? 'user.future@gmail.com' : 'user.future@facebook.com';
    const userData = {
      name: `${providerName} User`,
      email: mockEmail,
      provider: provider,
      isGuest: false,
      loginAt: new Date().toISOString()
    };

    setUser(userData);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
    return { success: true, user: userData };
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
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        savedEmail,
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
