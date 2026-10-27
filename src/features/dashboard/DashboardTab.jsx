import React, { useEffect, useRef } from 'react';
import { useWallet } from '../../context/WalletContext';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/StatCard';
import { MemberOnly } from '../../components/MemberOnly';
import { formatCurrency, formatDate, getCurrentMonthPrefix } from '../../shared/formatters';
import {
  describeFixedCostPeriod,
  isFixedCostActiveInMonth,
  isFixedCostIncluded
} from '../fixed-costs/fixedCostPeriod';
import { useMonthlySummary } from './useMonthlySummary';
import {
  Wallet,
  CreditCard,
  Banknote,
  CalendarClock,
  ArrowRight,
  PlusCircle,
  Sparkles,
  CheckSquare,
  BarChart3,
  ReceiptText,
  RefreshCw
} from 'lucide-react';

export const DashboardTab = () => {
  const {
    transactions,
    fixedCosts,
    setActiveTab,
    setIsAddFixedCostOpen,
    setIsAddGoalOpen,
    setFixedCostsIncluded
  } = useWallet();
  const { user } = useAuth();
  const isGuest = !!user?.isGuest;

  const currentMonthPrefix = getCurrentMonthPrefix();
  // ตัวเลขสรุปทั้งหมดมาจาก BE (แหล่งเดียว) ฝั่ง FE ใช้รายการฟิกคอสแค่แสดงช่องติ๊ก
  const { summary, error, isLoading, reload } = useMonthlySummary(currentMonthPrefix, !isGuest);
  const showValue = (value) => (summary ? formatCurrency(value) : isLoading ? 'กำลังโหลด…' : '-');

  // ช่องติ๊กของรายการฟิกคอสที่อยู่ในระยะเวลาเดือนนี้ (ติ๊ก = นับเป็นรายจ่าย)
  const monthFixedCosts = fixedCosts
    .filter(c => isFixedCostActiveInMonth(c, currentMonthPrefix))
    .sort((a, b) => (a.dueDay || 1) - (b.dueDay || 1));
  const includedCount = monthFixedCosts.filter(c => isFixedCostIncluded(c, currentMonthPrefix)).length;
  const allIncluded = monthFixedCosts.length > 0 && includedCount === monthFixedCosts.length;
  const someIncluded = includedCount > 0 && !allIncluded;

  const selectAllRef = useRef(null);
  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someIncluded;
  }, [someIncluded]);

  const handleSelectAll = () => {
    setFixedCostsIncluded(monthFixedCosts.map(c => c.id), !allIncluded);
  };

  const recentTxs = transactions.slice(0, 5);

  return (
    <div className="tab-panel active">
      {/* Header & Quick Action Buttons */}
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="flex items-center gap-2">
            <BarChart3 size={22} color="var(--primary)" />
            <span>แดชบอร์ดภาพรวมการเงิน</span>
          </h2>
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

      {/* Top 4 Stat Cards (คำนวณที่ BE) — โหมดทดลองเห็นการ์ดชวนสมัครแทน */}
      <div className="mb-6">
        <MemberOnly
          title="สมัครสมาชิกเพื่อดูสรุปการเงินรายเดือน"
          description="รายรับ รายจ่าย ฟิกคอส และยอดคงเหลือ คำนวณจากข้อมูลบนเซิร์ฟเวอร์ ใช้ได้ทุกเครื่อง"
        >
          {error && (
            <div className="flex items-center justify-between gap-2 mb-3 text-sm text-danger">
              <span>โหลดยอดสรุปจากเซิร์ฟเวอร์ไม่สำเร็จ</span>
              <button className="btn btn-outline btn-sm" onClick={reload}>
                <RefreshCw size={14} />
                <span>ลองอีกครั้ง</span>
              </button>
            </div>
          )}
          <div className="grid grid-cols-4">
            <StatCard
              label="รายรับรวมเดือนนี้"
              value={showValue(summary?.totalIncome)}
              subtext="เงินเดือน + รายได้เสริม"
              icon={Wallet}
              colorScheme="emerald"
              valueClass="text-success"
            />

            <StatCard
              label="รายจ่ายรวมทั้งหมด"
              value={showValue(summary?.totalSpent)}
              subtext="ฟิกคอส + กินใช้ผันแปร"
              icon={CreditCard}
              colorScheme="rose"
              valueClass="text-danger"
            />

            <StatCard
              label="ยอดเงินคงเหลือสุทธิ"
              value={showValue(summary?.netRemaining)}
              subtext="รายรับ หัก รายจ่ายและเงินออม"
              icon={Banknote}
              colorScheme="blue"
              variant="dark"
              valueClass={(summary?.netRemaining ?? 0) >= 0 ? '' : 'text-danger'}
            />

            <StatCard
              label="ฟิกคอสประจำเดือน"
              value={showValue(summary?.totalFixedCosts)}
              subtext={
                !summary
                  ? ' '
                  : summary.fixedCostsActiveCount === 0
                    ? 'ยังไม่มีฟิกคอสเดือนนี้'
                    : `นับในรายจ่าย ${summary.fixedCostsIncludedCount}/${summary.fixedCostsActiveCount} รายการ`
              }
              icon={CalendarClock}
              colorScheme="orange"
              valueClass="text-warning"
            />
          </div>
        </MemberOnly>
      </div>

      {/* 2-Column Grid: Recent Transactions & Fixed Cost Checklist */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Transactions (โหมดทดลองกว้างเต็มแถว) */}
        <div className="card" style={{ gridColumn: isGuest ? '1 / -1' : 'span 2' }}>
          <div className="card-header">
            <div>
              <div className="card-title">
                <ReceiptText size={18} color="var(--primary)" />
                <span>รายการล่าสุด</span>
              </div>
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

        {/* Right 1 Col: Mini Fixed Costs Checklist (เฉพาะสมาชิก เพราะยอดที่นับคำนวณที่ BE) */}
        {!isGuest && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <CheckSquare size={18} color="var(--primary)" />
                <span>Checklist ฟิกคอส</span>
              </div>
              <div className="card-subtitle">ติ๊ก = นับเป็นรายจ่ายของเดือนนี้</div>
            </div>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setActiveTab('fixed-costs')}
            >
              <span>จัดการ</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {monthFixedCosts.length === 0 ? (
            <div className="text-muted text-center p-4">ไม่มีรายการฟิกคอสในเดือนนี้</div>
          ) : (
            <>
              <label
                className="flex items-center justify-between"
                style={{
                  padding: '0.5rem 0',
                  borderBottom: '1px solid var(--border-light)',
                  cursor: 'pointer'
                }}
              >
                <span className="flex items-center gap-2">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={allIncluded}
                    onChange={handleSelectAll}
                    aria-label="เลือกฟิกคอสทั้งหมด"
                    style={{ accentColor: 'var(--primary)', cursor: 'pointer', width: 16, height: 16 }}
                  />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    เลือกทั้งหมด ({includedCount}/{monthFixedCosts.length})
                  </span>
                </span>
                <span className="num-font font-bold text-sm text-warning">
                  {showValue(summary?.totalFixedCosts)}
                </span>
              </label>

              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {monthFixedCosts.map(fc => {
                  const included = isFixedCostIncluded(fc, currentMonthPrefix);
                  return (
                    <label
                      key={fc.id}
                      className="flex items-center justify-between"
                      style={{
                        padding: '0.65rem 0',
                        borderBottom: '1px solid var(--border-light)',
                        cursor: 'pointer'
                      }}
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={included}
                          onChange={() => setFixedCostsIncluded([fc.id], !included)}
                          style={{
                            accentColor: 'var(--primary)',
                            cursor: 'pointer',
                            width: 16,
                            height: 16
                          }}
                        />
                        <span>
                          <span
                            style={{
                              display: 'block',
                              fontSize: '0.85rem',
                              fontWeight: 600,
                              opacity: included ? 1 : 0.5
                            }}
                          >
                            {fc.title}
                          </span>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            วันที่ {fc.dueDay} · {describeFixedCostPeriod(fc, currentMonthPrefix)}
                          </span>
                        </span>
                      </span>
                      <span
                        className={`num-font font-bold text-sm ${included ? 'text-main' : 'text-muted'}`}
                        style={{ textDecoration: included ? 'none' : 'line-through' }}
                      >
                        {formatCurrency(fc.amount)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </>
          )}
        </div>
        )}
      </div>
    </div>
  );
};
