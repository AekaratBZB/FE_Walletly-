import React from 'react';
import { useWallet } from '../../context/WalletContext';
import { StatCard } from '../../components/StatCard';
import { formatCurrency } from '../../shared/formatters';
import {
  CalendarDays,
  CheckCircle,
  Clock,
  Percent,
  Plus,
  RotateCcw,
  Trash2
} from 'lucide-react';

export const FixedCostsTab = () => {
  const {
    fixedCosts,
    allocationSettings,
    setIsAddFixedCostOpen,
    toggleFixedCostPaid,
    deleteFixedCost,
    resetFixedCostsMonthly
  } = useWallet();

  const monthlyIncome = Number(allocationSettings.monthlyIncome) || 50000;

  const totalAmount = fixedCosts.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const paidAmount = fixedCosts.filter(c => c.isPaid).reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const unpaidAmount = totalAmount - paidAmount;
  const burdenRatio = monthlyIncome > 0 ? (totalAmount / monthlyIncome) * 100 : 0;

  let ratioColorClass = 'text-success';
  let ratioDesc = 'สัดส่วนเหมาะสม (ต่ำกว่า 40%)';
  if (burdenRatio > 50) {
    ratioColorClass = 'text-danger';
    ratioDesc = 'ภาระตึงตัวสูง (เกิน 50% ของรายได้)';
  } else if (burdenRatio > 40) {
    ratioColorClass = 'text-warning';
    ratioDesc = 'เริ่มตึงตัว (40% - 50% ของรายได้)';
  }

  const sortedCosts = [...fixedCosts].sort((a, b) => (a.dueDay || 1) - (b.dueDay || 1));

  const handleDelete = (id, title) => {
    if (window.confirm(`คุณต้องการลบรายการฟิกคอส "${title}" ใช่หรือไม่?`)) {
      deleteFixedCost(id);
    }
  };

  const handleResetMonthly = () => {
    if (window.confirm('ต้องการรีเซ็ตสถานะการชำระเงินของทุกรายการเป็น "รอชำระ" สำหรับเริ่มต้นเดือนใหม่หรือไม่?')) {
      resetFixedCostsMonthly();
    }
  };

  return (
    <div className="tab-panel active">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <div>
          <h2>🗓️ จัดการฟิกคอสรายเดือน (Fixed Costs)</h2>
          <p>ควบคุมค่าใช้จ่ายคงที่ ภาระผูกพันรายเดือน และติดตามสถานะการชำระเงิน</p>
        </div>
        <div className="flex gap-2">
          <button
            className="btn btn-outline btn-sm"
            onClick={handleResetMonthly}
            title="รีเซ็ตสถานะชำระเงินสำหรับเดือนใหม่"
          >
            <RotateCcw size={14} />
            <span>เริ่มรอบเดือนใหม่</span>
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setIsAddFixedCostOpen(true)}
          >
            <Plus size={14} />
            <span>+ เพิ่มฟิกคอส</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-4 mb-6">
        <StatCard
          label="ยอดฟิกคอสรวมต่อเดือน"
          value={formatCurrency(totalAmount)}
          subtext="รวมทุกภาระที่ต้องจ่าย"
          icon={CalendarDays}
          colorScheme="amber"
          valueClass="text-main"
        />

        <StatCard
          label="ชำระแล้วรอบนี้"
          value={formatCurrency(paidAmount)}
          subtext={`${fixedCosts.filter(c => c.isPaid).length} รายการ`}
          icon={CheckCircle}
          colorScheme="emerald"
          valueClass="text-success"
        />

        <StatCard
          label="ยอดที่ยังรอชำระ"
          value={formatCurrency(unpaidAmount)}
          subtext={`${fixedCosts.filter(c => !c.isPaid).length} รายการ`}
          icon={Clock}
          colorScheme="rose"
          valueClass="text-danger"
        />

        <StatCard
          label="Fixed Cost Burden Ratio"
          value={`${burdenRatio.toFixed(1)}%`}
          subtext={ratioDesc}
          icon={Percent}
          colorScheme={burdenRatio > 50 ? 'rose' : burdenRatio > 40 ? 'amber' : 'emerald'}
          valueClass={ratioColorClass}
        />
      </div>

      {/* Fixed Costs Table Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">📋 รายการภาระค่าใช้จ่ายคงที่</div>
            <div className="card-subtitle">เรียงตามวันที่ครบกำหนดชำระในแต่ละเดือน (Due Date)</div>
          </div>
        </div>

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '45px', textAlign: 'center' }}>สถานะ</th>
                <th>กำหนดชำระ</th>
                <th>รายการ</th>
                <th>หมวดหมู่</th>
                <th className="text-right">จำนวนเงิน</th>
                <th className="text-center">สถานะบิล</th>
                <th className="text-right" style={{ width: '80px' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {sortedCosts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center text-muted" style={{ padding: '3rem 1rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📅</div>
                    <div style={{ fontWeight: 600 }}>ยังไม่มีรายการฟิกคอสประจำเดือน</div>
                    <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                      กดปุ่ม "+ เพิ่มฟิกคอส" เพื่อบันทึกค่าใช้จ่ายคงที่ของคุณ
                    </div>
                  </td>
                </tr>
              ) : (
                sortedCosts.map(fc => (
                  <tr key={fc.id} style={{ opacity: fc.isPaid ? 0.75 : 1 }}>
                    <td className="text-center">
                      <input
                        type="checkbox"
                        checked={fc.isPaid}
                        onChange={() => toggleFixedCostPaid(fc.id)}
                        style={{
                          cursor: 'pointer',
                          width: '18px',
                          height: '18px',
                          accentColor: 'var(--primary)'
                        }}
                      />
                    </td>
                    <td className="num-font font-semibold text-sm" style={{ whiteSpace: 'nowrap' }}>
                      ทุกวันที่ {fc.dueDay}
                    </td>
                    <td>
                      <div
                        style={{
                          fontWeight: 600,
                          color: 'var(--text-main)',
                          textDecoration: fc.isPaid ? 'line-through' : 'none'
                        }}
                      >
                        {fc.title}
                      </div>
                      <div className="text-xs text-muted flex items-center gap-1 mt-1">
                        {fc.note && <span>{fc.note}</span>}
                        {fc.autoDeduct && (
                          <span
                            style={{
                              fontSize: '0.7rem',
                              background: 'var(--bg-subtle)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              border: '1px solid var(--border-light)',
                              color: 'var(--text-muted)'
                            }}
                          >
                            ⚡ หักอัตโนมัติ
                          </span>
                        )}
                      </div>
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
                        {fc.category}
                      </span>
                    </td>
                    <td className="text-right num-font font-bold text-main">
                      {formatCurrency(fc.amount)}
                    </td>
                    <td className="text-center">
                      {fc.isPaid ? (
                        <span className="badge badge-paid">✓ ชำระแล้ว</span>
                      ) : (
                        <span className="badge badge-unpaid">⏳ รอชำระ</span>
                      )}
                    </td>
                    <td className="text-right">
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleDelete(fc.id, fc.title)}
                        title="ลบรายการ"
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
    </div>
  );
};
