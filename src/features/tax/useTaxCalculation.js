import { useEffect, useState } from 'react';
import { getStoredToken, taxesApi } from '../../shared/api';
import { toTaxResult } from './taxResult';

const DEBOUNCE_MS = 300;

/** คำนวณภาษีที่ BE ทุกครั้งที่ฟอร์มเปลี่ยน (หน่วงเล็กน้อยไม่ให้ยิงทุกตัวอักษร) */
export const useTaxCalculation = (taxSettings) => {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!getStoredToken()) return undefined;

    let isCurrent = true;
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const dto = await taxesApi.calculateQuick(taxSettings);
        if (!isCurrent) return;
        setResult(toTaxResult(dto));
        setError(null);
      } catch (err) {
        console.warn('Failed to calculate tax on server:', err);
        if (isCurrent) setError(err);
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [taxSettings]);

  return { result, error, isLoading };
};
