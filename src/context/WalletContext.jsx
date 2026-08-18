import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEMO_DATA } from '../shared/demoData';

const STORAGE_KEYS = {
  TRANSACTIONS: 'finsmart_transactions_v1',
  FIXED_COSTS: 'finsmart_fixed_costs_v1',
  ALLOCATION_SETTINGS: 'finsmart_allocation_v1',
  SAVINGS_GOALS: 'finsmart_savings_goals_v1',
  TAX_SETTINGS: 'finsmart_tax_settings_v1'
};

const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  // Navigation State
  const [activeTab, setActiveTab] = useState('dashboard');

  // Modal States
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [isAddFixedCostOpen, setIsAddFixedCostOpen] = useState(false);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [quickDepositGoal, setQuickDepositGoal] = useState(null);

  // Toasts
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

  // Helper to load from LocalStorage or fallback to Demo Data
  const loadInitial = (key, fallback) => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to parse localStorage for key:', key, e);
    }
    return fallback;
  };

  // Main State variables
  const [transactions, setTransactions] = useState(() =>
    loadInitial(STORAGE_KEYS.TRANSACTIONS, DEMO_DATA.transactions)
  );

  const [fixedCosts, setFixedCosts] = useState(() =>
    loadInitial(STORAGE_KEYS.FIXED_COSTS, DEMO_DATA.fixedCosts)
  );

  const [allocationSettings, setAllocationSettings] = useState(() =>
    loadInitial(STORAGE_KEYS.ALLOCATION_SETTINGS, DEMO_DATA.allocationSettings)
  );

  const [savingsGoals, setSavingsGoals] = useState(() =>
    loadInitial(STORAGE_KEYS.SAVINGS_GOALS, DEMO_DATA.savingsGoals)
  );

  const [taxSettings, setTaxSettings] = useState(() =>
    loadInitial(STORAGE_KEYS.TAX_SETTINGS, DEMO_DATA.taxSettings)
  );

  // Persist state changes to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FIXED_COSTS, JSON.stringify(fixedCosts));
  }, [fixedCosts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ALLOCATION_SETTINGS, JSON.stringify(allocationSettings));
  }, [allocationSettings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SAVINGS_GOALS, JSON.stringify(savingsGoals));
  }, [savingsGoals]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TAX_SETTINGS, JSON.stringify(taxSettings));
  }, [taxSettings]);

  // Transaction CRUD
  const addTransaction = (tx) => {
    const newTx = {
      ...tx,
      id: tx.id || `tx-${Date.now()}`,
      amount: Number(tx.amount) || 0
    };
    setTransactions(prev => [newTx, ...prev]);
    addToast(`บันทึกรายการ "${newTx.category}" จำนวน ${newTx.amount.toLocaleString()} ฿ เรียบร้อยแล้ว`, 'success');
  };

  const deleteTransaction = (id) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    addToast('ลบรายการธุรกรรมเรียบร้อยแล้ว', 'info');
  };

  // Fixed Cost CRUD
  const addFixedCost = (cost) => {
    const newCost = {
      ...cost,
      id: cost.id || `fc-${Date.now()}`,
      amount: Number(cost.amount) || 0,
      dueDay: Number(cost.dueDay) || 1,
      isPaid: cost.isPaid || false
    };
    setFixedCosts(prev => [...prev, newCost]);
    addToast(`เพิ่มฟิกคอส "${newCost.title}" จำนวน ${newCost.amount.toLocaleString()} ฿ เรียบร้อยแล้ว`, 'success');
  };

  const toggleFixedCostPaid = (id) => {
    setFixedCosts(prev =>
      prev.map(fc => {
        if (fc.id === id) {
          const nextPaid = !fc.isPaid;
          addToast(nextPaid ? `ทำเครื่องหมาย "${fc.title}" ชำระแล้ว` : `ยกเลิกสถานะชำระ "${fc.title}"`, 'info');
          return { ...fc, isPaid: nextPaid };
        }
        return fc;
      })
    );
  };

  const deleteFixedCost = (id) => {
    setFixedCosts(prev => prev.filter(fc => fc.id !== id));
    addToast('ลบรายการฟิกคอสเรียบร้อยแล้ว', 'info');
  };

  const resetFixedCostsMonthly = () => {
    setFixedCosts(prev => prev.map(fc => ({ ...fc, isPaid: false })));
    addToast('รีเซ็ตสถานะรอบเดือนใหม่เป็น "รอชำระ" ทั้งหมดแล้ว', 'success');
  };

  // Allocation CRUD
  const updateAllocationSettings = (newSettings) => {
    setAllocationSettings(prev => ({ ...prev, ...newSettings }));
  };

  // Savings Goal CRUD
  const addSavingsGoal = (goal) => {
    const newGoal = {
      ...goal,
      id: goal.id || `goal-${Date.now()}`,
      targetAmount: Number(goal.targetAmount) || 0,
      currentAmount: Number(goal.currentAmount) || 0,
      monthlyContribution: Number(goal.monthlyContribution) || 0,
      expectedReturnRate: Number(goal.expectedReturnRate) || 0,
      color: goal.color || (goal.category === 'การลงทุน' ? 'blue' : goal.category === 'ความมั่นคง' ? 'emerald' : 'purple')
    };
    setSavingsGoals(prev => [...prev, newGoal]);
    addToast(`สร้างเป้าหมาย "${newGoal.title}" เรียบร้อยแล้ว`, 'success');
  };

  const depositToSavingsGoal = (goalId, amount, goalTitle = 'เป้าหมาย') => {
    const depositAmount = Number(amount) || 0;
    if (depositAmount <= 0) return;

    setSavingsGoals(prev =>
      prev.map(g => {
        if (g.id === goalId) {
          return { ...g, currentAmount: (Number(g.currentAmount) || 0) + depositAmount };
        }
        return g;
      })
    );

    // Also record transaction
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    addTransaction({
      date: dateStr,
      type: 'savings',
      category: `ออมเข้า: ${goalTitle}`,
      amount: depositAmount,
      paymentMethod: 'โอนผ่านธนาคาร',
      note: `ฝากเงินเพิ่มเข้าเป้าหมาย ${goalTitle}`
    });

    addToast(`ฝากเงิน ${depositAmount.toLocaleString()} ฿ เข้าเป้าหมาย "${goalTitle}" เรียบร้อยแล้ว`, 'success');
  };

  const deleteSavingsGoal = (id) => {
    setSavingsGoals(prev => prev.filter(g => g.id !== id));
    addToast('ลบเป้าหมายการออมเรียบร้อยแล้ว', 'info');
  };

  // Tax CRUD
  const updateTaxSettings = (newSettings) => {
    setTaxSettings(prev => ({ ...prev, ...newSettings }));
  };

  const resetTaxSettings = () => {
    setTaxSettings(DEMO_DATA.taxSettings);
    addToast('รีเซ็ตข้อมูลแบบฟอร์มภาษีเรียบร้อยแล้ว', 'info');
  };

  // Export / Import / Reset / Clear
  const exportBackupJSON = () => {
    const backup = {
      version: '2.0-react',
      exportedAt: new Date().toISOString(),
      transactions,
      fixedCosts,
      allocationSettings,
      savingsGoals,
      taxSettings
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
      if (data.transactions) setTransactions(data.transactions);
      if (data.fixedCosts) setFixedCosts(data.fixedCosts);
      if (data.allocationSettings) setAllocationSettings(data.allocationSettings);
      if (data.savingsGoals) setSavingsGoals(data.savingsGoals);
      if (data.taxSettings) setTaxSettings(data.taxSettings);
      addToast('นำเข้าข้อมูลสำเร็จเรียบร้อยแล้ว!', 'success');
      return { success: true };
    } catch (e) {
      addToast(`เกิดข้อผิดพลาดในการนำเข้าไฟล์: ${e.message}`, 'danger');
      return { success: false, error: e.message };
    }
  };

  const exportTransactionsCSV = () => {
    if (!transactions.length) {
      addToast('ไม่มีข้อมูลธุรกรรมสำหรับส่งออก', 'warning');
      return;
    }
    const headers = ['ID', 'Date', 'Type', 'Category', 'Amount (THB)', 'Payment Method', 'Note'];
    const rows = transactions.map(t => [
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
    setTransactions(DEMO_DATA.transactions);
    setFixedCosts(DEMO_DATA.fixedCosts);
    setAllocationSettings(DEMO_DATA.allocationSettings);
    setSavingsGoals(DEMO_DATA.savingsGoals);
    setTaxSettings(DEMO_DATA.taxSettings);
    addToast('โหลดข้อมูลตัวอย่าง (Demo Data) สำเร็จแล้ว!', 'success');
  };

  const clearAllData = () => {
    setTransactions([]);
    setFixedCosts([]);
    setSavingsGoals([]);
    setAllocationSettings({
      rule: '50-30-20',
      monthlyIncome: 0,
      buckets: { needs: 50, wants: 30, savings: 20 }
    });
    setTaxSettings({
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
    addToast('ล้างข้อมูลทั้งหมดในระบบเรียบร้อยแล้ว', 'info');
  };

  return (
    <WalletContext.Provider
      value={{
        activeTab,
        setActiveTab,
        isAddTxOpen,
        setIsAddTxOpen,
        isAddFixedCostOpen,
        setIsAddFixedCostOpen,
        isAddGoalOpen,
        setIsAddGoalOpen,
        quickDepositGoal,
        setQuickDepositGoal,
        toasts,
        addToast,
        removeToast,
        transactions,
        fixedCosts,
        allocationSettings,
        savingsGoals,
        taxSettings,
        addTransaction,
        deleteTransaction,
        addFixedCost,
        toggleFixedCostPaid,
        deleteFixedCost,
        resetFixedCostsMonthly,
        updateAllocationSettings,
        addSavingsGoal,
        depositToSavingsGoal,
        deleteSavingsGoal,
        updateTaxSettings,
        resetTaxSettings,
        exportBackupJSON,
        importBackupJSON,
        exportTransactionsCSV,
        resetToDemo,
        clearAllData
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
