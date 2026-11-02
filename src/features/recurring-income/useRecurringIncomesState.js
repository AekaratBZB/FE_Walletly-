import { useState, useEffect, useCallback } from 'react';
import { recurringIncomesApi, getStoredToken } from '../../shared/api';
import { toMonthKey } from '../fixed-costs/fixedCostPeriod';

const mapDto = (dto) => ({
  id: dto.id,
  title: dto.title,
  amount: Number(dto.amount) || 0,
  payDay: dto.payDay || 1,
  categoryId: dto.categoryId,
  category: dto.categoryName || '',
  startMonth: toMonthKey(dto.startMonth),
  endMonth: toMonthKey(dto.endMonth),
  isActive: dto.isActive !== false,
  note: dto.note || '',
  excludedMonths: (dto.excludedMonths || []).map(toMonthKey)
});

// state ของรายรับประจำอยู่ในแท็บนี้เอง (ไม่ผ่าน WalletContext); onSynced ให้รายการ/สรุปยอดโหลดใหม่หลังบันทึก
export const useRecurringIncomesState = ({ userId, reloadTransactions, addToast } = {}) => {
  const hasToken = !!getStoredToken();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(hasToken);

  const load = useCallback(async () => {
    if (!getStoredToken() || !userId) {
      setItems([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await recurringIncomesApi.getAll();
      if (Array.isArray(res)) setItems(res.map(mapDto));
    } catch (err) {
      console.warn('Failed to fetch recurring incomes:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (action, okMsg, failMsg) => {
    try {
      await action();
      // BE สร้างรายการจริงตอนอ่าน จึงต้องโหลดรายการใหม่ (เรียก onSynced ในตัว)
      await reloadTransactions?.();
      await load();
      if (okMsg) addToast?.(okMsg, 'success');
      return true;
    } catch (err) {
      console.warn(failMsg, err);
      addToast?.(failMsg, 'danger');
      return false;
    }
  };

  const create = (data) =>
    run(() => recurringIncomesApi.create(data), `เพิ่มรายรับประจำ "${data.title}" เรียบร้อยแล้ว`, 'เพิ่มรายรับประจำไม่สำเร็จ');
  const update = (id, data) =>
    run(() => recurringIncomesApi.update(id, data), `แก้ไขรายรับประจำ "${data.title}" เรียบร้อยแล้ว`, 'แก้ไขรายรับประจำไม่สำเร็จ');
  const remove = (id) =>
    run(() => recurringIncomesApi.delete(id), 'ลบรายรับประจำเรียบร้อยแล้ว', 'ลบรายรับประจำไม่สำเร็จ');

  return { items, isLoading, hasToken, create, update, remove };
};
