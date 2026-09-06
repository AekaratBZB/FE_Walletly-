import { useState, useEffect } from 'react';
import {
  loadDebts,
  saveDebts,
  loadBudgetProfile,
  saveBudgetProfile,
  buildPrefillProfile
} from './debtStorage';

/**
 * Debt planner state. Lives here rather than inline in WalletContext so the
 * context file does not keep growing — it already carries five other feature
 * slices.
 */
export const useDebtState = ({
  addToast,
  allocationSettings,
  fixedCosts,
  savingsGoals,
  transactions
}) => {
  const [debts, setDebts] = useState(() => loadDebts());

  const [budgetProfile, setBudgetProfile] = useState(
    () =>
      loadBudgetProfile() ||
      buildPrefillProfile({ allocationSettings, fixedCosts, savingsGoals, transactions })
  );

  const [isAddDebtOpen, setIsAddDebtOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState(null);
  const [debtDraft, setDebtDraft] = useState(null);

  useEffect(() => {
    saveDebts(debts);
  }, [debts]);

  useEffect(() => {
    saveBudgetProfile(budgetProfile);
  }, [budgetProfile]);

  /**
   * Open the add/edit modal.
   * @param {Object|null} debt   an existing debt to edit, or null to add
   * @param {Object|null} draft  partial fields to prefill a new debt with
   */
  const openAddDebt = (debt = null, draft = null) => {
    setEditingDebt(debt);
    setDebtDraft(draft);
    setIsAddDebtOpen(true);
  };

  const closeAddDebt = () => {
    setIsAddDebtOpen(false);
    setEditingDebt(null);
    setDebtDraft(null);
  };

  const saveDebt = (debt) => {
    if (debt.id && debts.some((d) => d.id === debt.id)) {
      setDebts((prev) => prev.map((d) => (d.id === debt.id ? { ...d, ...debt } : d)));
      addToast(`แก้ไขหนี้ "${debt.name}" เรียบร้อยแล้ว`, 'success');
    } else {
      const created = { ...debt, id: debt.id || `debt-${Date.now()}`, isClosed: false };
      setDebts((prev) => [...prev, created]);
      addToast(`เพิ่มหนี้ "${created.name}" เข้าแผนปลอดหนี้เรียบร้อยแล้ว`, 'success');
    }
    closeAddDebt();
  };

  const deleteDebt = (id) => {
    setDebts((prev) => prev.filter((d) => d.id !== id));
    addToast('ลบรายการหนี้เรียบร้อยแล้ว', 'info');
  };

  const updateBudgetProfile = (patch) => {
    setBudgetProfile((prev) => ({ ...prev, ...patch }));
  };

  return {
    debts,
    budgetProfile,
    isAddDebtOpen,
    editingDebt,
    debtDraft,
    openAddDebt,
    closeAddDebt,
    saveDebt,
    deleteDebt,
    updateBudgetProfile,
    setDebts,
    setBudgetProfile
  };
};
