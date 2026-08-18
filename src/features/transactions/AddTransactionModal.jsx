import React, { useState, useEffect } from 'react';
import { useWallet } from '../../context/WalletContext';
import { Modal } from '../../components/Modal';
import { TRANSACTION_CATEGORIES, PAYMENT_METHODS } from '../../shared/constants';
import { getTodayDateString } from '../../shared/formatters';

export const AddTransactionModal = () => {
  const { isAddTxOpen, setIsAddTxOpen, addTransaction } = useWallet();

  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [note, setNote] = useState('');

  // Update category when type changes
  useEffect(() => {
    const cats = TRANSACTION_CATEGORIES[type] || TRANSACTION_CATEGORIES.expense;
    setCategory(cats[0] || '');
  }, [type]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      alert('กรุณากรอกจำนวนเงินให้ถูกต้อง');
      return;
    }

    addTransaction({
      type,
      amount: numAmount,
      category,
      date: date || getTodayDateString(),
      paymentMethod,
      note: note.trim()
    });

    // Reset & Close
    setAmount('');
    setNote('');
    setDate(getTodayDateString());
    setIsAddTxOpen(false);
  };

  const categories = TRANSACTION_CATEGORIES[type] || TRANSACTION_CATEGORIES.expense;

  return (
    <Modal
      isOpen={isAddTxOpen}
      onClose={() => setIsAddTxOpen(false)}
      title="📝 บันทึกรายการใหม่"
    >
      <form onSubmit={handleSubmit}>
        {/* Transaction Type Radio Selector */}
        <div className="form-group">
          <label className="form-label">ประเภทรายการ</label>
          <div className="flex gap-2 flex-wrap">
            {[
              { id: 'expense', label: 'รายจ่าย (Expense)', color: 'text-danger' },
              { id: 'income', label: 'รายรับ (Income)', color: 'text-success' },
              { id: 'fixed', label: 'ฟิกคอส (Fixed Cost)', color: 'text-warning' },
              { id: 'savings', label: 'ออม/ลงทุน (Savings)', color: 'text-info' }
            ].map(item => (
              <label
                key={item.id}
                className="flex items-center gap-1 p-2"
                style={{
                  background: type === item.id ? 'var(--bg-subtle)' : 'transparent',
                  border: `1px solid ${type === item.id ? 'var(--primary)' : 'var(--border-color)'}`,
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: type === item.id ? '600' : '400'
                }}
              >
                <input
                  type="radio"
                  name="tx-type-radio"
                  value={item.id}
                  checked={type === item.id}
                  onChange={(e) => setType(e.target.value)}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <span className={item.color}>{item.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Amount */}
        <div className="form-group">
          <label className="form-label">จำนวนเงิน (บาท) *</label>
          <input
            type="number"
            className="form-input num-font"
            placeholder="0.00"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            autoFocus
          />
        </div>

        {/* Category & Date in 2 Cols */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">หมวดหมู่</label>
            <select
              className="form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">วันที่ทำรายการ</label>
            <input
              type="date"
              className="form-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Payment Method */}
        <div className="form-group">
          <label className="form-label">ช่องทางการชำระเงิน</label>
          <select
            className="form-select"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            {PAYMENT_METHODS.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* Note */}
        <div className="form-group">
          <label className="form-label">บันทึกเพิ่มเติม (Note)</label>
          <input
            type="text"
            className="form-input"
            placeholder="เช่น สั่ง Grab, กาแฟ Starbuck, ค่าผ่อนคอนโด"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setIsAddTxOpen(false)}
          >
            ยกเลิก
          </button>
          <button type="submit" className="btn btn-primary">
            บันทึกรายการ
          </button>
        </div>
      </form>
    </Modal>
  );
};
