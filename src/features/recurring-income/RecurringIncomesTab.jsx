import React, { useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, getCurrentMonthPrefix } from '../../shared/formatters';
import { describeFixedCostPeriod } from '../fixed-costs/fixedCostPeriod';
import { useRecurringIncomesState } from './useRecurringIncomesState';
import { RecurringIncomeModal } from './RecurringIncomeModal';
import { Pencil, Plus, Trash2 } from 'lucide-react';

export const RecurringIncomesTab = () => {
  const { categories = [], allocationSettings, addToast, onSynced } = useWallet();
  const { user } = useAuth();
  const { items, isLoading, hasToken, create, update, remove } = useRecurringIncomesState({
    userId: user?.id,
    onSynced,
    addToast
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  if (!hasToken) {
    return (
      <div className="card text-center text-muted" style={{ padding: '2rem' }}>
        เข้าสู่ระบบเพื่อใช้รายรับประจำ
      </div>
    );
  }

  const incomeCategories = categories.filter(c => c.type === 'income');
  const monthlyIncome = Number(allocationSettings?.monthlyIncome) || 0;
  const currentMonth = getCurrentMonthPrefix();

  const openAdd = () => { setEditing(null); setIsModalOpen(true); };
  const openEdit = (item) => { setEditing(item); setIsModalOpen(true); };
  const close = () => { setIsModalOpen(false); setEditing(null); };

  const handleSave = async (payload) => {
    const ok = editing ? await update(editing.id, payload) : await create(payload);
    if (ok) close();
  };

  const useSalary = () => {
    const category = incomeCategories.find(c => c.name.includes('เงินเดือน')) || incomeCategories[0];
    if (!category) return;
    create({ title: 'เงินเดือน', amount: monthlyIncome, payDay: 1, categoryId: category.id });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>💰 รายรับประจำ</h2>
          <div className="text-sm text-muted">เงินเดือนและรายรับที่เข้าทุกเดือน ระบบจะบันทึกให้อัตโนมัติเมื่อถึงวันที่เงินเข้า</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd} disabled={incomeCategories.length === 0}>
          <Plus size={16} /> เพิ่มรายรับประจำ
        </button>
      </div>

      {items.length === 0 && !isLoading ? (
        <div className="card text-center" style={{ padding: '2rem' }}>
          {monthlyIncome > 0 && incomeCategories.length > 0 && (
            <button className="btn btn-primary" onClick={useSalary}>
              ใช้เงินเดือน {formatCurrency(monthlyIncome)} จากหน้าแบ่งสัดส่วน
            </button>
          )}
        </div>
      ) : (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>ชื่อรายการ</th>
                <th>หมวดหมู่</th>
                <th>วันที่เงินเข้า</th>
                <th>ระยะเวลา</th>
                <th style={{ textAlign: 'right' }}>จำนวนเงิน</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td>{item.title}</td>
                  <td>{item.category}</td>
                  <td className="num-font">{item.payDay}</td>
                  <td>{describeFixedCostPeriod(item, currentMonth)}</td>
                  <td className="num-font" style={{ textAlign: 'right' }}>{formatCurrency(item.amount)}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button className="btn btn-outline btn-sm" onClick={() => openEdit(item)} aria-label="แก้ไข"><Pencil size={14} /></button>{' '}
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => { if (window.confirm(`ลบ "${item.title}" ?`)) remove(item.id); }}
                      aria-label="ลบ"
                    ><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <RecurringIncomeModal
        isOpen={isModalOpen}
        onClose={close}
        editing={editing}
        categories={incomeCategories}
        onSave={handleSave}
      />
    </div>
  );
};
