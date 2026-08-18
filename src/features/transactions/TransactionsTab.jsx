import React, { useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import { formatCurrency, formatDate } from '../../shared/formatters';
import { Search, Plus, Trash2, Download } from 'lucide-react';

export const TransactionsTab = () => {
  const {
    transactions,
    deleteTransaction,
    setIsAddTxOpen,
    exportTransactionsCSV
  } = useWallet();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const filteredTransactions = transactions.filter(t => {
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
            <span>+ บันทึกรายการ</span>
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
            พบทั้งหมด <b className="num-font text-main">{filteredTransactions.length}</b> รายการ
          </div>
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
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📄</div>
                    <div style={{ fontWeight: 600 }}>ไม่พบรายการธุรกรรม</div>
                    <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                      กดปุ่ม "+ บันทึกรายการ" เพื่อเริ่มต้นบันทึกรายรับหรือรายจ่าย
                    </div>
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
                      <td style={{ fontWeight: 600 }}>{t.category}</td>
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
