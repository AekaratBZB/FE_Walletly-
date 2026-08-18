import React from 'react';
import { useWallet } from '../../context/WalletContext';
import { StatCard } from '../../components/StatCard';
import { formatCurrency, formatDate, getCurrentMonthPrefix } from '../../shared/formatters';
import {
  Wallet,
  CreditCard,
  Banknote,
  CalendarClock,
  ArrowRight,
  PlusCircle,
  Sparkles,
  CheckSquare
} from 'lucide-react';

export const DashboardTab = () => {
  const {
    transactions,
    fixedCosts,
    setActiveTab,
    setIsAddFixedCostOpen,
    setIsAddGoalOpen,
    toggleFixedCostPaid
  } = useWallet();

  const currentMonthPrefix = getCurrentMonthPrefix();

  // Calculations for current month
  const totalIncome = transactions
    .filter(t => t.type === 'income' && (t.date || '').startsWith(currentMonthPrefix))
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalFixedCosts = fixedCosts.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const unpaidFixedCosts = fixedCosts.filter(c => !c.isPaid).reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

  const totalVariableExpenses = transactions
    .filter(t => t.type === 'expense' && (t.date || '').startsWith(currentMonthPrefix))
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalSavings = transactions
    .filter(t => t.type === 'savings' && (t.date || '').startsWith(currentMonthPrefix))
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalSpent = totalFixedCosts + totalVariableExpenses;
  const netRemaining = totalIncome - totalSpent - totalSavings;

  const recentTxs = transactions.slice(0, 5);
  const sortedFixedCosts = [...fixedCosts].sort((a, b) => (a.dueDay || 1) - (b.dueDay || 1));

  return (
    <div className="tab-panel active">
      {/* Header & Quick Action Buttons */}
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <div>
          <h2>📊 แดชบอร์ดภาพรวมการเงิน</h2>
          <p>สรุปสถานะการเงิน กระแสเงินสด และภาระค่าใช้จ่ายประจำเดือนนี้</p>
        </div>
        <div className="flex gap-2">
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setIsAddFixedCostOpen(true)}
          >
            <PlusCircle size={14} />
            <span>+ เพิ่มฟิกคอส</span>
          </button>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setIsAddGoalOpen(true)}
          >
            <Sparkles size={14} />
            <span>+ ตั้งเป้าหมายออม</span>
          </button>
        </div>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-4 mb-6">
        <StatCard
          label="รายรับรวมเดือนนี้"
          value={formatCurrency(totalIncome)}
          subtext="เงินเดือน + รายได้เสริม"
          icon={Wallet}
          colorScheme="emerald"
          valueClass="text-success"
        />

        <StatCard
          label="รายจ่ายรวมทั้งหมด"
          value={formatCurrency(totalSpent)}
          subtext="ฟิกคอส + กินใช้ผันแปร"
          icon={CreditCard}
          colorScheme="rose"
          valueClass="text-danger"
        />

        <StatCard
          label="ยอดเงินคงเหลือสุทธิ"
          value={formatCurrency(netRemaining)}
          subtext="รายรับ หัก รายจ่ายและเงินออม"
          icon={Banknote}
          colorScheme="blue"
          valueClass={netRemaining >= 0 ? 'text-success' : 'text-danger'}
        />

        <StatCard
          label="ฟิกคอสประจำเดือน"
          value={formatCurrency(totalFixedCosts)}
          subtext={unpaidFixedCosts > 0 ? `รอจ่าย ${formatCurrency(unpaidFixedCosts)}` : '✓ จ่ายครบแล้ว'}
          icon={CalendarClock}
          colorScheme="amber"
          valueClass="text-warning"
        />
      </div>

      {/* 2-Column Grid: Recent Transactions & Fixed Cost Checklist */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Transactions */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="card-header">
            <div>
              <div className="card-title">📝 รายการล่าสุด</div>
              <div className="card-subtitle">ธุรกรรมรายรับและรายจ่ายล่าสุดของคุณ</div>
            </div>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setActiveTab('transactions')}
            >
              <span>ดูทั้งหมด</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>วันที่</th>
                  <th>ประเภท</th>
                  <th>หมวดหมู่</th>
                  <th className="text-right">จำนวนเงิน</th>
                </tr>
              </thead>
              <tbody>
                {recentTxs.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center text-muted p-4">
                      ยังไม่มีรายการล่าสุด
                    </td>
                  </tr>
                ) : (
                  recentTxs.map(t => {
                    let badgeClass = 'badge-expense';
                    let badgeLabel = 'จ่าย';
                    let amountClass = 'text-danger';
                    let sign = '-';

                    if (t.type === 'income') {
                      badgeClass = 'badge-income';
                      badgeLabel = 'รับ';
                      amountClass = 'text-success';
                      sign = '+';
                    } else if (t.type === 'fixed') {
                      badgeClass = 'badge-fixed';
                      badgeLabel = 'ฟิกคอส';
                      amountClass = 'text-warning';
                    } else if (t.type === 'savings') {
                      badgeClass = 'badge-savings';
                      badgeLabel = 'ออม';
                      amountClass = 'text-info';
                    }

                    return (
                      <tr key={t.id}>
                        <td className="num-font text-xs text-muted">{formatDate(t.date)}</td>
                        <td>
                          <span className={`badge ${badgeClass}`}>{badgeLabel}</span>
                        </td>
                        <td style={{ fontWeight: 500 }}>{t.category}</td>
                        <td className={`text-right num-font font-semibold ${amountClass}`}>
                          {sign}{formatCurrency(t.amount)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Mini Fixed Costs Checklist */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <CheckSquare size={18} />
                <span>Checklist ฟิกคอส</span>
              </div>
              <div className="card-subtitle">รายการที่ต้องจ่ายในเดือนนี้</div>
            </div>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setActiveTab('fixed-costs')}
            >
              <span>จัดการ</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div>
            {sortedFixedCosts.length === 0 ? (
              <div className="text-muted text-center p-4">ไม่มีรายการฟิกคอสในระบบ</div>
            ) : (
              sortedFixedCosts.slice(0, 5).map(fc => (
                <div
                  key={fc.id}
                  className="flex items-center justify-between"
                  style={{
                    padding: '0.65rem 0',
                    borderBottom: '1px solid var(--border-light)'
                  }}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={fc.isPaid}
                      onChange={() => toggleFixedCostPaid(fc.id)}
                      style={{
                        accentColor: 'var(--primary)',
                        cursor: 'pointer',
                        width: 16,
                        height: 16
                      }}
                    />
                    <div>
                      <div
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          textDecoration: fc.isPaid ? 'line-through' : 'none',
                          opacity: fc.isPaid ? 0.6 : 1
                        }}
                      >
                        {fc.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        กำหนดชำระวันที่ {fc.dueDay}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`num-font font-bold text-sm ${fc.isPaid ? 'text-muted' : 'text-main'}`}
                  >
                    {formatCurrency(fc.amount)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
