import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEMO_DATA } from '../shared/demoData';
import { useTransactionsState } from '../features/transactions';
import { useFixedCostsState } from '../features/fixed-costs';
import { useSavingsState } from '../features/savings';
import { useTaxState } from '../features/tax';
import { EMPTY_TAX_SETTINGS } from '../features/tax/taxStorage';
import { EMPTY_ALLOCATION_SETTINGS } from '../features/allocation/allocationStorage';
import { useAllocationState } from '../features/allocation';
import { useDebtState, DEFAULT_BUDGET_PROFILE, buildPrefillProfile } from '../features/debt';
import { categoriesApi, getStoredToken } from '../shared/api';
import { useAuth } from './AuthContext';

const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  // Current authenticated user from AuthContext
  const { user } = useAuth();
  const userId = user?.id;

  // Navigation State
  const [activeTab, setActiveTab] = useState('dashboard');

  // Categories loaded from Backend API
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const token = getStoredToken();
    if (!token || !userId) {
      setCategories([]);
      return;
    }

    let isMounted = true;
    const fetchCategories = async () => {
      try {
        const data = await categoriesApi.getAll();
        if (isMounted && Array.isArray(data)) {
          setCategories(data);
        }
      } catch (e) {
        console.warn('Failed to load categories from API:', e);
      }
    };
    fetchCategories();
    return () => {
      isMounted = false;
    };
  }, [userId]);

  // Toasts System
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 3800);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // เพิ่มทุกครั้งที่ BE บันทึกรายการ/ฟิกคอสสำเร็จ: ยอดสรุปที่ BE คำนวณ (หน้าภาพรวม) จะโหลดใหม่หลังข้อมูลบน BE อัปเดตแล้ว
  const [dataVersion, setDataVersion] = useState(0);
  const onSynced = () => setDataVersion(v => v + 1);

  // Modular Feature Slices
  const transactionsSlice = useTransactionsState({ addToast, categories, userId, onSynced });
  const fixedCostsSlice = useFixedCostsState({ addToast, categories, userId, onSynced });
  const savingsSlice = useSavingsState({
    addToast,
    addTransaction: transactionsSlice.addTransaction,
    reloadTransactions: transactionsSlice.reloadTransactions,
    userId
  });
  const taxSlice = useTaxState({ addToast, userId });
  const allocationSlice = useAllocationState({ userId });
  const debtSlice = useDebtState({
    addToast,
    allocationSettings: allocationSlice.allocationSettings,
    fixedCosts: fixedCostsSlice.fixedCosts,
    savingsGoals: savingsSlice.savingsGoals,
    transactions: transactionsSlice.transactions,
    userId
  });

  // Cross-Cutting: Export / Import / Reset
  const exportBackupJSON = () => {
    const backup = {
      version: '2.1-react',
      exportedAt: new Date().toISOString(),
      transactions: transactionsSlice.transactions,
      fixedCosts: fixedCostsSlice.fixedCosts,
      allocationSettings: allocationSlice.allocationSettings,
      savingsGoals: savingsSlice.savingsGoals,
      taxSettings: taxSlice.taxSettings,
      debts: debtSlice.debts,
      budgetProfile: debtSlice.budgetProfile
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Walletly_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('สำรองข้อมูล JSON เรียบร้อยแล้ว', 'success');
  };

  const importBackupJSON = (jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      if (data.transactions) transactionsSlice.setTransactions(data.transactions);
      if (data.fixedCosts) fixedCostsSlice.setFixedCosts(data.fixedCosts);
      if (data.allocationSettings) allocationSlice.setAllocationSettings(data.allocationSettings);
      if (data.savingsGoals) savingsSlice.setSavingsGoals(data.savingsGoals);
      if (data.taxSettings) taxSlice.setTaxSettings(data.taxSettings);
      if (data.debts) debtSlice.setDebts(data.debts);
      if (data.budgetProfile) {
        debtSlice.setBudgetProfile({ ...DEFAULT_BUDGET_PROFILE, ...data.budgetProfile });
      }
      addToast('นำเข้าข้อมูลสำเร็จเรียบร้อยแล้ว!', 'success');
      return { success: true };
    } catch (e) {
      addToast(`เกิดข้อผิดพลาดในการนำเข้าไฟล์: ${e.message}`, 'danger');
      return { success: false, error: e.message };
    }
  };

  const exportTransactionsCSV = () => {
    const txs = transactionsSlice.transactions;
    if (!txs.length) {
      addToast('ไม่มีข้อมูลธุรกรรมสำหรับส่งออก', 'warning');
      return;
    }
    const headers = ['ID', 'Date', 'Type', 'Category', 'Amount (THB)', 'Payment Method', 'Note'];
    const rows = txs.map(t => [
      t.id,
      t.date,
      t.type,
      `"${(t.category || '').replace(/"/g, '""')}"`,
      t.amount,
      `"${(t.paymentMethod || '').replace(/"/g, '""')}"`,
      `"${(t.note || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Walletly_Transactions_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('ส่งออกไฟล์ CSV เรียบร้อยแล้ว', 'success');
  };

  const resetToDemo = () => {
    transactionsSlice.setTransactions(DEMO_DATA.transactions);
    fixedCostsSlice.setFixedCosts(DEMO_DATA.fixedCosts);
    allocationSlice.setAllocationSettings(DEMO_DATA.allocationSettings);
    savingsSlice.setSavingsGoals(DEMO_DATA.savingsGoals);
    taxSlice.setTaxSettings(DEMO_DATA.taxSettings);
    debtSlice.setDebts([]);
    debtSlice.setBudgetProfile(
      buildPrefillProfile({
        allocationSettings: DEMO_DATA.allocationSettings,
        fixedCosts: DEMO_DATA.fixedCosts,
        savingsGoals: DEMO_DATA.savingsGoals,
        transactions: DEMO_DATA.transactions
      })
    );
    addToast('โหลดข้อมูลตัวอย่าง (Demo Data) สำเร็จแล้ว!', 'success');
  };

  const clearAllData = () => {
    transactionsSlice.setTransactions([]);
    fixedCostsSlice.setFixedCosts([]);
    savingsSlice.setSavingsGoals([]);
    allocationSlice.setAllocationSettings({ ...EMPTY_ALLOCATION_SETTINGS });
    taxSlice.setTaxSettings({ ...EMPTY_TAX_SETTINGS });
    debtSlice.setDebts([]);
    debtSlice.setBudgetProfile(DEFAULT_BUDGET_PROFILE);
    addToast('ล้างข้อมูลทั้งหมดในระบบเรียบร้อยแล้ว', 'info');
  };

  return (
    <WalletContext.Provider
      value={{
        activeTab,
        setActiveTab,
        toasts,
        addToast,
        removeToast,
        exportBackupJSON,
        importBackupJSON,
        exportTransactionsCSV,
        resetToDemo,
        clearAllData,
        categories,
        dataVersion,
        ...transactionsSlice,
        ...fixedCostsSlice,
        ...savingsSlice,
        ...taxSlice,
        ...allocationSlice,
        ...debtSlice
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
