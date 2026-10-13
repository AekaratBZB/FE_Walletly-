import { useState, useEffect } from 'react';
import { loadTransactions, saveTransactions } from './transactionsStorage';
import { transactionsApi, getStoredToken } from '../../shared/api';

// กันโหลดไม่รู้จบถ้า BE ตอบ totalPages ผิดปกติ (100 หน้า x 100 รายการ)
const MAX_TRANSACTION_PAGES = 100;

export const useTransactionsState = ({ addToast, categories = [], userId } = {}) => {
  const token = getStoredToken();
  const [transactions, setTransactions] = useState(() => (token ? [] : loadTransactions()));
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [isLoadingTx, setIsLoadingTx] = useState(false);

  // Sync to local storage
  useEffect(() => {
    saveTransactions(transactions);
  }, [transactions]);

  // BE จำกัด pageSize สูงสุด 100 จึงต้องดึงทีละหน้าจนครบ
  const fetchAllApiTransactions = async () => {
    const items = [];
    let page = 1;
    let totalPages = 1;
    do {
      const res = await transactionsApi.getAll({ page, pageSize: 100 });
      if (!res || !Array.isArray(res.items)) break;
      items.push(...res.items);
      totalPages = Number(res.totalPages) || 1;
      page++;
    } while (page <= totalPages && page <= MAX_TRANSACTION_PAGES);

    return items.map(dto => ({
      id: dto.id,
      date: dto.txDate,
      type: dto.type,
      category: dto.categoryName || 'ทั่วไป',
      categoryId: dto.categoryId,
      amount: Number(dto.amount) || 0,
      paymentMethod: dto.paymentMethodName || '',
      note: dto.note || ''
    }));
  };

  // โหลดรายการใหม่จาก BE (เช่น หลังฝากเงินออมที่ BE สร้าง transaction ให้เอง)
  const reloadTransactions = async () => {
    if (!getStoredToken() || !userId) return;
    try {
      setTransactions(await fetchAllApiTransactions());
    } catch (err) {
      console.warn('Failed to reload transactions from API:', err);
    }
  };

  // Load from backend API if authenticated and re-fetch when userId changes
  useEffect(() => {
    const currentToken = getStoredToken();
    if (!currentToken || !userId) {
      if (!currentToken) {
        setTransactions(loadTransactions());
      }
      return;
    }

    let isMounted = true;
    const fetchApiTransactions = async () => {
      try {
        setIsLoadingTx(true);
        const mapped = await fetchAllApiTransactions();
        if (isMounted) setTransactions(mapped);
      } catch (err) {
        console.warn('Failed to fetch transactions from API, using local:', err);
      } finally {
        if (isMounted) setIsLoadingTx(false);
      }
    };

    fetchApiTransactions();
    return () => {
      isMounted = false;
    };
  }, [userId]);

  const addTransaction = async (tx) => {
    const newTx = {
      ...tx,
      id: tx.id || `tx-${Date.now()}`,
      amount: Number(tx.amount) || 0
    };

    // Optimistic state update
    setTransactions(prev => [newTx, ...prev]);

    const token = getStoredToken();
    if (token) {
      try {
        // Resolve categoryId
        let categoryId = tx.categoryId;
        if (!categoryId && categories.length > 0) {
          const match = categories.find(
            c =>
              c.name.toLowerCase() === (tx.category || '').toLowerCase() ||
              c.type === tx.type
          );
          categoryId = match?.id || categories[0]?.id;
        }

        if (categoryId) {
          const created = await transactionsApi.create({
            type: newTx.type,
            amount: newTx.amount,
            txDate: newTx.date || new Date().toISOString().slice(0, 10),
            categoryId,
            note: newTx.note || ''
          });

          if (created?.id) {
            setTransactions(prev =>
              prev.map(t => (t.id === newTx.id ? { ...t, id: created.id } : t))
            );
          }
        }
      } catch (err) {
        console.warn('Failed to sync new transaction to BE:', err);
      }
    }

    if (addToast) {
      addToast(
        `บันทึกรายการ "${newTx.category}" จำนวน ${newTx.amount.toLocaleString()} ฿ เรียบร้อยแล้ว`,
        'success'
      );
    }
  };

  const deleteTransaction = async (id) => {
    setTransactions(prev => prev.filter(t => t.id !== id));

    const token = getStoredToken();
    if (token && id && typeof id === 'string' && id.includes('-') && !id.startsWith('tx-')) {
      try {
        await transactionsApi.delete(id);
      } catch (err) {
        console.warn('Failed to delete transaction from BE:', err);
      }
    }

    if (addToast) {
      addToast('ลบรายการธุรกรรมเรียบร้อยแล้ว', 'info');
    }
  };

  return {
    transactions,
    setTransactions,
    isAddTxOpen,
    setIsAddTxOpen,
    isLoadingTx,
    addTransaction,
    deleteTransaction,
    reloadTransactions
  };
};
