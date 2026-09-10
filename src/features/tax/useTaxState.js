import { useState, useEffect } from 'react';
import { DEMO_DATA } from '../../shared/demoData';
import { loadTaxSettings, saveTaxSettings } from './taxStorage';

export const useTaxState = ({ addToast } = {}) => {
  const [taxSettings, setTaxSettings] = useState(() => loadTaxSettings());

  useEffect(() => {
    saveTaxSettings(taxSettings);
  }, [taxSettings]);

  const updateTaxSettings = (newSettings) => {
    setTaxSettings(prev => ({ ...prev, ...newSettings }));
  };

  const resetTaxSettings = () => {
    setTaxSettings(DEMO_DATA.taxSettings);
    if (addToast) {
      addToast('รีเซ็ตข้อมูลแบบฟอร์มภาษีเรียบร้อยแล้ว', 'info');
    }
  };

  return {
    taxSettings,
    setTaxSettings,
    updateTaxSettings,
    resetTaxSettings
  };
};
