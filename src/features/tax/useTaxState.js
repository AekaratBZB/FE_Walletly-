import { useState, useEffect } from 'react';
import { EMPTY_TAX_SETTINGS, loadTaxSettings, saveTaxSettings } from './taxStorage';
import { taxesApi, getStoredToken } from '../../shared/api';

export const useTaxState = ({ addToast, userId } = {}) => {
  const [taxSettings, setTaxSettings] = useState(() =>
    getStoredToken() ? { ...EMPTY_TAX_SETTINGS } : loadTaxSettings()
  );
  const [isLoadingTax, setIsLoadingTax] = useState(false);

  useEffect(() => {
    saveTaxSettings(taxSettings);
  }, [taxSettings]);

  // Load from backend API if authenticated and re-fetch when userId changes
  useEffect(() => {
    const token = getStoredToken();
    if (!token || !userId) {
      if (!token) {
        setTaxSettings(loadTaxSettings());
      }
      return;
    }

    let isMounted = true;
    const fetchApiTax = async () => {
      try {
        setIsLoadingTax(true);
        const res = await taxesApi.getSetting(taxSettings.taxYear || 2026);
        // Start from an empty form, not the previous local state, so another
        // account's (or demo) values never bleed into this user's form.
        if (isMounted && res && typeof res === 'object') {
          setTaxSettings({ ...EMPTY_TAX_SETTINGS, ...res });
        }
      } catch (err) {
        console.warn('Failed to fetch tax settings from API, using local:', err);
      } finally {
        if (isMounted) setIsLoadingTax(false);
      }
    };

    fetchApiTax();
    return () => {
      isMounted = false;
    };
  }, [userId]);

  const updateTaxSettings = async (newSettings) => {
    const updated = { ...taxSettings, ...newSettings };
    setTaxSettings(updated);

    const token = getStoredToken();
    if (token) {
      try {
        await taxesApi.saveSetting(updated);
      } catch (err) {
        console.warn('Failed to sync tax settings to BE:', err);
      }
    }
  };

  const resetTaxSettings = async () => {
    setTaxSettings({ ...EMPTY_TAX_SETTINGS });
    const token = getStoredToken();
    if (token) {
      try {
        await taxesApi.saveSetting(EMPTY_TAX_SETTINGS);
      } catch (err) {
        console.warn('Failed to reset tax settings in BE:', err);
      }
    }
    if (addToast) {
      addToast('รีเซ็ตข้อมูลแบบฟอร์มภาษีเรียบร้อยแล้ว', 'info');
    }
  };

  return {
    taxSettings,
    setTaxSettings,
    isLoadingTax,
    updateTaxSettings,
    resetTaxSettings
  };
};
