import { useState, useEffect } from 'react';
import {
  loadDebts,
  saveDebts,
  loadBudgetProfile,
  saveBudgetProfile,
  buildPrefillProfile,
  DEFAULT_BUDGET_PROFILE
} from './debtStorage';
import { debtsApi, getStoredToken } from '../../shared/api';

// BE เก็บ type / minPaymentMode เป็นตัวพิมพ์เล็ก แต่ FE ใช้ camelCase ในการเปรียบเทียบ
const DEBT_TYPE_FROM_API = { amortizing: 'amortizing', hirepurchase: 'hirePurchase', installment: 'installment' };
const MIN_MODE_FROM_API = { none: 'none', fixed: 'fixed', percentofbalance: 'percentOfBalance' };

const toNumberOrNull = (value) => (value === null || value === undefined || value === '' ? null : Number(value));

const fromApiDebt = (dto) => ({
  id: dto.id,
  name: dto.name,
  type: DEBT_TYPE_FROM_API[String(dto.type).toLowerCase()] || dto.type,
  principal: Number(dto.principal) || 0,
  accruedInterest: Number(dto.accruedInterest) || 0,
  annualRatePct: Number(dto.annualRatePct) || 0,
  frequency: dto.frequency || 'monthly',
  annualDueMonth: dto.annualDueMonth ?? null,
  acceptsEarlyPayment: dto.acceptsEarlyPayment !== false,
  minimumPayment: {
    mode: MIN_MODE_FROM_API[String(dto.minPaymentMode).toLowerCase()] || 'none',
    amount: Number(dto.minPaymentAmount) || 0,
    percent: dto.minPaymentPercent ?? 8,
    floor: dto.minPaymentFloor ?? 500
  },
  monthlyPayment: Number(dto.monthlyPayment) || 0,
  periodsPaid: dto.periodsPaid || 0,
  periodsTotal: dto.periodsTotal || 12,
  settlementQuote: toNumberOrNull(dto.settlementQuote),
  settlementQuoteDate: dto.settlementQuoteDate || null,
  isClosed: !!dto.isClosed
});

// ส่งครบทุก field: BE ตั้งค่า field ที่ไม่ได้ส่งเป็นค่า default (ทับข้อมูลเดิมตอน update)
const toApiDebt = (debt) => {
  const min = debt.minimumPayment || {};
  return {
    name: debt.name,
    type: debt.type,
    principal: Number(debt.principal) || 0,
    accruedInterest: Number(debt.accruedInterest) || 0,
    annualRatePct: Number(debt.annualRatePct) || 0,
    frequency: debt.frequency || 'monthly',
    annualDueMonth: toNumberOrNull(debt.annualDueMonth),
    acceptsEarlyPayment: debt.acceptsEarlyPayment !== false,
    minPaymentMode: min.mode || 'none',
    minPaymentAmount: toNumberOrNull(min.amount),
    minPaymentPercent: toNumberOrNull(min.percent),
    minPaymentFloor: toNumberOrNull(min.floor),
    monthlyPayment: Number(debt.monthlyPayment) || 0,
    periodsPaid: Number(debt.periodsPaid) || 0,
    periodsTotal: Number(debt.periodsTotal) || 12,
    settlementQuote: toNumberOrNull(debt.settlementQuote),
    // BE รับ DateOnly รูปแบบ YYYY-MM-DD
    settlementQuoteDate: debt.settlementQuoteDate ? String(debt.settlementQuoteDate).slice(0, 10) : null
  };
};

