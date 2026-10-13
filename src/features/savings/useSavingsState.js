import { useState, useEffect } from 'react';
import { loadSavingsGoals, saveSavingsGoals } from './savingsStorage';
import { savingsApi, accountsApi, getStoredToken } from '../../shared/api';

// บัญชีต้นทางสำหรับฝากเงินออม: ใช้บัญชีที่ active บัญชีแรก โดยเลือกเงินสด/ธนาคารก่อน
// (ผู้ใช้ใหม่ได้บัญชี "เงินสด (Cash)" จาก BE อัตโนมัติ)
const getDefaultAccountId = async () => {
  const accounts = await accountsApi.getAll();
  const active = (Array.isArray(accounts) ? accounts : []).filter(a => a.isActive !== false);
  const preferred =
    active.find(a => a.accountType === 'cash') || active.find(a => a.accountType === 'bank') || active[0];
  return preferred?.id || null;
};

export const useSavingsState = ({ addToast, addTransaction, reloadTransactions, userId } = {}) => {
  const token = getStoredToken();
  const [savingsGoals, setSavingsGoals] = useState(() => (token ? [] : loadSavingsGoals()));
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [quickDepositGoal, setQuickDepositGoal] = useState(null);
  const [isLoadingSavings, setIsLoadingSavings] = useState(false);

  // Sync to local storage
  useEffect(() => {
    saveSavingsGoals(savingsGoals);
  }, [savingsGoals]);

  // Load from backend API if authenticated and re-fetch when userId changes
  useEffect(() => {
    const currentToken = getStoredToken();
    if (!currentToken || !userId) {
      if (!currentToken) {
        setSavingsGoals(loadSavingsGoals());
      }
      return;
    }

    let isMounted = true;
    const fetchApiSavings = async () => {
      try {
        setIsLoadingSavings(true);
        const res = await savingsApi.getAll();
        if (isMounted && Array.isArray(res)) {
          const mapped = res.map(dto => ({
            id: dto.id,
            title: dto.title,
            category: dto.category || 'ทั่วไป',
            targetAmount: Number(dto.targetAmount) || 0,
            currentAmount: Number(dto.currentAmount) || 0,
            monthlyContribution: Number(dto.monthlyContribution) || 0,
            expectedReturnRate: Number(dto.expectedReturnRate) || 0,
            color: dto.color || (dto.category === 'การลงทุน' ? 'blue' : dto.category === 'ความมั่นคง' ? 'emerald' : 'purple'),
            isCompleted: !!dto.isCompleted
          }));
          setSavingsGoals(mapped);
        }
      } catch (err) {
        console.warn('Failed to fetch savings goals from API, using local:', err);
      } finally {
        if (isMounted) setIsLoadingSavings(false);
      }
    };

    fetchApiSavings();
    return () => {
      isMounted = false;
    };
  }, [userId]);

  const addSavingsGoal = async (goal) => {
    const newGoal = {
      ...goal,
      id: goal.id || `goal-${Date.now()}`,
      targetAmount: Number(goal.targetAmount) || 0,
      currentAmount: Number(goal.currentAmount) || 0,
      monthlyContribution: Number(goal.monthlyContribution) || 0,
      expectedReturnRate: Number(goal.expectedReturnRate) || 0,
      color:
        goal.color ||
        (goal.category === 'การลงทุน' ? 'blue' : goal.category === 'ความมั่นคง' ? 'emerald' : 'purple')
    };

    setSavingsGoals(prev => [...prev, newGoal]);

    const token = getStoredToken();
    if (token) {
      try {
        const created = await savingsApi.create({
          title: newGoal.title,
          targetAmount: newGoal.targetAmount,
          category: newGoal.category,
          initialAmount: newGoal.currentAmount,
          monthlyContribution: newGoal.monthlyContribution,
          expectedReturnRate: newGoal.expectedReturnRate,
          color: newGoal.color
        });

        if (created?.id) {
          setSavingsGoals(prev =>
            prev.map(g => (g.id === newGoal.id ? { ...g, id: created.id } : g))
          );
        }
      } catch (err) {
        console.warn('Failed to sync new savings goal to BE:', err);
      }
    }

    if (addToast) {
      addToast(`สร้างเป้าหมาย "${newGoal.title}" เรียบร้อยแล้ว`, 'success');
    }
  };

  const depositToSavingsGoal = async (goalId, amount, goalTitle = 'เป้าหมาย') => {
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

    const recordLocalTransaction = () => {
      if (!addTransaction) return;
      const dateStr = new Date().toISOString().slice(0, 10);
      addTransaction({
        date: dateStr,
        type: 'savings',
        category: `ออมเข้า: ${goalTitle}`,
        amount: depositAmount,
        paymentMethod: 'โอนผ่านธนาคาร',
        note: `ฝากเงินเพิ่มเข้าเป้าหมาย ${goalTitle}`
      });
    };

    const token = getStoredToken();
    const isBackendGoal =
      token && goalId && typeof goalId === 'string' && goalId.includes('-') && !goalId.startsWith('goal-');

    if (!isBackendGoal) {
      // โหมด offline/local: บันทึกธุรกรรมในเครื่องเอง
      recordLocalTransaction();
    } else {
      try {
        // BE หักเงินจากบัญชีต้นทางและสร้างธุรกรรม type "savings" ให้เอง จึงไม่ต้อง addTransaction ซ้ำ
        const accountId = await getDefaultAccountId();
        if (!accountId) {
          throw new Error('ไม่พบบัญชีเงินสด/ธนาคารสำหรับตัดเงินออม');
        }
        await savingsApi.deposit(goalId, {
          amount: depositAmount,
          accountId,
          note: `ฝากเงินเข้า ${goalTitle}`
        });
        if (reloadTransactions) await reloadTransactions();
      } catch (err) {
        console.warn('Failed to sync savings deposit to BE:', err);
        // ย้อนยอดที่เพิ่มไว้ล่วงหน้า เพื่อไม่ให้หน้าจอแสดงยอดที่ไม่ได้บันทึกจริง
        setSavingsGoals(prev =>
          prev.map(g =>
            g.id === goalId ? { ...g, currentAmount: (Number(g.currentAmount) || 0) - depositAmount } : g
          )
        );
        if (addToast) addToast(err?.message || 'ฝากเงินเข้าเป้าหมายไม่สำเร็จ กรุณาลองใหม่', 'danger');
        return;
      }
    }

    if (addToast) {
      addToast(
        `ฝากเงิน ${depositAmount.toLocaleString()} ฿ เข้าเป้าหมาย "${goalTitle}" เรียบร้อยแล้ว`,
        'success'
      );
    }
  };

  const deleteSavingsGoal = async (id) => {
    setSavingsGoals(prev => prev.filter(g => g.id !== id));

    const token = getStoredToken();
    if (token && id && typeof id === 'string' && id.includes('-') && !id.startsWith('goal-')) {
      try {
        await savingsApi.delete(id);
      } catch (err) {
        console.warn('Failed to delete savings goal from BE:', err);
      }
    }

    if (addToast) {
      addToast('ลบเป้าหมายการออมเรียบร้อยแล้ว', 'info');
    }
  };

  return {
    savingsGoals,
    setSavingsGoals,
    isAddGoalOpen,
    setIsAddGoalOpen,
    quickDepositGoal,
    setQuickDepositGoal,
    isLoadingSavings,
    addSavingsGoal,
    depositToSavingsGoal,
    deleteSavingsGoal
  };
};
