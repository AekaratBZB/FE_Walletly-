import { useEffect, useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import { getStoredToken, summaryApi } from '../../shared/api';

/**
 * ยอดสรุปเดือนจาก BE (GET /summary/monthly) โหลดใหม่เมื่อเปลี่ยนเดือนหรือ BE บันทึกข้อมูลเสร็จ (dataVersion)
 * enabled = false (ผู้ใช้โหมดทดลอง) จะไม่เรียก API
 */
export const useMonthlySummary = (month, enabled = true) => {
  const { dataVersion } = useWallet();
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!enabled || !getStoredToken()) return undefined;

    let isMounted = true;
    setIsLoading(true);
    summaryApi
      .getMonthly(month)
      .then(data => {
        if (!isMounted) return;
        setSummary(data);
        setError(null);
      })
      .catch(err => {
        console.warn('Failed to load monthly summary:', err);
        if (isMounted) setError(err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [month, enabled, dataVersion, retry]);

  return { summary, error, isLoading, reload: () => setRetry(r => r + 1) };
};
