import React, { useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import { formatCurrency, formatDate, formatMonthKey, getCurrentMonthPrefix } from '../../shared/formatters';
import { addMonths } from '../fixed-costs/fixedCostPeriod';
import { ThaiDatePicker, ThaiMonthPicker } from '../../components/ThaiDatePicker';
import { Search, Plus, Trash2, Download, ReceiptText, X, ChevronLeft, ChevronRight } from 'lucide-react';

// 'month' = รายเดือน (ค่าเริ่มต้น: เดือนปัจจุบัน), 'range' = ช่วงวันที่, 'all' = ทั้งหมด
const matchPeriod = (date, { periodMode, month, startDate, endDate }) => {
  const d = date || '';
  if (periodMode === 'month') return d.startsWith(month);
  if (periodMode === 'range') return (!startDate || d >= startDate) && (!endDate || d <= endDate);
  return true;
};

export const TransactionsTab = () => {
  const {
    transactions,
    deleteTransaction,
    setIsAddTxOpen,
    exportTransactionsCSV
  } = useWallet();

  const currentMonth = getCurrentMonthPrefix();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [periodMode, setPeriodMode] = useState('month');
  const [month, setMonth] = useState(currentMonth);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const period = { periodMode, month, startDate, endDate };
  const periodLabel =
    periodMode === 'month'
      ? `เดือน ${formatMonthKey(month)}`
      : periodMode === 'range'
        ? `${startDate ? formatDate(startDate) : 'เริ่มต้น'} – ${endDate ? formatDate(endDate) : 'ปัจจุบัน'}`
        : 'ทุกช่วงเวลา';

  const resetFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setPeriodMode('month');
    setMonth(currentMonth);
    setStartDate('');
    setEndDate('');
  };

  const filteredTransactions = transactions.filter(t => {
    if (!matchPeriod(t.date, period)) return false;
    const matchType = filterType === 'all' || t.type === filterType;
    const term = searchTerm.toLowerCase().trim();
    const matchSearch =
      !term ||
      (t.category || '').toLowerCase().includes(term) ||
      (t.note || '').toLowerCase().includes(term) ||
      (t.paymentMethod || '').toLowerCase().includes(term) ||
      (t.date || '').includes(term);

    return matchType && matchSearch;
  });

  const handleDelete = (id, category) => {
    if (window.confirm(`ต้องการลบรายการ "${category}" ใช่หรือไม่?`)) {
      deleteTransaction(id);
    }
  };

  return (
    <div className="tab-panel active">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <div>
          <h2>📝 บันทึกรายรับ-รายจ่าย (Transactions)</h2>
          <p>บันทึกธุรกรรมทางการเงิน จัดการประวัติการใช้จ่าย และค้นหารายการย้อนหลัง</p>
        </div>
        <div className="flex gap-2">
          <button
            className="btn btn-outline btn-sm"
            onClick={exportTransactionsCSV}
            title="ส่งออกไฟล์ CSV"
          >
            <Download size={14} />
            <span>ส่งออก CSV</span>
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setIsAddTxOpen(true)}
          >
            <Plus size={14} />
            <span>บันทึกรายการ</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar Card */}
      <div className="card mb-4" style={{ padding: '1rem 1.25rem' }}>
        <div className="flex gap-3 flex-wrap items-center justify-between">
          <div className="flex gap-3 flex-1 flex-wrap" style={{ minWidth: '280px' }}>
            {/* Search Input */}
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
                placeholder="ค้นหาตามหมวดหมู่, หมายเหตุ, ช่องทางชำระ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filter Type */}
            <div style={{ width: '180px' }}>
              <select
                className="form-select"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">🔍 ทุกประเภท</option>
                <option value="income">💰 รายรับ (Income)</option>
                <option value="expense">💳 รายจ่าย (Expense)</option>
                <option value="fixed">🗓️ ฟิกคอส (Fixed Cost)</option>
                <option value="savings">🎯 ออม/ลงทุน (Savings)</option>
              </select>
            </div>
          </div>

          <div className="text-xs text-muted">
            {periodLabel} · พบ <b className="num-font text-main">{filteredTransactions.length}</b> รายการ
          </div>
        </div>

        {/* Period filter: current month by default, browse back by month or date range */}
        <div
          className="flex gap-2 flex-wrap items-center"
          style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)' }}
        >
          <div style={{ width: '160px' }}>
            <select
              className="form-select"
              value={periodMode}
              onChange={(e) => setPeriodMode(e.target.value)}
              aria-label="ช่วงเวลา"
            >
              <option value="month">📅 รายเดือน</option>
              <option value="range">🗓️ ช่วงวันที่</option>
              <option value="all">♾️ ทั้งหมด</option>
            </select>
          </div>

          {periodMode === 'month' && (
            <>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setMonth(addMonths(month, -1))}
                title="เดือนก่อนหน้า"
                aria-label="เดือนก่อนหน้า"
              >
                <ChevronLeft size={14} />
              </button>
              <ThaiMonthPicker
                style={{ width: '180px' }}
                value={month}
                onChange={(v) => setMonth(v || currentMonth)}
                ariaLabel="เลือกเดือน"
              />
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setMonth(addMonths(month, 1))}
                disabled={month >= currentMonth}
                title="เดือนถัดไป"
                aria-label="เดือนถัดไป"
              >
                <ChevronRight size={14} />
              </button>
              {month !== currentMonth && (
                <button className="btn btn-ghost btn-sm" onClick={() => setMonth(currentMonth)}>
                  เดือนปัจจุบัน
                </button>
              )}
            </>
          )}

          {periodMode === 'range' && (
            <>
              <ThaiDatePicker
                style={{ width: '170px' }}
                value={startDate}
                max={endDate || undefined}
                onChange={setStartDate}
                placeholder="ตั้งแต่วันที่"
                ariaLabel="ตั้งแต่วันที่"
                allowClear
              />
              <span className="text-muted text-sm">ถึง</span>
              <ThaiDatePicker
                style={{ width: '170px' }}
                value={endDate}
                min={startDate || undefined}
                onChange={setEndDate}
                placeholder="ถึงวันที่"
                ariaLabel="ถึงวันที่"
                allowClear
              />
            </>
          )}
        </div>
      </div>

      {/* Transactions Table Card */}
      <div className="card">
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>วันที่</th>
                <th>ประเภท</th>
                <th>หมวดหมู่</th>
                <th>ช่องทางชำระ</th>
                <th>หมายเหตุ</th>
                <th className="text-right">จำนวนเงิน</th>
                <th className="text-right" style={{ width: '80px' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center text-muted" style={{ padding: '3rem 1rem' }}>
                    {transactions.length === 0 ? (
                      <>
                        <div className="tx-empty-icon">
                          <ReceiptText size={22} />
                        </div>
                        <div className="text-main" style={{ fontWeight: 600 }}>เริ่มบันทึกรายการแรกของคุณ</div>
                        <div style={{ fontSize: '0.85rem', margin: '4px 0 1rem' }}>
                          บันทึกรายรับหรือรายจ่าย แล้วภาพรวมกับรายงานจะคำนวณให้อัตโนมัติ
                        </div>
                        <button className="btn btn-primary btn-sm" onClick={() => setIsAddTxOpen(true)}>
                          <Plus size={14} />
                          <span>บันทึกรายการแรก</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="tx-empty-icon">
                          <Search size={22} />
                        </div>
                        <div className="text-main" style={{ fontWeight: 600 }}>ไม่พบรายการใน{periodLabel}</div>
                        <div style={{ fontSize: '0.85rem', margin: '4px 0 1rem' }}>
                          ลองเปลี่ยนช่วงเวลา คำค้นหา หรือประเภทรายการ
                        </div>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={resetFilters}
                        >
                          <X size={14} />
                          <span>ล้างตัวกรอง</span>
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(t => {
                  let typeBadge = <span className="badge badge-expense">รายจ่าย</span>;
                  let amountColor = 'text-danger font-semibold';
                  let sign = '-';

                  if (t.type === 'income') {
                    typeBadge = <span className="badge badge-income">รายรับ</span>;
                    amountColor = 'text-success font-semibold';
                    sign = '+';
                  } else if (t.type === 'fixed') {
                    typeBadge = <span className="badge badge-fixed">ฟิกคอส</span>;
                    amountColor = 'text-warning font-semibold';
                  } else if (t.type === 'savings') {
                    typeBadge = <span className="badge badge-savings">ออม/ลงทุน</span>;
                    amountColor = 'text-info font-semibold';
                  }

                  return (
                    <tr key={t.id}>
                      <td className="num-font text-xs text-muted" style={{ whiteSpace: 'nowrap' }}>
                        {formatDate(t.date)}
                      </td>
                      <td>{typeBadge}</td>
                      <td style={{ fontWeight: 600 }}>
                        {t.category}
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: '0.8rem',
                            background: 'var(--bg-subtle)',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            border: '1px solid var(--border-light)'
                          }}
                        >
                          {t.paymentMethod || 'ไม่ระบุ'}
                        </span>
                      </td>
                      <td className="text-sm text-muted" style={{ maxWidth: '240px' }}>
                        {t.note || '-'}
                      </td>
                      <td className={`text-right num-font ${amountColor}`}>
                        {sign}{formatCurrency(t.amount)}
                      </td>
                      <td className="text-right">
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleDelete(t.id, t.category)}
                          title="ลบรายการ"
                          style={{ color: 'var(--danger)' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
