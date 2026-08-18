import React, { useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import { Modal } from '../../components/Modal';
import { formatCurrency } from '../../shared/formatters';

export const QuickDepositModal = () => {
  const { quickDepositGoal, setQuickDepositGoal, depositToSavingsGoal } = useWallet();
  const [amount, setAmount] = useState('5000');

  if (!quickDepositGoal) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      alert('กรุณากรอกจำนวนเงินที่ต้องการฝาก');
      return;
    }

    depositToSavingsGoal(quickDepositGoal.id, numAmount, quickDepositGoal.title);
    setQuickDepositGoal(null);
    setAmount('5000');
  };

  return (
    <Modal
      isOpen={!!quickDepositGoal}
      onClose={() => setQuickDepositGoal(null)}
      title={`💰 ฝากเงินเพิ่มเข้า: ${quickDepositGoal.title}`}
    >
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1.25rem', padding: '0.85rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted">ยอดปัจจุบัน:</span>
            <span className="font-bold num-font text-main">{formatCurrency(quickDepositGoal.currentAmount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">เป้าหมายทั้งหมด:</span>
            <span className="font-bold num-font text-primary">{formatCurrency(quickDepositGoal.targetAmount)}</span>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">จำนวนเงินที่ต้องการฝากเพิ่ม (บาท) *</label>
          <input
            type="number"
            className="form-input num-font"
            placeholder="5000"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="flex gap-2 mb-3">
          {[1000, 2000, 5000, 10000].map(quickVal => (
            <button
              key={quickVal}
              type="button"
              className="btn btn-outline btn-sm num-font flex-1"
              onClick={() => setAmount(String(quickVal))}
            >
              +{quickVal.toLocaleString()} ฿
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setQuickDepositGoal(null)}
          >
            ยกเลิก
          </button>
          <button type="submit" className="btn btn-primary">
            ยืนยันการฝากเงิน
          </button>
        </div>
      </form>
    </Modal>
  );
};
