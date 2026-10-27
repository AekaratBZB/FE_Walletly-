import { useState, useEffect } from 'react';
import { loadFixedCosts, saveFixedCosts } from './fixedCostsStorage';
import { fixedCostsApi, getStoredToken } from '../../shared/api';
import { getCurrentMonthPrefix } from '../../shared/formatters';
import { toApiMonth, toMonthKey } from './fixedCostPeriod';

// id ที่ BE สร้าง (GUID) ไม่ใช่ id ชั่วคราวฝั่ง FE ('fc-...')
const isSyncedId = (id) => typeof id === 'string' && id.includes('-') && !id.startsWith('fc-');

export const useFixedCostsState = ({ addToast, categories = [], userId, onSynced } = {}) => {
  const token = getStoredToken();
  const [fixedCosts, setFixedCosts] = useState(() => (token ? [] : loadFixedCosts()));
  const [isAddFixedCostOpen, setIsAddFixedCostOpen] = useState(false);
  // รายการที่กำลังแก้ไขใน AddFixedCostModal (null = เพิ่มใหม่)
  const [editingFixedCost, setEditingFixedCost] = useState(null);
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
            autoDeduct: !!dto.autoDeduct,
            note: dto.note || '',
            linkedDebtId: dto.linkedDebtId || null,
            startMonth: toMonthKey(dto.startMonth),
            endMonth: toMonthKey(dto.endMonth),
            excludedMonths: (dto.excludedMonths || []).map(toMonthKey)
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
      isPaid: cost.isPaid || false,
      startMonth: cost.startMonth || null,
      endMonth: cost.endMonth || null,
      excludedMonths: []
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
            autoDeduct: !!newCost.autoDeduct,
            note: newCost.note || '',
            startMonth: toApiMonth(newCost.startMonth),
            endMonth: toApiMonth(newCost.endMonth)
          });

          onSynced?.();
          if (created?.id) {
            setFixedCosts(prev =>
              prev.map(fc =>
                fc.id === newCost.id
                  ? { ...fc, id: created.id, categoryId: created.categoryId, category: created.categoryName || fc.category }
                  : fc
              )
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

  const updateFixedCost = async (id, changes) => {
    const current = fixedCosts.find(fc => fc.id === id);
    if (!current) return;

    const updated = {
      ...current,
      ...changes,
      amount: Number(changes.amount ?? current.amount) || 0,
      dueDay: Number(changes.dueDay ?? current.dueDay) || 1,
      startMonth: changes.startMonth ?? current.startMonth ?? null,
      endMonth: 'endMonth' in changes ? changes.endMonth : current.endMonth ?? null
    };

    setFixedCosts(prev => prev.map(fc => (fc.id === id ? updated : fc)));

    if (getStoredToken() && isSyncedId(id)) {
      try {
        const saved = await fixedCostsApi.update(id, {
          categoryId: updated.categoryId,
          title: updated.title,
          amount: updated.amount,
          dueDay: updated.dueDay,
          autoDeduct: !!updated.autoDeduct,
          isActive: true,
          linkedDebtId: updated.linkedDebtId || null,
          note: updated.note || '',
          startMonth: toApiMonth(updated.startMonth),
          endMonth: toApiMonth(updated.endMonth)
        });
        onSynced?.();
        if (saved?.categoryName) {
          setFixedCosts(prev => prev.map(fc => (fc.id === id ? { ...fc, category: saved.categoryName } : fc)));
        }
      } catch (err) {
        console.warn('Failed to sync fixed cost update to BE:', err);
        // คืนค่าเดิม ไม่ให้หน้าจอแสดงข้อมูลที่ BE ไม่ได้บันทึก
        setFixedCosts(prev => prev.map(fc => (fc.id === id ? current : fc)));
        if (addToast) addToast(`แก้ไข "${current.title}" ไม่สำเร็จ`, 'danger');
        return;
      }
    }

    if (addToast) addToast(`แก้ไขฟิกคอส "${updated.title}" เรียบร้อยแล้ว`, 'success');
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
        onSynced?.();
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

  // ติ๊กเลือก/เอาออกจากรายจ่ายของเดือน (ทีละรายการหรือเลือกทั้งหมด) ค่าเริ่มต้นนับทุกเดือน
  const setFixedCostsIncluded = async (ids, included, monthKey = getCurrentMonthPrefix()) => {
    const idSet = new Set(ids);
    if (idSet.size === 0) return;

    setFixedCosts(prev =>
      prev.map(fc => {
        if (!idSet.has(fc.id)) return fc;
        const others = (fc.excludedMonths || []).filter(m => m !== monthKey);
        return { ...fc, excludedMonths: included ? others : [...others, monthKey] };
      })
    );

    const syncedIds = ids.filter(isSyncedId);
    if (getStoredToken() && syncedIds.length > 0) {
      try {
        await fixedCostsApi.setInclusion({
          periodMonth: toApiMonth(monthKey),
          fixedCostIds: syncedIds,
          included
        });
        onSynced?.();
      } catch (err) {
        console.warn('Failed to sync fixed cost inclusion to BE:', err);
        if (addToast) addToast('บันทึกการเลือกฟิกคอสไปยังเซิร์ฟเวอร์ไม่สำเร็จ', 'danger');
      }
    }
  };

  const deleteFixedCost = async (id) => {
    setFixedCosts(prev => prev.filter(fc => fc.id !== id));

    const token = getStoredToken();
    if (token && id && typeof id === 'string' && id.includes('-') && !id.startsWith('fc-')) {
      try {
        await fixedCostsApi.delete(id);
        onSynced?.();
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
        onSynced?.();
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
    editingFixedCost,
    setEditingFixedCost,
    isLoadingFixedCosts,
    addFixedCost,
    updateFixedCost,
    toggleFixedCostPaid,
    setFixedCostsIncluded,
    deleteFixedCost,
    resetFixedCostsMonthly
  };
};
