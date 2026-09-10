import { useState, useEffect } from 'react';
import { loadAllocationSettings, saveAllocationSettings } from './allocationStorage';

export const useAllocationState = () => {
  const [allocationSettings, setAllocationSettings] = useState(() => loadAllocationSettings());

  useEffect(() => {
    saveAllocationSettings(allocationSettings);
  }, [allocationSettings]);

  const updateAllocationSettings = (newSettings) => {
    setAllocationSettings(prev => ({ ...prev, ...newSettings }));
  };

  return {
    allocationSettings,
    setAllocationSettings,
    updateAllocationSettings
  };
};
