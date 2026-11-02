import React, { useEffect, useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import { Modal } from '../../components/Modal';
import { ThaiMonthPicker } from '../../components/ThaiDatePicker';
import { FIXED_COST_CATEGORIES } from '../../shared/constants';
import { formatMonthKey, getCurrentMonthPrefix } from '../../shared/formatters';
import { addMonths, getDurationMonths } from './fixedCostPeriod';

// ใช้ทั้งเพิ่มและแก้ไข: editingFixedCost = null คือเพิ่มใหม่
export const AddFixedCostModal = () => {
  const {
    isAddFixedCostOpen,
    setIsAddFixedCostOpen,
    editingFixedCost,
    setEditingFixedCost,
    addFixedCost,
    updateFixedCost,
    categories = []
  } = useWallet();

  // ล็อกอินแล้วใช้หมวดหมู่ฟิกคอสจริงจาก BE เพื่อให้ได้ categoryId ที่ถูกต้อง
  const beCategories = categories.filter(c => c.type === 'fixed');
  const categoryOptions = beCategories.length > 0 ? beCategories.map(c => c.name) : FIXED_COST_CATEGORIES;

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(categoryOptions[0]);
  const [dueDay, setDueDay] = useState('1');
  const [autoDeduct, setAutoDeduct] = useState(false);
  const [note, setNote] = useState('');
  const [startMonth, setStartMonth] = useState(getCurrentMonthPrefix);
  // ว่าง = ไม่มีกำหนดสิ้นสุด (เช่น ค่าเน็ต), ระบุ = จำนวนงวด (เช่น ผ่อนรถ 48 เดือน)
  const [durationMonths, setDurationMonths] = useState('');
  // เฉพาะตอนแก้ไข: เดือนที่ค่าใหม่เริ่มมีผล
  const [effectiveFrom, setEffectiveFrom] = useState(getCurrentMonthPrefix);

  useEffect(() => {
    if (!isAddFixedCostOpen) return;
    const fc = editingFixedCost;
    setTitle(fc?.title || '');
    setAmount(fc ? String(fc.amount) : '');
    setCategory(fc?.category && categoryOptions.includes(fc.category) ? fc.category : categoryOptions[0]);
    setDueDay(String(fc?.dueDay || 1));
    setAutoDeduct(!!fc?.autoDeduct);
    setNote(fc?.note || '');
    // รายการเก่าที่ไม่มีเดือนเริ่ม ปล่อยว่างไว้ จะได้ไม่เปลี่ยนเดือนที่นับย้อนหลัง
    setStartMonth(fc ? fc.startMonth || '' : getCurrentMonthPrefix());
    setDurationMonths(fc ? String(getDurationMonths(fc) || '') : '');
    setEffectiveFrom(getCurrentMonthPrefix());
  }, [isAddFixedCostOpen, editingFixedCost]);

  const numDuration = parseInt(durationMonths, 10);
  const hasDuration = Number.isInteger(numDuration) && numDuration > 0;
  const endMonth = hasDuration && startMonth ? addMonths(startMonth, numDuration - 1) : null;

  const close = () => {
    setIsAddFixedCostOpen(false);
    setEditingFixedCost(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    const numDueDay = parseInt(dueDay, 10);

    if (!title.trim() || !numAmount || numAmount <= 0) {
      alert('กรุณากรอกชื่อรายการและจำนวนเงินให้ถูกต้อง');
      return;
    }

    if (durationMonths !== '' && !hasDuration) {
      alert('ระยะเวลาต้องเป็นจำนวนเดือนตั้งแต่ 1 ขึ้นไป หรือเว้นว่างถ้าไม่มีกำหนด');
      return;
    }

    if (hasDuration && !startMonth) {
      alert('กรุณาเลือกเดือนเริ่มต้นเมื่อระบุระยะเวลา');
      return;
    }

    const data = {
      title: title.trim(),
      amount: numAmount,
      category,
      categoryId: beCategories.find(c => c.name === category)?.id,
      dueDay: numDueDay >= 1 && numDueDay <= 31 ? numDueDay : 1,
      autoDeduct,
      note: note.trim(),
      startMonth: startMonth || null,
      endMonth
    };

    if (editingFixedCost) {
      updateFixedCost(editingFixedCost.id, {
        ...data,
        categoryId: data.categoryId || editingFixedCost.categoryId,
        effectiveFrom
      });
    } else {
      addFixedCost({ ...data, startMonth: startMonth || getCurrentMonthPrefix() });
    }

    close();
  };

  return (
    <Modal
      isOpen={isAddFixedCostOpen}
      onClose={close}
      title={editingFixedCost ? '✏️ แก้ไขรายการฟิกคอส' : '🗓️ เพิ่มรายการฟิกคอสประจำเดือน'}
    >
      <form onSubmit={handleSubmit}>
        {/* Title */}
        <div className="form-group">
          <label className="form-label">ชื่อรายการฟิกคอส *</label>
          <input
            type="text"
            className="form-input"
            placeholder="เช่น ผ่อนคอนโด ธ.กสิกร, ค่างวดรถ, Netflix"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
          />
        </div>

        {/* Amount & Due Day in 2 cols */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">จำนวนเงิน (บาท) *</label>
            <input
              type="number"
              className="form-input num-font"
              placeholder="0.00"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">วันครบกำหนดจ่าย (1-31)</label>
            <input
              type="number"
              className="form-input num-font"
              min="1"
              max="31"
              value={dueDay}
              onChange={(e) => setDueDay(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Period: start month & duration */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">เริ่มนับตั้งแต่เดือน</label>
            <ThaiMonthPicker
              value={startMonth}
              onChange={setStartMonth}
              ariaLabel="เริ่มนับตั้งแต่เดือน"
              placeholder="ไม่ระบุ"
              allowClear={!!editingFixedCost}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">ระยะเวลา (เดือน)</label>
            <input
              type="number"
              className="form-input num-font"
              min="1"
              max="600"
              placeholder="ว่าง = ไม่มีกำหนด"
              value={durationMonths}
              onChange={(e) => setDurationMonths(e.target.value)}
            />
          </div>
        </div>
        <div className="text-xs text-muted mb-3">
          {endMonth
            ? `นับเป็นรายจ่ายทุกเดือน ${formatMonthKey(startMonth)} – ${formatMonthKey(endMonth)} (${numDuration} เดือน)`
            : 'นับเป็นรายจ่ายทุกเดือนโดยไม่มีกำหนดสิ้นสุด'}
        </div>

        {editingFixedCost && (
          <div className="form-group">
            <label className="form-label">มีผลตั้งแต่เดือน</label>
            <ThaiMonthPicker value={effectiveFrom} onChange={setEffectiveFrom} ariaLabel="มีผลตั้งแต่เดือน" />
          </div>
        )}

        {/* Category */}
        <div className="form-group">
          <label className="form-label">หมวดหมู่ฟิกคอส</label>
          <select
            className="form-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categoryOptions.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Auto Deduct checkbox */}
        <div className="form-group">
          <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={autoDeduct}
              onChange={(e) => setAutoDeduct(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: 'var(--primary)' }}
            />
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
              หักบัญชี / ตัดบัตรเครดิตอัตโนมัติ (Auto Deduct)
            </span>
          </label>
        </div>

        {/* Note */}
        <div className="form-group">
          <label className="form-label">บันทึกเพิ่มเติม (Note)</label>
          <input
            type="text"
            className="form-input"
            placeholder="เช่น ตัดผ่านบัตร Citi, จ่ายก่อนวันที่ 5"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            className="btn btn-outline"
            onClick={close}
          >
            ยกเลิก
          </button>
          <button type="submit" className="btn btn-primary">
            {editingFixedCost ? 'บันทึกการแก้ไข' : 'บันทึกฟิกคอส'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
