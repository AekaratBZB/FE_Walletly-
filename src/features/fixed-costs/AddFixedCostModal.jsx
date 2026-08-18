import React, { useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import { Modal } from '../../components/Modal';
import { FIXED_COST_CATEGORIES } from '../../shared/constants';

export const AddFixedCostModal = () => {
  const { isAddFixedCostOpen, setIsAddFixedCostOpen, addFixedCost } = useWallet();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(FIXED_COST_CATEGORIES[0]);
  const [dueDay, setDueDay] = useState('1');
  const [autoDeduct, setAutoDeduct] = useState(false);
  const [note, setNote] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    const numDueDay = parseInt(dueDay, 10);

    if (!title.trim() || !numAmount || numAmount <= 0) {
      alert('กรุณากรอกชื่อรายการและจำนวนเงินให้ถูกต้อง');
      return;
    }

    addFixedCost({
      title: title.trim(),
      amount: numAmount,
      category,
      dueDay: numDueDay >= 1 && numDueDay <= 31 ? numDueDay : 1,
      autoDeduct,
      note: note.trim()
    });

    // Reset & Close
    setTitle('');
    setAmount('');
    setDueDay('1');
    setAutoDeduct(false);
    setNote('');
    setIsAddFixedCostOpen(false);
  };

  return (
    <Modal
      isOpen={isAddFixedCostOpen}
      onClose={() => setIsAddFixedCostOpen(false)}
      title="🗓️ เพิ่มรายการฟิกคอสประจำเดือน"
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

        {/* Category */}
        <div className="form-group">
          <label className="form-label">หมวดหมู่ฟิกคอส</label>
          <select
            className="form-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {FIXED_COST_CATEGORIES.map(c => (
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
            onClick={() => setIsAddFixedCostOpen(false)}
          >
            ยกเลิก
          </button>
          <button type="submit" className="btn btn-primary">
            บันทึกฟิกคอส
          </button>
        </div>
      </form>
    </Modal>
  );
};
