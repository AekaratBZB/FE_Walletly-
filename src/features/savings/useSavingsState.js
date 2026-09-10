import { useState, useEffect } from 'react';
import { loadSavingsGoals, saveSavingsGoals } from './savingsStorage';

export const useSavingsState = ({ addToast, addTransaction } = {}) => {
  const [savingsGoals, setSavingsGoals] = useState(() => loadSavingsGoals());
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [quickDepositGoal, setQuickDepositGoal] = useState(null);

  useEffect(() => {
    saveSavingsGoals(savingsGoals);
  }, [savingsGoals]);

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
    if (addToast) {
      addToast(`สร้างเป้าหมาย "${newGoal.title}" เรียบร้อยแล้ว`, 'success');
    }
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

    // Record corresponding transaction
    if (addTransaction) {
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
    }

    if (addToast) {
      addToast(`ฝากเงิน ${depositAmount.toLocaleString()} ฿ เข้าเป้าหมาย "${goalTitle}" เรียบร้อยแล้ว`, 'success');
    }
  };

  const deleteSavingsGoal = (id) => {
    setSavingsGoals(prev => prev.filter(g => g.id !== id));
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
    addSavingsGoal,
    depositToSavingsGoal,
    deleteSavingsGoal
  };
};
