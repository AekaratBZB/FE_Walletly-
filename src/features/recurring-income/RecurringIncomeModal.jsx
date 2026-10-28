import React, { useEffect, useState } from 'react';
import { Modal } from '../../components/Modal';
import { ThaiMonthPicker } from '../../components/ThaiDatePicker';
import { formatMonthKey, getCurrentMonthPrefix } from '../../shared/formatters';
import { addMonths, getDurationMonths, toApiMonth } from '../fixed-costs/fixedCostPeriod';

// แปลงค่าในฟอร์มเป็น body ที่ BE รับ; ระยะเวลาว่าง = ไม่มีกำหนด (endMonth null)
export const toRecurringIncomePayload = (form) => {
  const start = form.startMonth ? String(form.startMonth).slice(0, 7) : null;
  const duration = parseInt(form.durationMonths, 10);
  const hasDuration = Number.isInteger(duration) && duration > 0;
  const effective = form.effectiveFrom ? String(form.effectiveFrom).slice(0, 7) : null;
  return {
    title: String(form.title || '').trim(),
    amount: Number(form.amount) || 0,
    payDay: Number(form.payDay) || 1,
    categoryId: form.categoryId,
    startMonth: toApiMonth(start),
    endMonth: hasDuration && start ? toApiMonth(addMonths(start, duration - 1)) : null,
    note: String(form.note || '').trim(),
    effectiveFrom: toApiMonth(effective)
  };
};

// editing = null คือเพิ่มใหม่
export const RecurringIncomeModal = ({ isOpen, onClose, editing, categories = [], onSave }) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [payDay, setPayDay] = useState('1');
  const [categoryId, setCategoryId] = useState('');
  const [startMonth, setStartMonth] = useState(getCurrentMonthPrefix);
  const [durationMonths, setDurationMonths] = useState('');
  const [note, setNote] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState(getCurrentMonthPrefix);

  useEffect(() => {
    if (!isOpen) return;
    setTitle(editing?.title || '');
    setAmount(editing ? String(editing.amount) : '');
    setPayDay(String(editing?.payDay || 1));
    setCategoryId(editing?.categoryId || categories[0]?.id || '');
    setStartMonth(editing ? editing.startMonth || '' : getCurrentMonthPrefix());
    setDurationMonths(editing ? String(getDurationMonths(editing) || '') : '');
    setNote(editing?.note || '');
    setEffectiveFrom(getCurrentMonthPrefix());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editing]);

  const numDuration = parseInt(durationMonths, 10);
  const hasDuration = Number.isInteger(numDuration) && numDuration > 0;
  const endMonth = hasDuration && startMonth ? addMonths(startMonth, numDuration - 1) : null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    const numDay = parseInt(payDay, 10);
    if (!title.trim() || !numAmount || numAmount <= 0) {
      alert('กรุณากรอกชื่อรายการและจำนวนเงินให้ถูกต้อง');
      return;
    }
    if (!categoryId) {
      alert('กรุณาเลือกหมวดหมู่');
      return;
    }
    if (durationMonths !== '' && !hasDuration) {
      alert('ระยะเวลาต้องเป็นจำนวนเดือนตั้งแต่ 1 ขึ้นไป หรือเว้นว่างถ้าไม่มีกำหนด');
      return;
    }
    if (hasDuration && !startMonth) {
      alert('กรุณาเลือกเดือนเริ่มเมื่อระบุระยะเวลา');
      return;
    }
    const payload = toRecurringIncomePayload({
      title,
      amount: numAmount,
      payDay: numDay >= 1 && numDay <= 31 ? numDay : 1,
      categoryId,
      startMonth,
      durationMonths,
      note,
      effectiveFrom: editing ? effectiveFrom : null
    });
    // เพิ่มใหม่ไม่ต้องมี effectiveFrom
    if (!editing) delete payload.effectiveFrom;
    onSave(payload);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editing ? '✏️ แก้ไขรายรับประจำ' : '💰 เพิ่มรายรับประจำ'}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">ชื่อรายการ *</label>
          <input
            type="text"
            className="form-input"
            placeholder="เช่น เงินเดือน"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">จำนวนเงิน *</label>
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
            <label className="form-label">วันที่เงินเข้า</label>
            <input
              type="number"
              className="form-input num-font"
              min="1"
              max="31"
              value={payDay}
              onChange={(e) => setPayDay(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">หมวดหมู่</label>
          <select className="form-select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">เดือนเริ่ม</label>
            <ThaiMonthPicker value={startMonth} onChange={setStartMonth} ariaLabel="เดือนเริ่ม" placeholder="ไม่ระบุ" allowClear={!!editing} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">ระยะเวลา (เดือน)</label>
            <input
              type="number"
              className="form-input num-font"
              min="1"
              max="600"
              placeholder="ไม่มีกำหนด"
              value={durationMonths}
              onChange={(e) => setDurationMonths(e.target.value)}
            />
          </div>
        </div>
        <div className="text-xs text-muted mb-3">
          {endMonth
            ? `รับทุกเดือน ${formatMonthKey(startMonth)} – ${formatMonthKey(endMonth)} (${numDuration} เดือน)`
            : 'รับทุกเดือนโดยไม่มีกำหนดสิ้นสุด'}
        </div>

        {editing && (
          <div className="form-group">
            <label className="form-label">มีผลตั้งแต่เดือน</label>
            <ThaiMonthPicker value={effectiveFrom} onChange={setEffectiveFrom} ariaLabel="มีผลตั้งแต่เดือน" />
          </div>
        )}

        <div className="form-group">
          <label className="form-label">หมายเหตุ</label>
          <input type="text" className="form-input" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button type="button" className="btn btn-outline" onClick={onClose}>ยกเลิก</button>
          <button type="submit" className="btn btn-primary">{editing ? 'บันทึกการแก้ไข' : 'บันทึก'}</button>
        </div>
      </form>
    </Modal>
  );
};
