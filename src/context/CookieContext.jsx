import React, { createContext, useContext, useState, useEffect } from 'react';

const COOKIE_STORAGE_KEY = 'future_wallet_cookie_consent_v1';
const POLICY_VERSION = '1.0';

const DEFAULT_CONSENT = {
  necessary: true, // Always required
  functional: true,
  analytics: true,
  marketing: true
};

const CookieContext = createContext();

export const CookieProvider = ({ children }) => {
  const [consent, setConsent] = useState(() => {
    try {
      const stored = localStorage.getItem(COOKIE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // If policy version matches, respect saved choice
        if (parsed && parsed.version === POLICY_VERSION) {
          return parsed.preferences;
        }
      }
    } catch (e) {
      console.error('Failed to read cookie consent from storage:', e);
    }
    return null; // null means user hasn't made a choice yet
  });

  // Modal open states
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [isPolicyOpen, setIsPolicyOpen] = useState(false);

  // Helper to persist consent
  const persistConsent = (preferences) => {
    const payload = {
      preferences: {
        necessary: true, // Always enforced
        functional: !!preferences.functional,
        analytics: !!preferences.analytics,
        marketing: !!preferences.marketing
      },
      timestamp: new Date().toISOString(),
      version: POLICY_VERSION
    };

    try {
      localStorage.setItem(COOKIE_STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error('Failed to save cookie consent:', e);
    }

    setConsent(payload.preferences);
    setIsPreferencesOpen(false);

    // Optional future backend audit hook:
    // try { fetch('/api/privacy/consent-log', { method: 'POST', body: JSON.stringify(payload) }); } catch(err){}
  };

  // 1. Accept All
  const acceptAll = () => {
    persistConsent({
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true
    });
  };

  // 2. Reject Non-Essential (Only Necessary stays true)
  const rejectNonEssential = () => {
    persistConsent({
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false
    });
  };

  // 3. Save Custom Preferences
  const savePreferences = (customPreferences) => {
    persistConsent(customPreferences);
  };

  // 4. Reset Consent (To allow testing or clearing)
  const resetConsent = () => {
    try {
      localStorage.removeItem(COOKIE_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to remove cookie consent:', e);
    }
    setConsent(null);
  };

  const hasDecided = consent !== null;

  return (
    <CookieContext.Provider
      value={{
        consent: consent || DEFAULT_CONSENT,
        hasDecided,
        isPreferencesOpen,
        setIsPreferencesOpen,
        isPolicyOpen,
        setIsPolicyOpen,
        acceptAll,
        rejectNonEssential,
        savePreferences,
        resetConsent
      }}
    >
      {children}
    </CookieContext.Provider>
  );
};

export const useCookieConsent = () => {
  const context = useContext(CookieContext);
  if (!context) {
    throw new Error('useCookieConsent must be used within a CookieProvider');
  }
  return context;
};
