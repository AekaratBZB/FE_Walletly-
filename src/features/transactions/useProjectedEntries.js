import { useCallback, useEffect, useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import { getStoredToken, recurringEntriesApi } from '../../shared/api';
import { mapTransactionDto } from './transactionMapping';

/**
 * รายการคาดการณ์ (ยังไม่ถึงกำหนด) จาก BE ตามช่วงวันที่ โหลดใหม่เมื่อ dataVersion เปลี่ยน
 * range = null หรือไม่มี token (โหมดทดลอง) จะไม่เรียก API
 */
export const useProjectedEntries = (range) => {
  const { dataVersion } = useWallet();
  const [projected, setProjected] = useState([]);
  const [retry, setRetry] = useState(0);
  const startDate = range?.startDate;
  const endDate = range?.endDate;

  useEffect(() => {
    if (!startDate || !endDate || !getStoredToken()) {
      setProjected([]);
      return undefined;
    }

    let isMounted = true;
    recurringEntriesApi
      .getProjected({ startDate, endDate })
      .then(data => {
        if (isMounted) setProjected((data || []).map(mapTransactionDto));
      })
      .catch(err => {
        console.warn('Failed to load projected entries:', err);
        if (isMounted) setProjected([]);
      });

    return () => {
      isMounted = false;
    };
  }, [startDate, endDate, dataVersion, retry]);

  const reload = useCallback(() => setRetry(r => r + 1), []);

  return { projected, reload };
};
