import React, { useState } from 'react';
import { Modal } from '../../components/Modal';
import { ThaiDatePicker } from '../../components/ThaiDatePicker';
import { formatMonthKey } from '../../shared/formatters';

// แก้ยอดรายการคาดการณ์ของเดือนนี้ -> บันทึกเป็นรายการจริง
export const ProjectedEntryModal = ({ entry, onClose, onSave }) => {
  const [amount, setAmount] = useState(String(entry.amount));
  const [txDate, setTxDate] = useState(entry.date);
  const [note, setNote] = useState(entry.note || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0 || !txDate) {
      alert('กรุณากรอกจำนวนเงินและวันที่ให้ถูกต้อง');
      return;
    }
    setSaving(true);
    try {
      await onSave({ amount: numAmount, txDate, note: note.trim() });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={`✏️ แก้ไข ${entry.category} เดือน ${formatMonthKey(entry.sourcePeriod)}`}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">จำนวนเงิน *</label>
          <input
            type="number"
            className="form-input num-font"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div className="form-group">
          <label className="form-label">วันที่</label>
          <ThaiDatePicker value={txDate} onChange={setTxDate} ariaLabel="วันที่" />
        </div>
        <div className="form-group">
          <label className="form-label">หมายเหตุ</label>
          <input type="text" className="form-input" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button type="button" className="btn btn-outline" onClick={onClose}>ยกเลิก</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>บันทึก</button>
        </div>
      </form>
    </Modal>
  );
};
