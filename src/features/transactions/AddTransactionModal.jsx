import React, { useState, useEffect } from 'react';
import { useWallet } from '../../context/WalletContext';
import { Modal } from '../../components/Modal';
import { ThaiDatePicker } from '../../components/ThaiDatePicker';
import { TRANSACTION_CATEGORIES, PAYMENT_METHODS } from '../../shared/constants';
import { getTodayDateString } from '../../shared/formatters';
import { isLinkedTransaction } from './transactionMapping';

export const AddTransactionModal = () => {
  const {
    isAddTxOpen,
    setIsAddTxOpen,
    editingTx,
    setEditingTx,
    addTransaction,
    updateTransaction,
    categories: allCategories = []
  } = useWallet();
  const isEditing = !!editingTx;
  const isOpen = isAddTxOpen || isEditing;
  const typeLocked = isEditing && isLinkedTransaction(editingTx);
  const [isSaving, setIsSaving] = useState(false);

  // ล็อกอินแล้วใช้หมวดหมู่จริงจาก BE เพื่อให้ได้ categoryId ที่ถูกต้อง (ชื่อในเครื่องไม่ตรงกับ BE ทุกตัว)
  const getCategoryOptions = (t) => {
    const be = allCategories.filter(c => c.type === t).map(c => c.name);
    return be.length > 0 ? be : TRANSACTION_CATEGORIES[t] || TRANSACTION_CATEGORIES.expense;
  };

  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [note, setNote] = useState('');

  // เปิดแก้ไข: เติมค่าจากรายการเดิม
  useEffect(() => {
    if (!editingTx) return;
    setType(editingTx.type);
    setAmount(String(editingTx.amount ?? ''));
    setCategory(editingTx.category || '');
    setDate(editingTx.date || getTodayDateString());
    setPaymentMethod(editingTx.paymentMethod || PAYMENT_METHODS[0]);
    setNote(editingTx.note || '');
  }, [editingTx]);

  // Update category when type changes (ตอนแก้ไขคงหมวดเดิมไว้ถ้ายังอยู่ในประเภทนั้น)
  useEffect(() => {
    const options = getCategoryOptions(type);
    setCategory(prev =>
      editingTx && editingTx.type === type && prev === editingTx.category ? prev : options[0] || ''
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, allCategories]);

  const close = () => {
    setAmount('');
    setNote('');
    setDate(getTodayDateString());
    setIsAddTxOpen(false);
    setEditingTx(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      alert('กรุณากรอกจำนวนเงินให้ถูกต้อง');
      return;
    }

    const beCategory = allCategories.find(c => c.type === type && c.name === category);
    const tx = {
      type,
      amount: numAmount,
      category,
      categoryId: beCategory?.id,
      date: date || getTodayDateString(),
      paymentMethod,
      note: note.trim()
    };

    if (isEditing) {
      setIsSaving(true);
      const ok = await updateTransaction(editingTx, tx);
      setIsSaving(false);
      if (ok) close();
      return;
    }

    addTransaction(tx);
    close();
  };

  const categories = getCategoryOptions(type);
  // รายการเก่าอาจมีหมวด/ช่องทางที่ไม่อยู่ในตัวเลือกแล้ว: ใส่ไว้ให้เห็นค่าเดิม
  const categoryOptions = category && !categories.includes(category) ? [category, ...categories] : categories;
  const paymentOptions =
    paymentMethod && !PAYMENT_METHODS.includes(paymentMethod) ? [paymentMethod, ...PAYMENT_METHODS] : PAYMENT_METHODS;

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title={isEditing ? '✏️ แก้ไขรายการ' : '📝 บันทึกรายการใหม่'}
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
                  cursor: typeLocked ? 'not-allowed' : 'pointer',
                  opacity: typeLocked && type !== item.id ? 0.5 : 1,
                  fontSize: '0.85rem',
                  fontWeight: type === item.id ? '600' : '400'
                }}
              >
                <input
                  type="radio"
                  name="tx-type-radio"
                  value={item.id}
                  checked={type === item.id}
                  disabled={typeLocked}
                  onChange={(e) => setType(e.target.value)}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <span className={item.color}>{item.label}</span>
              </label>
            ))}
          </div>
          {typeLocked && (
            <div className="text-xs text-muted" style={{ marginTop: 4 }}>
              รายการนี้ผูกกับเป้าออม/หนี้/รายการประจำ จึงเปลี่ยนประเภทไม่ได้
            </div>
          )}
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
              {categoryOptions.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">วันที่ทำรายการ</label>
            <ThaiDatePicker value={date} onChange={setDate} ariaLabel="วันที่ทำรายการ" />
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
            {paymentOptions.map(m => (
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
            onClick={close}
          >
            ยกเลิก
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSaving}>
            {isEditing ? 'บันทึกการแก้ไข' : 'บันทึกรายการ'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
