import { useState, useEffect, useRef } from 'react';
import { EMPTY_ALLOCATION_SETTINGS, loadAllocationSettings, saveAllocationSettings } from './allocationStorage';
import { allocationsApi, getStoredToken } from '../../shared/api';

const INCOME_SYNC_DELAY_MS = 800;

export const useAllocationState = ({ userId } = {}) => {
  const [allocationSettings, setAllocationSettings] = useState(() =>
    getStoredToken() ? { ...EMPTY_ALLOCATION_SETTINGS } : loadAllocationSettings()
  );
  const [isLoadingAllocations, setIsLoadingAllocations] = useState(false);
  const incomeSyncTimer = useRef(null);

  useEffect(() => () => clearTimeout(incomeSyncTimer.current), []);

  useEffect(() => {
    saveAllocationSettings(allocationSettings);
  }, [allocationSettings]);

  // Load from backend API if authenticated and re-fetch when userId changes
  useEffect(() => {
    const token = getStoredToken();
    if (!token || !userId) {
      if (!token) {
        setAllocationSettings(loadAllocationSettings());
      }
      return;
    }

    let isMounted = true;
    const fetchApiAllocations = async () => {
      try {
        setIsLoadingAllocations(true);
        const res = await allocationsApi.getSetting();
        if (isMounted && res) {
          const bucketsObj = {};
          if (Array.isArray(res.buckets)) {
            res.buckets.forEach(b => {
              bucketsObj[b.bucketKey] = Number(b.targetPercent) || 0;
            });
          }
          // Build from empty defaults, not prev, so a stale local value never
          // survives a server income of 0.
          setAllocationSettings({
            ...EMPTY_ALLOCATION_SETTINGS,
            rule: res.ruleKey || EMPTY_ALLOCATION_SETTINGS.rule,
            monthlyIncome: Number(res.monthlyIncome) || 0,
            buckets: Object.keys(bucketsObj).length > 0 ? bucketsObj : EMPTY_ALLOCATION_SETTINGS.buckets
          });
        }
      } catch (err) {
        console.warn('Failed to fetch allocations from API, using local:', err);
      } finally {
        if (isMounted) setIsLoadingAllocations(false);
      }
    };

    fetchApiAllocations();
    return () => {
      isMounted = false;
    };
  }, [userId]);

  const syncTemplate = async (settings) => {
    try {
      await allocationsApi.applyTemplate({
        templateKey: settings.rule,
        monthlyIncome: settings.monthlyIncome || 0,
        autoAssignCategories: true
      });
    } catch (err) {
      console.warn('Failed to sync allocation template to BE:', err);
    }
  };

  const updateAllocationSettings = async (newSettings) => {
    const updated = { ...allocationSettings, ...newSettings };
    setAllocationSettings(updated);

    if (!getStoredToken()) return;

    clearTimeout(incomeSyncTimer.current);
    if (newSettings.rule) {
      await syncTemplate(updated);
    } else if (newSettings.monthlyIncome !== undefined && updated.rule) {
      // รายได้ถูกแก้ทุกครั้งที่พิมพ์: รอให้หยุดพิมพ์ก่อนค่อยบันทึก
      incomeSyncTimer.current = setTimeout(() => syncTemplate(updated), INCOME_SYNC_DELAY_MS);
    }
  };

  return {
    allocationSettings,
    setAllocationSettings,
    isLoadingAllocations,
    updateAllocationSettings
  };
};
