import React, { useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, getCurrentMonthPrefix } from '../../shared/formatters';
import { StatCard } from '../../components/StatCard';
import { describeFixedCostPeriod, isFixedCostActiveInMonth } from '../fixed-costs/fixedCostPeriod';
import { useRecurringIncomesState } from './useRecurringIncomesState';
import { RecurringIncomeModal } from './RecurringIncomeModal';
import { CalendarDays, Pencil, Plus, Scale, Trash2, Wallet } from 'lucide-react';

export const RecurringIncomesTab = () => {
  const { categories = [], allocationSettings, addToast, reloadTransactions } = useWallet();
  const { user } = useAuth();
  const { items, isLoading, hasToken, create, update, remove } = useRecurringIncomesState({
    userId: user?.id,
    reloadTransactions,
    addToast
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [isAddingSalary, setIsAddingSalary] = useState(false);

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
  // ยอดรวมนับเฉพาะรายการที่มีผลเดือนนี้ เหมือนหน้าฟิกคอส
  const activeItems = items.filter(i => isFixedCostActiveInMonth(i, currentMonth));
  const totalAmount = activeItems.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const sortedItems = [...items].sort((a, b) => (a.payDay || 1) - (b.payDay || 1));
  const incomeDiff = totalAmount - monthlyIncome;
  const incomeDiffText = monthlyIncome <= 0
    ? 'กรอกรายได้ต่อเดือนในแท็บแบ่งสัดส่วนเพื่อเทียบ'
    : incomeDiff === 0
      ? 'ตรงกับรายรับประจำ'
      : `รายรับประจำ${incomeDiff > 0 ? 'มากกว่า' : 'น้อยกว่า'} ${formatCurrency(Math.abs(incomeDiff))}`;

  const handleDelete = (item) => {
    if (window.confirm(`คุณต้องการลบรายการรายรับประจำ "${item.title}" ใช่หรือไม่?`)) {
      remove(item.id);
    }
  };

  const openAdd = () => { setEditing(null); setIsModalOpen(true); };
  const openEdit = (item) => { setEditing(item); setIsModalOpen(true); };
  const close = () => { setIsModalOpen(false); setEditing(null); };

  const handleSave = async (payload) => {
    const ok = editing ? await update(editing.id, payload) : await create(payload);
    if (ok) close();
  };

  const useSalary = async () => {
    if (isAddingSalary) return;
    const category = incomeCategories.find(c => c.name.includes('เงินเดือน')) || incomeCategories[0];
    if (!category) return;
    setIsAddingSalary(true);
    try {
      await create({ title: 'เงินเดือน', amount: monthlyIncome, payDay: 1, categoryId: category.id });
    } finally {
      setIsAddingSalary(false);
    }
  };

  return (
    <div className="tab-panel active">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <div>
          <h2>💰 รายรับประจำ (Recurring Income)</h2>
          <p>เงินเดือนและรายรับที่เข้าทุกเดือน ระบบจะบันทึกให้อัตโนมัติเมื่อถึงวันที่เงินเข้า</p>
        </div>
        <div className="flex gap-2">
          <button
            className="btn btn-primary btn-sm"
            onClick={openAdd}
            disabled={incomeCategories.length === 0}
          >
            <Plus size={14} />
            <span>เพิ่มรายรับประจำ</span>
          </button>
        </div>
      </div>

      {/* 3 Stat Cards */}
      <div className="grid grid-cols-3 mb-6">
        <StatCard
          label="ยอดรายรับประจำต่อเดือน"
          value={formatCurrency(totalAmount)}
          subtext="รวมรายการที่มีผลเดือนนี้"
          icon={Wallet}
          colorScheme="emerald"
          valueClass="text-success"
        />

        <StatCard
          label="จำนวนรายการ"
          value={`${activeItems.length}`}
          subtext={`จากทั้งหมด ${items.length} รายการ`}
          icon={CalendarDays}
          colorScheme="amber"
          valueClass="text-main"
        />

        <StatCard
          label="เทียบรายได้ในหน้าแบ่งสัดส่วน"
          value={monthlyIncome > 0 ? formatCurrency(monthlyIncome) : '-'}
          subtext={incomeDiffText}
          icon={Scale}
          colorScheme={monthlyIncome > 0 && totalAmount !== monthlyIncome ? 'rose' : 'emerald'}
          valueClass="text-main"
        />
      </div>

      {/* Recurring Income Table Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">📋 รายการรายรับประจำ</div>
            <div className="card-subtitle">เรียงตามวันที่เงินเข้าในแต่ละเดือน</div>
          </div>
          <div className="text-xs text-muted">
            ทั้งหมด <b className="num-font text-main">{items.length}</b> รายการ
          </div>
        </div>

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>วันที่เงินเข้า</th>
                <th>รายการ</th>
                <th>หมวดหมู่</th>
                <th>ระยะเวลา</th>
                <th className="text-right">จำนวนเงิน</th>
                <th className="text-right" style={{ width: '100px' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && items.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center text-muted" style={{ padding: '3rem 1rem' }}>
                    กำลังโหลด...
                  </td>
                </tr>
              ) : sortedItems.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center text-muted" style={{ padding: '3rem 1rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💰</div>
                    <div style={{ fontWeight: 600 }}>ยังไม่มีรายการรายรับประจำ</div>
                    {monthlyIncome > 0 && incomeCategories.length > 0 ? (
                      <button className="btn btn-primary btn-sm mt-2" onClick={useSalary} disabled={isAddingSalary}>
                        <Plus size={14} />
                        <span>ใช้เงินเดือน {formatCurrency(monthlyIncome)} จากหน้าแบ่งสัดส่วน</span>
                      </button>
                    ) : (
                      <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                        กดปุ่ม "เพิ่มรายรับประจำ" เพื่อบันทึกรายรับที่เข้าทุกเดือน
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                sortedItems.map(item => (
                  <tr key={item.id}>
                    <td className="num-font font-semibold text-sm" style={{ whiteSpace: 'nowrap' }}>
                      ทุกวันที่ {item.payDay}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.title}</div>
                      {item.note && <div className="text-xs text-muted mt-1">{item.note}</div>}
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.8rem',
                          background: 'var(--bg-subtle)',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          border: '1px solid var(--border-light)'
                        }}
                      >
                        {item.category}
                      </span>
                    </td>
                    <td className="text-sm text-muted" style={{ whiteSpace: 'nowrap' }}>
                      {describeFixedCostPeriod(item, currentMonth)}
                    </td>
                    <td className="text-right num-font font-bold text-success">
                      {formatCurrency(item.amount)}
                    </td>
                    <td className="text-right" style={{ whiteSpace: 'nowrap' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => openEdit(item)}
                        title="แก้ไขรายการ"
                        aria-label={`แก้ไข ${item.title}`}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleDelete(item)}
                        title="ลบรายการ"
                        aria-label={`ลบ ${item.title}`}
                        style={{ color: 'var(--danger)' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
