import { useState, useEffect } from 'react';
import { loadFixedCosts, saveFixedCosts } from './fixedCostsStorage';
import { fixedCostsApi, getStoredToken } from '../../shared/api';

export const useFixedCostsState = ({ addToast, categories = [], userId } = {}) => {
  const token = getStoredToken();
  const [fixedCosts, setFixedCosts] = useState(() => (token ? [] : loadFixedCosts()));
  const [isAddFixedCostOpen, setIsAddFixedCostOpen] = useState(false);
  const [isLoadingFixedCosts, setIsLoadingFixedCosts] = useState(false);

  // Sync to local storage
  useEffect(() => {
    saveFixedCosts(fixedCosts);
  }, [fixedCosts]);

  // Load from backend API if authenticated and re-fetch when userId changes
  useEffect(() => {
    const currentToken = getStoredToken();
    if (!currentToken || !userId) {
      if (!currentToken) {
        setFixedCosts(loadFixedCosts());
      }
      return;
    }

    let isMounted = true;
    const fetchApiFixedCosts = async () => {
      try {
        setIsLoadingFixedCosts(true);
        const res = await fixedCostsApi.getAll();
        if (isMounted && Array.isArray(res)) {
          const mapped = res.map(dto => ({
            id: dto.id,
            title: dto.title,
            amount: Number(dto.amount) || 0,
            dueDay: dto.dueDay || 1,
            isPaid: !!dto.isPaid,
            category: dto.categoryName || 'ค่าใช้จ่ายคงที่',
            categoryId: dto.categoryId,
            autoDeduct: !!dto.autoDeduct
          }));
          setFixedCosts(mapped);
        }
      } catch (err) {
        console.warn('Failed to fetch fixed costs from API, using local:', err);
      } finally {
        if (isMounted) setIsLoadingFixedCosts(false);
      }
    };

    fetchApiFixedCosts();
    return () => {
      isMounted = false;
    };
  }, [userId]);

  const addFixedCost = async (cost) => {
    const newCost = {
      ...cost,
      id: cost.id || `fc-${Date.now()}`,
      amount: Number(cost.amount) || 0,
      dueDay: Number(cost.dueDay) || 1,
      isPaid: cost.isPaid || false
    };

    setFixedCosts(prev => [...prev, newCost]);

    const token = getStoredToken();
    if (token) {
      try {
        let categoryId = cost.categoryId;
        if (!categoryId && categories.length > 0) {
          const match = categories.find(
            c => c.type === 'fixed' || c.name.toLowerCase().includes('ผ่อน') || c.name.toLowerCase().includes('ค่าใช้จ่าย')
          );
          categoryId = match?.id || categories[0]?.id;
        }

        if (categoryId) {
          const created = await fixedCostsApi.create({
            title: newCost.title,
            amount: newCost.amount,
            dueDay: newCost.dueDay,
            categoryId,
            autoDeduct: false,
            note: ''
          });

          if (created?.id) {
            setFixedCosts(prev =>
              prev.map(fc => (fc.id === newCost.id ? { ...fc, id: created.id } : fc))
            );
          }
        }
      } catch (err) {
        console.warn('Failed to sync new fixed cost to BE:', err);
      }
    }

    if (addToast) {
      addToast(
        `เพิ่มฟิกคอส "${newCost.title}" จำนวน ${newCost.amount.toLocaleString()} ฿ เรียบร้อยแล้ว`,
        'success'
      );
    }
  };

  const toggleFixedCostPaid = async (id) => {
    let targetPaid = false;
    let targetTitle = '';

    setFixedCosts(prev =>
      prev.map(fc => {
        if (fc.id === id) {
          targetPaid = !fc.isPaid;
          targetTitle = fc.title;
          return { ...fc, isPaid: targetPaid };
        }
        return fc;
      })
    );

    const token = getStoredToken();
    if (token && id && typeof id === 'string' && id.includes('-') && !id.startsWith('fc-')) {
      try {
        if (targetPaid) {
          await fixedCostsApi.pay(id);
        } else {
          await fixedCostsApi.unpay(id);
        }
      } catch (err) {
        console.warn('Failed to toggle fixed cost paid status in BE:', err);
      }
    }

    if (addToast) {
      addToast(
        targetPaid
          ? `ทำเครื่องหมาย "${targetTitle}" ชำระแล้ว`
          : `ยกเลิกสถานะชำระ "${targetTitle}"`,
        'info'
      );
    }
  };

  const deleteFixedCost = async (id) => {
    setFixedCosts(prev => prev.filter(fc => fc.id !== id));

    const token = getStoredToken();
    if (token && id && typeof id === 'string' && id.includes('-') && !id.startsWith('fc-')) {
      try {
        await fixedCostsApi.delete(id);
      } catch (err) {
        console.warn('Failed to delete fixed cost from BE:', err);
      }
    }

    if (addToast) {
      addToast('ลบรายการฟิกคอสเรียบร้อยแล้ว', 'info');
    }
  };

  const resetFixedCostsMonthly = async () => {
    setFixedCosts(prev => prev.map(fc => ({ ...fc, isPaid: false })));

    const token = getStoredToken();
    if (token) {
      try {
        await fixedCostsApi.resetMonthly();
      } catch (err) {
        console.warn('Failed to reset monthly fixed costs in BE:', err);
      }
    }

    if (addToast) {
      addToast('รีเซ็ตสถานะรอบเดือนใหม่เป็น "รอชำระ" ทั้งหมดแล้ว', 'success');
    }
  };

  return {
    fixedCosts,
    setFixedCosts,
    isAddFixedCostOpen,
    setIsAddFixedCostOpen,
    isLoadingFixedCosts,
    addFixedCost,
    toggleFixedCostPaid,
    deleteFixedCost,
    resetFixedCostsMonthly
  };
};
