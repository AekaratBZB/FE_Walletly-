import React from 'react';
import { useWallet } from '../../context/WalletContext';
import { formatCurrency } from '../../shared/formatters';
import {
  outstandingBalance,
  periodsRemaining,
  hirePurchaseRebate,
  rebateDecayPerMonth
} from './engine/debtMath';
import { findDebtCandidates } from './debtStorage';
import { Landmark, Plus, Pencil, Trash2, Info } from 'lucide-react';

const TYPE_BADGE = {
  amortizing: { label: 'ลดต้นลดดอก', className: 'badge badge-expense' },
  hirePurchase: { label: 'เช่าซื้อ', className: 'badge badge-fixed' },
  installment: { label: 'ผ่อน 0%', className: 'badge badge-savings' }
};

const DebtRow = ({ debt, onEdit, onDelete }) => {
  const badge = TYPE_BADGE[debt.type] || TYPE_BADGE.amortizing;
  const rebate = debt.type === 'hirePurchase' ? hirePurchaseRebate(debt) : null;
  const decay = debt.type === 'hirePurchase' ? rebateDecayPerMonth(debt) : null;

  return (
    <tr>
      <td>
        <div className="font-semibold text-sm text-main">{debt.name}</div>
        <div className="flex gap-2 items-center mt-1 flex-wrap">
          <span className={badge.className}>{badge.label}</span>
          {debt.type === 'amortizing' && (
            <span className="text-xs text-muted num-font">
              {debt.annualRatePct}% ต่อปี
            </span>
          )}
          {debt.type !== 'amortizing' && (
            <span className="text-xs text-muted num-font">
              เหลือ {periodsRemaining(debt)} งวด
            </span>
          )}
          {debt.type === 'amortizing' && !debt.acceptsEarlyPayment && (
            <span className="text-xs text-warning">ชำระปีละครั้ง</span>
          )}
        </div>

        {debt.type === 'hirePurchase' && rebate === null && (
          <div className="text-xs text-warning mt-1">
            ขอใบเสนอปิดบัญชีจากเจ้าหนี้ เพื่อรู้ส่วนลดที่ได้จริง
          </div>
        )}
        {debt.type === 'hirePurchase' && rebate !== null && (
          <div className="text-xs text-muted mt-1 num-font">
            ปิดบัญชีวันนี้ประหยัด {formatCurrency(Math.round(rebate))}
            {decay !== null && (
              <> · ส่วนลดหดเดือนละ {formatCurrency(Math.round(decay))}</>
            )}
          </div>
        )}
        {debt.type === 'installment' && (
          <div className="text-xs text-subtle mt-1">
            0% — โปะก่อนกำหนดไม่ประหยัดดอกเบี้ย
          </div>
        )}
      </td>

      {/* Amortizing debts have no contractual monthly payment in this model —
          what they receive each month comes out of the simulation. */}
      <td className="text-right num-font text-sm">
        {debt.monthlyPayment
          ? formatCurrency(Math.round(debt.monthlyPayment))
          : '-'}
      </td>

      <td className="text-right num-font font-bold text-sm text-danger">
        {formatCurrency(Math.round(outstandingBalance(debt)))}
      </td>

      <td className="text-right">
        <div className="flex gap-1 justify-end">
          <button
            className="btn btn-ghost btn-sm"
            title="แก้ไข"
            onClick={() => onEdit(debt)}
          >
            <Pencil size={14} />
          </button>
          <button
            className="btn btn-ghost btn-sm"
            title="ลบ"
            onClick={() => onDelete(debt.id)}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
};

export const DebtListPanel = () => {
  const { debts, fixedCosts, openAddDebt, deleteDebt } = useWallet();
  const openDebts = debts.filter((d) => !d.isClosed);
  const candidates = findDebtCandidates(fixedCosts);

  return (
    <div className="card" style={{ gridColumn: 'span 2' }}>
      <div className="card-header">
        <div>
          <div className="card-title">
            <Landmark size={18} />
            <span>รายการหนี้ในแผน</span>
          </div>
          <div className="card-subtitle">
            หนี้แต่ละประเภทคิดดอกเบี้ยไม่เหมือนกัน เลือกประเภทให้ตรงกับสัญญาจริง
          </div>
        </div>

        <button className="btn btn-primary btn-sm" onClick={() => openAddDebt()}>
          <Plus size={16} />
          <span>เพิ่มหนี้</span>
        </button>
      </div>

      {candidates.length > 0 && (
        <div
          className="mb-3 p-3 flex justify-between items-center gap-3 flex-wrap"
          style={{
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)'
          }}
        >
          <div className="flex gap-2 items-start">
            <Info size={16} className="text-info" />
            <div className="text-xs text-main">
              เจอ {candidates.length} รายการหมวดชำระหนี้สินในแท็บฟิกคอส —
              เพิ่มเข้าแผนปลอดหนี้ไหม? ต้องกรอกอัตราดอกเบี้ยและเงินต้นเพิ่มเอง
              เพราะฟิกคอสไม่ได้เก็บไว้
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {candidates.map((fc) => (
              <button
                key={fc.id}
                className="btn btn-outline btn-sm"
                onClick={() =>
                  openAddDebt(null, {
                    name: fc.title,
                    monthlyPayment: Number(fc.amount) || 0
                  })
                }
              >
                <Plus size={13} />
                <span>{fc.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {openDebts.length === 0 ? (
        <div className="p-6 text-center">
          <div className="font-bold text-base mb-1">ยังไม่มีรายการหนี้ในแผน</div>
          <p className="text-xs text-muted">
            เพิ่มหนี้ก้อนแรกเพื่อเริ่มคำนวณวันปลอดหนี้
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>หนี้</th>
                <th className="text-right">ค่างวด/เดือน</th>
                <th className="text-right">ยอดคงเหลือ</th>
                <th className="text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {openDebts.map((debt) => (
                <DebtRow
                  key={debt.id}
                  debt={debt}
                  onEdit={(d) => openAddDebt(d)}
                  onDelete={deleteDebt}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
