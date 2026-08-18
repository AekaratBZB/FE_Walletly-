import React, { useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import { Modal } from '../../components/Modal';

export const AddGoalModal = () => {
  const { isAddGoalOpen, setIsAddGoalOpen, addSavingsGoal } = useWallet();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('ความมั่นคง');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [expectedReturnRate, setExpectedReturnRate] = useState('0');

  const handleSubmit = (e) => {
    e.preventDefault();
    const numTarget = parseFloat(targetAmount);
    if (!title.trim() || !numTarget || numTarget <= 0) {
      alert('กรุณากรอกชื่อเป้าหมายและจำนวนเงินเป้าหมายให้ถูกต้อง');
      return;
    }

    addSavingsGoal({
      title: title.trim(),
      category,
      targetAmount: numTarget,
      currentAmount: parseFloat(currentAmount) || 0,
      monthlyContribution: parseFloat(monthlyContribution) || 0,
      targetDate: targetDate || '',
      expectedReturnRate: parseFloat(expectedReturnRate) || 0
    });

    // Reset & Close
    setTitle('');
    setTargetAmount('');
    setCurrentAmount('0');
    setMonthlyContribution('');
    setTargetDate('');
    setExpectedReturnRate('0');
    setIsAddGoalOpen(false);
  };

  return (
    <Modal
      isOpen={isAddGoalOpen}
      onClose={() => setIsAddGoalOpen(false)}
      title="🎯 ตั้งเป้าหมายการออม & ลงทุนใหม่"
    >
      <form onSubmit={handleSubmit}>
        {/* Title */}
        <div className="form-group">
          <label className="form-label">ชื่อเป้าหมาย *</label>
          <input
            type="text"
            className="form-input"
            placeholder="เช่น เงินสำรองฉุกเฉิน 6 เดือน, ซื้อบ้าน, พอร์ตเกษียณ"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
          />
        </div>

        {/* Category */}
        <div className="form-group">
          <label className="form-label">หมวดหมู่เป้าหมาย</label>
          <select
            className="form-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="ความมั่นคง">🛡️ ความมั่นคง (เงินสำรองฉุกเฉิน / ประกัน)</option>
            <option value="การลงทุน">📈 การลงทุน (หุ้น / กองทุน / พอร์ตเกษียณ)</option>
            <option value="ท่องเที่ยว">✈️ ท่องเที่ยว / พักผ่อน</option>
            <option value="ทรัพย์สินใหญ่">🏠 ทรัพย์สินใหญ่ (ดาวน์บ้าน / ซื้อรถ)</option>
            <option value="การศึกษา">🎓 พัฒนาตนเอง / การศึกษา</option>
            <option value="อื่นๆ">🎯 อื่นๆ</option>
          </select>
        </div>

        {/* Target Amount & Initial Amount */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">เป้าหมายรวม (บาท) *</label>
            <input
              type="number"
              className="form-input num-font"
              placeholder="100000"
              step="any"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">มีอยู่แล้วตอนนี้ (บาท)</label>
            <input
              type="number"
              className="form-input num-font"
              placeholder="0"
              step="any"
              value={currentAmount}
              onChange={(e) => setCurrentAmount(e.target.value)}
            />
          </div>
        </div>

        {/* Monthly Contribution & Target Date */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">ออมเดือนละ (บาท)</label>
            <input
              type="number"
              className="form-input num-font"
              placeholder="5000"
              step="any"
              value={monthlyContribution}
              onChange={(e) => setMonthlyContribution(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">วันที่คาดหวังจะบรรลุ</label>
            <input
              type="date"
              className="form-input"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>
        </div>

        {/* Expected Return Rate */}
        {category === 'การลงทุน' && (
          <div className="form-group">
            <label className="form-label">ผลตอบแทนคาดหวังเฉลี่ยต่อปี (% ต่อปี)</label>
            <input
              type="number"
              className="form-input num-font"
              placeholder="7"
              step="0.1"
              value={expectedReturnRate}
              onChange={(e) => setExpectedReturnRate(e.target.value)}
            />
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setIsAddGoalOpen(false)}
          >
            ยกเลิก
          </button>
          <button type="submit" className="btn btn-primary">
            สร้างเป้าหมาย
          </button>
        </div>
      </form>
    </Modal>
  );
};
