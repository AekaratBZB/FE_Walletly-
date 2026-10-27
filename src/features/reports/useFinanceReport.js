import { useEffect, useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import { getStoredToken, summaryApi } from '../../shared/api';

/** รายงานตามช่วงเดือนจาก BE (GET /summary/report) enabled = false (โหมดทดลอง) จะไม่เรียก API */
export const useFinanceReport = ({ from, to }, enabled = true) => {
  const { dataVersion } = useWallet();
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!enabled || !getStoredToken()) return undefined;

    let isMounted = true;
    setIsLoading(true);
    summaryApi
      .getReport(from, to)
      .then(data => {
        if (!isMounted) return;
        setReport(data);
        setError(null);
      })
      .catch(err => {
        console.warn('Failed to load finance report:', err);
        if (isMounted) setError(err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [from, to, enabled, dataVersion, retry]);

  return { report, error, isLoading, reload: () => setRetry(r => r + 1) };
};