const parseManualOrder = (json, fallback = []) => {
  if (!json) return fallback;
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

/**
 * Debt planner state with .NET Backend sync
 */
export const useDebtState = ({
  addToast,
  allocationSettings,
  fixedCosts,
  savingsGoals,
  transactions,
  userId
}) => {
  const token = getStoredToken();
  const [debts, setDebts] = useState(() => (token ? [] : loadDebts()));

  // Logged-in users get their profile from the API; never prefill it from
  // whatever happens to be in local state on first render.
  const [budgetProfile, setBudgetProfile] = useState(() =>
    token
      ? loadBudgetProfile() || DEFAULT_BUDGET_PROFILE
      : loadBudgetProfile() ||
        buildPrefillProfile({ allocationSettings, fixedCosts, savingsGoals, transactions })
  );

  const [isAddDebtOpen, setIsAddDebtOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState(null);
  const [debtDraft, setDebtDraft] = useState(null);
  const [isLoadingDebts, setIsLoadingDebts] = useState(false);

  useEffect(() => {
    saveDebts(debts);
  }, [debts]);

  useEffect(() => {
    saveBudgetProfile(budgetProfile);
  }, [budgetProfile]);

  // Load debts & profile from Backend API if authenticated and re-fetch when userId changes
  useEffect(() => {
    const currentToken = getStoredToken();
    if (!currentToken || !userId) {
      if (!currentToken) {
        setDebts(loadDebts());
      }
      return;
    }

    let isMounted = true;
    const fetchApiDebts = async () => {
      try {
        setIsLoadingDebts(true);
        // BE คืนเฉพาะหนี้ที่ยังไม่ปิดเป็นค่าเริ่มต้น จึงดึงทั้งสองกลุ่ม
        const [openDebts, closedDebts, apiProfile] = await Promise.allSettled([
          debtsApi.getAll(false),
          debtsApi.getAll(true),
          debtsApi.getProfile()
        ]);

        if (isMounted && openDebts.status === 'fulfilled' && Array.isArray(openDebts.value)) {
          const closed = closedDebts.status === 'fulfilled' && Array.isArray(closedDebts.value) ? closedDebts.value : [];
          setDebts([...openDebts.value, ...closed].map(fromApiDebt));
        }

        if (isMounted && apiProfile.status === 'fulfilled' && apiProfile.value) {
          const p = apiProfile.value;
          // Server values win, including 0. Only the schedule overrides are
          // local-only, so they are the only fields kept from prev.
          setBudgetProfile(prev => ({
            ...DEFAULT_BUDGET_PROFILE,
            emergencyContributionOverrides: prev.emergencyContributionOverrides || [],
            bufferOverrides: prev.bufferOverrides || [],
            netMonthlyIncome: Number(p.netMonthlyIncome) || 0,
            fixedExpenses: Number(p.fixedExpenses) || 0,
            discretionaryBudget: Number(p.discretionaryBudget) || 0,
            extraIncome: Number(p.extraIncome) || 0,
            emergencyFundCurrent: Number(p.emergencyFundCurrent) || 0,
            emergencyFundTarget: Number(p.emergencyFundTarget) || 0,
            emergencyMonthlyContribution: Number(p.emergencyMonthlyContribution) || 0,
            shortTermBuffer: Number(p.shortTermBuffer) || 0,
            strategy: p.strategy || prev.strategy,
            manualOrder: parseManualOrder(p.manualOrderJson, prev.manualOrder)
          }));
        }
      } catch (err) {
        console.warn('Failed to fetch debts from API, using local:', err);
      } finally {
        if (isMounted) setIsLoadingDebts(false);
      }
    };

    fetchApiDebts();
    return () => {
      isMounted = false;
    };
  }, [userId]);

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

  const saveDebt = async (debt) => {
    const token = getStoredToken();

    if (debt.id && debts.some(d => d.id === debt.id)) {
      setDebts(prev => prev.map(d => (d.id === debt.id ? debt : d)));

      if (token && typeof debt.id === 'string' && debt.id.includes('-') && !debt.id.startsWith('debt-')) {
        try {
          await debtsApi.update(debt.id, { ...toApiDebt(debt), isClosed: !!debt.isClosed });
        } catch (err) {
          console.warn('Failed to update debt in BE:', err);
        }
      }

      if (addToast) addToast(`แก้ไขหนี้ "${debt.name}" เรียบร้อยแล้ว`, 'success');
    } else {
      const created = { ...debt, id: debt.id || `debt-${Date.now()}`, isClosed: false };
      setDebts(prev => [...prev, created]);

      if (token) {
        try {
          const res = await debtsApi.create(toApiDebt(created));
          if (res?.id) {
            setDebts(prev => prev.map(d => (d.id === created.id ? { ...d, id: res.id } : d)));
          }
        } catch (err) {
          console.warn('Failed to create debt in BE:', err);
        }
      }

      if (addToast) addToast(`เพิ่มหนี้ "${created.name}" เข้าแผนปลอดหนี้เรียบร้อยแล้ว`, 'success');
    }
    closeAddDebt();
  };

  const deleteDebt = async (id) => {
    setDebts(prev => prev.filter(d => d.id !== id));

    const token = getStoredToken();
    if (token && id && typeof id === 'string' && id.includes('-') && !id.startsWith('debt-')) {
      try {
        await debtsApi.delete(id);
      } catch (err) {
        console.warn('Failed to delete debt from BE:', err);
      }
    }

    if (addToast) addToast('ลบรายการหนี้เรียบร้อยแล้ว', 'info');
  };

  const updateBudgetProfile = async (patch) => {
    const updated = { ...budgetProfile, ...patch };
    setBudgetProfile(updated);

    const token = getStoredToken();
    if (token) {
      try {
        // ส่งครบทุก field: BE ตั้งค่าที่ไม่ได้ส่งเป็น 0 (ทับข้อมูลเดิม)
        await debtsApi.updateProfile({
          netMonthlyIncome: Number(updated.netMonthlyIncome) || 0,
          fixedExpenses: Number(updated.fixedExpenses) || 0,
          discretionaryBudget: Number(updated.discretionaryBudget) || 0,
          extraIncome: Number(updated.extraIncome) || 0,
          emergencyFundCurrent: Number(updated.emergencyFundCurrent) || 0,
          emergencyFundTarget: Number(updated.emergencyFundTarget) || 0,
          emergencyMonthlyContribution: Number(updated.emergencyMonthlyContribution) || 0,
          shortTermBuffer: Number(updated.shortTermBuffer) || 0,
          strategy: updated.strategy || 'avalanche',
          manualOrderJson: JSON.stringify(updated.manualOrder || [])
        });
      } catch (err) {
        console.warn('Failed to update debt budget profile in BE:', err);
      }
    }
  };

  return {
    debts,
    budgetProfile,
    isAddDebtOpen,
    editingDebt,
    debtDraft,
    isLoadingDebts,
    openAddDebt,
    closeAddDebt,
    saveDebt,
    deleteDebt,
    updateBudgetProfile,
    setDebts,
    setBudgetProfile
  };
};
