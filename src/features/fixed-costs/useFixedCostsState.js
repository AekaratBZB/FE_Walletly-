import { useState, useEffect } from 'react';
import { loadFixedCosts, saveFixedCosts } from './fixedCostsStorage';

export const useFixedCostsState = ({ addToast } = {}) => {
  const [fixedCosts, setFixedCosts] = useState(() => loadFixedCosts());
  const [isAddFixedCostOpen, setIsAddFixedCostOpen] = useState(false);

  useEffect(() => {
    saveFixedCosts(fixedCosts);
  }, [fixedCosts]);

  const addFixedCost = (cost) => {
    const newCost = {
      ...cost,
      id: cost.id || `fc-${Date.now()}`,
      amount: Number(cost.amount) || 0,
      dueDay: Number(cost.dueDay) || 1,
      isPaid: cost.isPaid || false
    };
    setFixedCosts(prev => [...prev, newCost]);
    if (addToast) {
      addToast(`เพิ่มฟิกคอส "${newCost.title}" จำนวน ${newCost.amount.toLocaleString()} ฿ เรียบร้อยแล้ว`, 'success');
    }
  };

  const toggleFixedCostPaid = (id) => {
    setFixedCosts(prev =>
      prev.map(fc => {
        if (fc.id === id) {
          const nextPaid = !fc.isPaid;
          if (addToast) {
            addToast(nextPaid ? `ทำเครื่องหมาย "${fc.title}" ชำระแล้ว` : `ยกเลิกสถานะชำระ "${fc.title}"`, 'info');
          }
          return { ...fc, isPaid: nextPaid };
        }
        return fc;
      })
    );
  };

  const deleteFixedCost = (id) => {
    setFixedCosts(prev => prev.filter(fc => fc.id !== id));
    if (addToast) {
      addToast('ลบรายการฟิกคอสเรียบร้อยแล้ว', 'info');
    }
  };

  const resetFixedCostsMonthly = () => {
    setFixedCosts(prev => prev.map(fc => ({ ...fc, isPaid: false })));
    if (addToast) {
      addToast('รีเซ็ตสถานะรอบเดือนใหม่เป็น "รอชำระ" ทั้งหมดแล้ว', 'success');
    }
  };

  return {
    fixedCosts,
    setFixedCosts,
    isAddFixedCostOpen,
    setIsAddFixedCostOpen,
    addFixedCost,
    toggleFixedCostPaid,
    deleteFixedCost,
    resetFixedCostsMonthly
  };
};
