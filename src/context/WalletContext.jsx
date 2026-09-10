import React, { createContext, useContext, useState } from 'react';
import { DEMO_DATA } from '../shared/demoData';
import { useTransactionsState } from '../features/transactions';
import { useFixedCostsState } from '../features/fixed-costs';
import { useSavingsState } from '../features/savings';
import { useTaxState } from '../features/tax';
import { useAllocationState } from '../features/allocation';
import { useDebtState, DEFAULT_BUDGET_PROFILE, buildPrefillProfile } from '../features/debt';

const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  // Navigation State
  const [activeTab, setActiveTab] = useState('dashboard');

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

  // Modular Feature Slices
  const transactionsSlice = useTransactionsState({ addToast });
  const fixedCostsSlice = useFixedCostsState({ addToast });
  const savingsSlice = useSavingsState({
    addToast,
    addTransaction: transactionsSlice.addTransaction
  });
  const taxSlice = useTaxState({ addToast });
  const allocationSlice = useAllocationState();
  const debtSlice = useDebtState({
    addToast,
    allocationSettings: allocationSlice.allocationSettings,
    fixedCosts: fixedCostsSlice.fixedCosts,
    savingsGoals: savingsSlice.savingsGoals,
    transactions: transactionsSlice.transactions
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
    allocationSlice.setAllocationSettings({
      rule: '50-30-20',
      monthlyIncome: 0,
      buckets: { needs: 50, wants: 30, savings: 20 }
    });
    taxSlice.setTaxSettings({
      taxYear: 2026,
      annualSalary: 0,
      annualBonus: 0,
      freelanceIncome: 0,
      socialSecurity: 0,
      personalDeduction: 60000,
      spouseDeduction: 0,
      childCount: 0,
      parentCount: 0,
      lifeInsurance: 0,
      healthInsurance: 0,
      ssfAmount: 0,
      rmfAmount: 0,
      thaiEsgAmount: 0,
      providentFund: 0,
      mortgageInterest: 0,
      easyReceipt: 0,
      donationGeneral: 0,
      donationEducation: 0,
      withholdingTax: 0
    });
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
