import { useState, useEffect, useRef } from 'react';
import { loadTransactions, saveTransactions } from './transactionsStorage';
import { transactionsApi, paymentMethodsApi, getStoredToken } from '../../shared/api';
import { mapTransactionDto, resolveCategoryId, buildUpdatePayload } from './transactionMapping';

// กันโหลดไม่รู้จบถ้า BE ตอบ totalPages ผิดปกติ (100 หน้า x 100 รายการ)
const MAX_TRANSACTION_PAGES = 100;

export const useTransactionsState = ({ addToast, categories = [], userId, onSynced } = {}) => {
  const token = getStoredToken();
  const [transactions, setTransactions] = useState(() => (token ? [] : loadTransactions()));
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [isLoadingTx, setIsLoadingTx] = useState(false);
  // ชื่อช่องทางชำระ -> id บน BE (แคชไว้ ไม่ต้องเรียกซ้ำทุกรายการ)
  const paymentMethodIds = useRef(new Map());

  // BE เก็บช่องทางชำระเป็น id: หา/สร้างตามชื่อ ถ้า BE ยังไม่มี endpoint ให้บันทึกต่อโดยไม่ระบุช่องทาง
  const resolvePaymentMethodId = async (name) => {
    if (!name) return null;
    const cached = paymentMethodIds.current.get(name);
    if (cached) return cached;
    try {
      const pm = await paymentMethodsApi.ensure(name);
      if (pm?.id) paymentMethodIds.current.set(name, pm.id);
      return pm?.id ?? null;
    } catch (err) {
      console.warn('Failed to resolve payment method on BE:', err);
      return null;
    }
  };

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

    return items.map(mapTransactionDto);
  };

  // โหลดรายการใหม่จาก BE (เช่น หลังฝากเงินออมที่ BE สร้าง transaction ให้เอง)
  const reloadTransactions = async () => {
    if (!getStoredToken() || !userId) return;
    try {
      setTransactions(await fetchAllApiTransactions());
      onSynced?.();
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
        const categoryId = resolveCategoryId(tx, categories);
        if (!categoryId) console.warn(`No ${tx.type} category to sync transaction to BE`);

        if (categoryId) {
          const paymentMethodId = await resolvePaymentMethodId(newTx.paymentMethod);
          const created = await transactionsApi.create({
            type: newTx.type,
            amount: newTx.amount,
            txDate: newTx.date || new Date().toISOString().slice(0, 10),
            categoryId,
            paymentMethodId,
            note: newTx.note || ''
          });

          if (created?.id) {
            setTransactions(prev =>
              prev.map(t => (t.id === newTx.id ? { ...t, id: created.id } : t))
            );
          }
          // BE อาจผูกฟิกคอสที่บันทึกเองแทนแถวอัตโนมัติของเดือนนั้น จึงโหลดรายการใหม่ (เรียก onSynced ในตัว)
          await reloadTransactions();
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

  // แก้ไขรายการ: คืนค่า true เมื่อสำเร็จ (ให้ modal ปิดได้), แจ้ง toast เองเมื่อพลาด
  const updateTransaction = async (original, changes) => {
    const token = getStoredToken();
    const isBackendTx = token && typeof original.id === 'string' && !original.id.startsWith('tx-');

    if (!isBackendTx) {
      setTransactions(prev => prev.map(t => (t.id === original.id ? { ...t, ...changes } : t)));
      addToast?.('แก้ไขรายการเรียบร้อยแล้ว', 'success');
      return true;
    }

    const categoryId = resolveCategoryId(changes, categories);
    if (!categoryId) {
      addToast?.('ไม่พบหมวดหมู่ที่เลือก', 'danger');
      return false;
    }

    try {
      const paymentMethodId =
        changes.paymentMethod === original.paymentMethod && original.paymentMethodId
          ? original.paymentMethodId
          : await resolvePaymentMethodId(changes.paymentMethod);
      await transactionsApi.update(
        original.id,
        buildUpdatePayload(original, changes, { categoryId, paymentMethodId })
      );
    } catch (err) {
      addToast?.(err?.message || 'ไม่สามารถแก้ไขรายการได้', 'danger');
      return false;
    }

    await reloadTransactions();
    addToast?.('แก้ไขรายการเรียบร้อยแล้ว', 'success');
    return true;
  };

  const deleteTransaction = async (id) => {
    setTransactions(prev => prev.filter(t => t.id !== id));

    const token = getStoredToken();
    if (token && id && typeof id === 'string' && id.includes('-') && !id.startsWith('tx-')) {
      try {
        await transactionsApi.delete(id);
        onSynced?.();
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
    editingTx,
    setEditingTx,
    isLoadingTx,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    reloadTransactions
  };
};
