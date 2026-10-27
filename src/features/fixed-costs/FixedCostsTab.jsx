import React, { useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import { StatCard } from '../../components/StatCard';
import { formatCurrency, getCurrentMonthPrefix } from '../../shared/formatters';
import { describeFixedCostPeriod, isFixedCostActiveInMonth } from './fixedCostPeriod';
import {
  CalendarDays,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Pencil,
  Percent,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X
} from 'lucide-react';

const PAGE_SIZE = 20;

// 'all' = ทุกรายการ, 'month' = มีผลในเดือนที่เลือก, 'upcoming' = ยังไม่เริ่ม, 'ended' = สิ้นสุดแล้ว (เทียบเดือนนี้)
const matchPeriod = (fc, periodMode, month, currentMonth) => {
  if (periodMode === 'month') return isFixedCostActiveInMonth(fc, month);
  if (periodMode === 'upcoming') return !!fc.startMonth && fc.startMonth > currentMonth;
  if (periodMode === 'ended') return !!fc.endMonth && fc.endMonth < currentMonth;
  return true;
};

export const FixedCostsTab = () => {
  const {
    fixedCosts,
    allocationSettings,
    setIsAddFixedCostOpen,
    setEditingFixedCost,
    toggleFixedCostPaid,
    deleteFixedCost,
    resetFixedCostsMonthly
  } = useWallet();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [periodMode, setPeriodMode] = useState('all');
  const [periodMonth, setPeriodMonth] = useState(getCurrentMonthPrefix);
  const [page, setPage] = useState(1);

  // เปลี่ยนตัวกรองแล้วกลับไปหน้าแรกเสมอ
  const updateFilter = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const monthlyIncome = Number(allocationSettings.monthlyIncome) || 0;

  const currentMonth = getCurrentMonthPrefix();
  // ยอดรวมนับเฉพาะรายการที่อยู่ในระยะเวลาของเดือนนี้ (รายการที่ยังไม่เริ่ม/สิ้นสุดแล้วยังแสดงในตาราง)
  const activeCosts = fixedCosts.filter(c => isFixedCostActiveInMonth(c, currentMonth));
  const totalAmount = activeCosts.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const paidAmount = activeCosts.filter(c => c.isPaid).reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const unpaidAmount = totalAmount - paidAmount;
  const burdenRatio = monthlyIncome > 0 ? (totalAmount / monthlyIncome) * 100 : 0;

  let ratioColorClass = 'text-success';
  let ratioDesc = 'สัดส่วนเหมาะสม (ต่ำกว่า 40%)';
  if (monthlyIncome <= 0) {
    ratioColorClass = 'text-muted';
    ratioDesc = 'กรอกรายได้ต่อเดือนในแท็บแบ่งสัดส่วนเพื่อคำนวณ';
  } else if (burdenRatio > 50) {
    ratioColorClass = 'text-danger';
    ratioDesc = 'ภาระตึงตัวสูง (เกิน 50% ของรายได้)';
  } else if (burdenRatio > 40) {
    ratioColorClass = 'text-warning';
    ratioDesc = 'เริ่มตึงตัว (40% - 50% ของรายได้)';
  }

  const categoryOptions = [...new Set(fixedCosts.map(c => c.category).filter(Boolean))].sort();
  const term = searchTerm.toLowerCase().trim();
  const filteredCosts = fixedCosts
    .filter(c =>
      matchPeriod(c, periodMode, periodMonth, currentMonth) &&
      (filterCategory === 'all' || c.category === filterCategory) &&
      (!term || (c.title || '').toLowerCase().includes(term) || (c.note || '').toLowerCase().includes(term))
    )
    .sort((a, b) => (a.dueDay || 1) - (b.dueDay || 1));

  const totalPages = Math.max(1, Math.ceil(filteredCosts.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageCosts = filteredCosts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const isFiltered = !!term || filterCategory !== 'all' || periodMode !== 'all';
  // ข้อความระยะเวลาอ้างอิงเดือนที่กรอง เพื่อให้เห็นว่าเดือนนั้นเป็นงวดที่เท่าไหร่
  const describeMonth = periodMode === 'month' ? periodMonth : currentMonth;

  const resetFilters = () => {
    setSearchTerm('');
    setFilterCategory('all');
    setPeriodMode('all');
    setPeriodMonth(currentMonth);
    setPage(1);
  };

  const handleEdit = (fc) => {
    setEditingFixedCost(fc);
    setIsAddFixedCostOpen(true);
  };

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
          subtext={`${activeCosts.filter(c => c.isPaid).length} รายการ`}
          icon={CheckCircle}
          colorScheme="emerald"
          valueClass="text-success"
        />

        <StatCard
          label="ยอดที่ยังรอชำระ"
          value={formatCurrency(unpaidAmount)}
          subtext={`${activeCosts.filter(c => !c.isPaid).length} รายการ`}
          icon={Clock}
          colorScheme="rose"
          valueClass="text-danger"
        />

        <StatCard
          label="Fixed Cost Burden Ratio"
          value={monthlyIncome > 0 ? `${burdenRatio.toFixed(1)}%` : '-'}
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
          <div className="text-xs text-muted">
            พบ <b className="num-font text-main">{filteredCosts.length}</b> จาก {fixedCosts.length} รายการ
          </div>
        </div>

        {/* Filters: title, category, period */}
        <div className="flex gap-2 flex-wrap items-center mb-3">
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search
              size={16}
              color="var(--text-muted)"
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '34px' }}
              placeholder="ค้นหาชื่อรายการ, บันทึก..."
              value={searchTerm}
              onChange={(e) => updateFilter(setSearchTerm)(e.target.value)}
              aria-label="ค้นหาชื่อรายการ"
            />
          </div>

          <div style={{ width: '220px' }}>
            <select
              className="form-select"
              value={filterCategory}
              onChange={(e) => updateFilter(setFilterCategory)(e.target.value)}
              aria-label="หมวดหมู่"
            >
              <option value="all">🏷️ ทุกหมวดหมู่</option>
              {categoryOptions.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div style={{ width: '190px' }}>
            <select
              className="form-select"
              value={periodMode}
              onChange={(e) => updateFilter(setPeriodMode)(e.target.value)}
              aria-label="ช่วงเวลา"
            >
              <option value="all">♾️ ทุกช่วงเวลา</option>
              <option value="month">📅 มีผลในเดือน...</option>
              <option value="upcoming">⏭️ ยังไม่เริ่ม</option>
              <option value="ended">🏁 สิ้นสุดแล้ว</option>
            </select>
          </div>

          {periodMode === 'month' && (
            <input
              type="month"
              className="form-input num-font"
              style={{ width: '170px' }}
              value={periodMonth}
              onChange={(e) => updateFilter(setPeriodMonth)(e.target.value || currentMonth)}
              aria-label="เลือกเดือน"
            />
          )}

          {isFiltered && (
            <button className="btn btn-ghost btn-sm" onClick={resetFilters}>
              <X size={14} />
              <span>ล้างตัวกรอง</span>
            </button>
          )}
        </div>

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '45px', textAlign: 'center' }}>สถานะ</th>
                <th>กำหนดชำระ</th>
                <th>รายการ</th>
                <th>หมวดหมู่</th>
                <th>ระยะเวลา</th>
                <th className="text-right">จำนวนเงิน</th>
                <th className="text-center">สถานะบิล</th>
                <th className="text-right" style={{ width: '100px' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {pageCosts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center text-muted" style={{ padding: '3rem 1rem' }}>
                    {fixedCosts.length === 0 ? (
                      <>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📅</div>
                        <div style={{ fontWeight: 600 }}>ยังไม่มีรายการฟิกคอสประจำเดือน</div>
                        <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                          กดปุ่ม "+ เพิ่มฟิกคอส" เพื่อบันทึกค่าใช้จ่ายคงที่ของคุณ
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontWeight: 600 }}>ไม่พบรายการที่ตรงกับตัวกรอง</div>
                        <button className="btn btn-outline btn-sm mt-2" onClick={resetFilters}>
                          <X size={14} />
                          <span>ล้างตัวกรอง</span>
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ) : (
                pageCosts.map(fc => (
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
                    <td className="text-sm text-muted" style={{ whiteSpace: 'nowrap' }}>
                      {describeFixedCostPeriod(fc, describeMonth)}
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
                    <td className="text-right" style={{ whiteSpace: 'nowrap' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleEdit(fc)}
                        title="แก้ไขรายการ"
                        aria-label={`แก้ไข ${fc.title}`}
                      >
                        <Pencil size={16} />
                      </button>
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

        {/* Paging: ไม่เกิน PAGE_SIZE รายการต่อหน้า */}
        {filteredCosts.length > PAGE_SIZE && (
          <div className="flex justify-between items-center flex-wrap gap-2 mt-3">
            <div className="text-xs text-muted">
              แสดง {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredCosts.length)} จาก{' '}
              {filteredCosts.length} รายการ
            </div>
            <div className="flex items-center gap-1">
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage <= 1}
                aria-label="หน้าก่อนหน้า"
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  className={`btn btn-sm ${p === currentPage ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setPage(p)}
                  aria-current={p === currentPage ? 'page' : undefined}
                >
                  {p}
                </button>
              ))}
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                aria-label="หน้าถัดไป"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
