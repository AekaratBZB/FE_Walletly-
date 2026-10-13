import { useState, useEffect } from 'react';
import { DEMO_DATA } from '../../shared/demoData';
import { loadTaxSettings, saveTaxSettings } from './taxStorage';
import { taxesApi, getStoredToken } from '../../shared/api';

export const useTaxState = ({ addToast, userId } = {}) => {
  const [taxSettings, setTaxSettings] = useState(() => loadTaxSettings());
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
        if (isMounted && res) {
          setTaxSettings(prev => ({
            ...prev,
            ...res
          }));
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
    setTaxSettings(DEMO_DATA.taxSettings);
    const token = getStoredToken();
    if (token) {
      try {
        await taxesApi.saveSetting(DEMO_DATA.taxSettings);
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
