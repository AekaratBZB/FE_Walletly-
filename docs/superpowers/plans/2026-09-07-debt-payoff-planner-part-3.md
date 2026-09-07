# Debt Payoff Planner Implementation Plan — Part 3 (debt CRUD and schedule table)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

Continues `docs/superpowers/plans/2026-09-07-debt-payoff-planner-part-2.md`.
Tasks 1–7 must be complete and `npm test` green before starting here.

Task 9 completes UI phase 1 — the working vertical slice.

**Global Constraints:** as stated in Part 1.

---

### Task 8: `AddDebtModal.jsx` and `DebtListPanel.jsx`

**Files:**
- Create: `src/features/debt/AddDebtModal.jsx`
- Create: `src/features/debt/DebtListPanel.jsx`
- Modify: `src/features/debt/DebtTab.jsx`
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `Modal` from `src/components/Modal.jsx` (props `isOpen`, `onClose`, `title`, `children`, `footer`, `maxWidth`); `debts`, `isAddDebtOpen`, `editingDebt`, `debtDraft`, `openAddDebt`, `closeAddDebt`, `saveDebt`, `deleteDebt` from `useWallet()` (Task 5); `outstandingBalance`, `periodsRemaining`, `hirePurchaseRebate`, `rebateDecayPerMonth` from `engine/debtMath.js` (Task 1); `findDebtCandidates`, `DEBT_FIXED_COST_CATEGORY` from `debtStorage.js` (Task 5)
- Produces: `<AddDebtModal />` and `<DebtListPanel />`, both propless — they read the context themselves

- [ ] **Step 1: Write `AddDebtModal.jsx`**

Create `src/features/debt/AddDebtModal.jsx`:

```jsx
import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/Modal';
import { useWallet } from '../../context/WalletContext';

const EMPTY = {
  name: '',
  type: 'amortizing',
  principal: 0,
  accruedInterest: 0,
  annualRatePct: 0,
  frequency: 'monthly',
  annualDueMonth: null,
  acceptsEarlyPayment: true,
  minimumPayment: { mode: 'none', amount: 0, percent: 8, floor: 500 },
  monthlyPayment: 0,
  periodsPaid: 0,
  periodsTotal: 0,
  settlementQuote: null,
  settlementQuoteDate: null
};

const TYPE_LABELS = {
  amortizing: 'สินเชื่อลดต้นลดดอก (บ้าน/บุคคล/บัตรเครดิต)',
  hirePurchase: 'เช่าซื้อ (รถยนต์/มอเตอร์ไซค์)',
  installment: 'ผ่อนสินค้า 0% (มือถือ/เครื่องใช้ไฟฟ้า)'
};

export const AddDebtModal = () => {
  const { isAddDebtOpen, editingDebt, debtDraft, closeAddDebt, saveDebt } = useWallet();
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (!isAddDebtOpen) return;
    if (editingDebt) {
      setForm({ ...EMPTY, ...editingDebt, minimumPayment: { ...EMPTY.minimumPayment, ...(editingDebt.minimumPayment || {}) } });
    } else {
      setForm({ ...EMPTY, ...(debtDraft || {}) });
    }
  }, [isAddDebtOpen, editingDebt, debtDraft]);

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));
  const setMin = (patch) =>
    setForm((prev) => ({ ...prev, minimumPayment: { ...prev.minimumPayment, ...patch } }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    saveDebt({ ...form, name: form.name.trim() });
  };

  const isAmortizing = form.type === 'amortizing';
  const isHirePurchase = form.type === 'hirePurchase';

  return (
    <Modal
      isOpen={isAddDebtOpen}
      onClose={closeAddDebt}
      title={editingDebt ? 'แก้ไขรายการหนี้' : 'เพิ่มรายการหนี้'}
      maxWidth="640px"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={closeAddDebt}>
            ยกเลิก
          </button>
          <button type="submit" className="btn btn-primary" form="debt-form">
            {editingDebt ? 'บันทึกการแก้ไข' : 'เพิ่มหนี้'}
          </button>
        </>
      }
    >
      <form id="debt-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">ชื่อหนี้ *</label>
          <input
            type="text"
            className="form-input"
            placeholder="เช่น สินเชื่อบ้าน, บัตรเครดิต KTC, ผ่อน iPhone"
            value={form.name}
            onChange={(e) => set({ name: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">ประเภทหนี้ *</label>
          <select
            className="form-select"
            value={form.type}
            onChange={(e) => set({ type: e.target.value })}
          >
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <div className="text-xs text-subtle mt-1">
            {isAmortizing &&
              'ดอกเบี้ยเดินทุกเดือนบนเงินต้นคงเหลือ — โปะแล้วดอกงวดถัดไปลดทันที'}
            {isHirePurchase &&
              'ดอกเบี้ยถูกอัดไว้ในสัญญาแล้ว ยอดไม่คิดใหม่ — ปิดก่อนกำหนดได้ส่วนลดตามใบเสนอของเจ้าหนี้เท่านั้น'}
            {form.type === 'installment' &&
              'ผ่อน 0% — โปะก่อนกำหนดไม่ประหยัดดอกเบี้ยเลย'}
          </div>
        </div>

        {isAmortizing && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label className="form-label">เงินต้นคงเหลือ (บาท) *</label>
                <input
                  type="number"
                  className="form-input num-font"
                  step="any"
                  value={form.principal}
                  onChange={(e) => set({ principal: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">อัตราดอกเบี้ย (% ต่อปี) *</label>
                <input
                  type="number"
                  className="form-input num-font"
                  step="any"
                  value={form.annualRatePct}
                  onChange={(e) => set({ annualRatePct: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">ดอกเบี้ยค้างชำระ (บาท)</label>
              <input
                type="number"
                className="form-input num-font"
                step="any"
                value={form.accruedInterest}
                onChange={(e) => set({ accruedInterest: parseFloat(e.target.value) || 0 })}
              />
              <div className="text-xs text-subtle mt-1">
                ดอกเบี้ยที่ยังไม่ได้จ่ายและยกยอดมา ถ้าไม่มีให้ใส่ 0
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">ยอดชำระขั้นต่ำต่อเดือน</label>
              <select
                className="form-select mb-2"
                value={form.minimumPayment.mode}
                onChange={(e) => setMin({ mode: e.target.value })}
              >
                <option value="none">ไม่มีขั้นต่ำ (จ่ายเท่าที่เหลือ)</option>
                <option value="fixed">ค่างวดคงที่ตามสัญญา</option>
                <option value="percentOfBalance">
                  % ของยอดคงเหลือ (บัตรเครดิต/บัตรกดเงินสด)
                </option>
              </select>

              {form.minimumPayment.mode === 'fixed' && (
                <input
                  type="number"
                  className="form-input num-font"
                  step="any"
                  placeholder="8500"
                  value={form.minimumPayment.amount}
                  onChange={(e) => setMin({ amount: parseFloat(e.target.value) || 0 })}
                />
              )}

              {form.minimumPayment.mode === 'percentOfBalance' && (
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="form-label text-xs">% ของยอดคงเหลือ</label>
                    <input
                      type="number"
                      className="form-input num-font"
                      step="any"
                      value={form.minimumPayment.percent}
                      onChange={(e) => setMin({ percent: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="form-label text-xs">ขั้นต่ำเป็นบาท</label>
                    <input
                      type="number"
                      className="form-input num-font"
                      step="any"
                      value={form.minimumPayment.floor}
                      onChange={(e) => setMin({ floor: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">รูปแบบการชำระ</label>
              <select
                className="form-select"
                value={form.acceptsEarlyPayment ? 'monthly' : 'annual'}
                onChange={(e) => {
                  const monthly = e.target.value === 'monthly';
                  set({
                    acceptsEarlyPayment: monthly,
                    frequency: monthly ? 'monthly' : 'annual',
                    annualDueMonth: monthly ? null : form.annualDueMonth || 6
                  });
                }}
              >
                <option value="monthly">ชำระได้ทุกเดือน / โปะก่อนกำหนดได้</option>
                <option value="annual">
                  ชำระปีละครั้ง — เงินกองไว้จนถึงเดือนครบกำหนด
                </option>
              </select>
              <div className="text-xs text-subtle mt-1">
                แบบปีละครั้ง ดอกเบี้ยยังเดินทุกเดือนระหว่างที่เงินกองอยู่
                ผลลัพธ์จึงแย่กว่าชำระรายเดือนเสมอ
              </div>
            </div>

            {!form.acceptsEarlyPayment && (
              <div className="form-group">
                <label className="form-label">เดือนที่ครบกำหนดชำระ *</label>
                <select
                  className="form-select"
                  value={form.annualDueMonth || 6}
                  onChange={(e) =>
                    set({ annualDueMonth: parseInt(e.target.value, 10) || 6 })
                  }
                >
                  {[
                    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
                    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
                  ].map((label, i) => (
                    <option key={i} value={i + 1}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}

        {!isAmortizing && (
          <>
            <div className="form-group">
              <label className="form-label">ค่างวดต่อเดือน (บาท) *</label>
              <input
                type="number"
                className="form-input num-font"
                step="any"
                value={form.monthlyPayment}
                onChange={(e) => set({ monthlyPayment: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label className="form-label">งวดที่จ่ายไปแล้ว *</label>
                <input
                  type="number"
                  className="form-input num-font"
                  min="0"
                  value={form.periodsPaid}
                  onChange={(e) => set({ periodsPaid: parseInt(e.target.value, 10) || 0 })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">จำนวนงวดทั้งหมด *</label>
                <input
                  type="number"
                  className="form-input num-font"
                  min="0"
                  value={form.periodsTotal}
                  onChange={(e) => set({ periodsTotal: parseInt(e.target.value, 10) || 0 })}
                  required
                />
              </div>
            </div>

            {isHirePurchase && (
              <>
                <div className="form-group">
                  <label className="form-label">ยอดปิดบัญชีจากเจ้าหนี้ (บาท)</label>
                  <input
                    type="number"
                    className="form-input num-font"
                    step="any"
                    placeholder="เว้นว่างได้ถ้ายังไม่มีใบเสนอ"
                    value={form.settlementQuote === null ? '' : form.settlementQuote}
                    onChange={(e) =>
                      set({
                        settlementQuote:
                          e.target.value === '' ? null : parseFloat(e.target.value) || 0
                      })
                    }
                  />
                  <div className="text-xs text-subtle mt-1">
                    ต้องเป็นตัวเลขจากใบเสนอปิดบัญชีของเจ้าหนี้เท่านั้น
                    ระบบไม่ประมาณค่านี้ให้ เพราะประมาณผิดแล้วพาตัดสินใจผิด
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">วันที่ในใบเสนอ</label>
                  <input
                    type="date"
                    className="form-input"
                    value={form.settlementQuoteDate || ''}
                    onChange={(e) => set({ settlementQuoteDate: e.target.value || null })}
                  />
                </div>
              </>
            )}
          </>
        )}
      </form>
    </Modal>
  );
};
```

- [ ] **Step 2: Write `DebtListPanel.jsx`**

Create `src/features/debt/DebtListPanel.jsx`:

```jsx
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
```

- [ ] **Step 3: Mount the panel in `DebtTab.jsx`**

In `src/features/debt/DebtTab.jsx`, add the import:

```jsx
import { DebtListPanel } from './DebtListPanel';
```

and replace the placeholder card added in Task 7 Step 2 so the grid reads exactly:

```jsx
      <div className="grid grid-cols-3 gap-6 mb-4">
        <BudgetProfilePanel />
        <DebtListPanel />
      </div>
```

Keep the `openDebts` line — `PayoffSummaryCards` still takes
`debtCount={openDebts.length}`. The empty-state card now lives inside
`DebtListPanel`, so there must be no `openDebts.length === 0` block left in
`DebtTab.jsx`; if one is still there from Task 6, delete it.

- [ ] **Step 4: Render the modal in `App.jsx`**

In `src/App.jsx`, add the import:

```js
import { AddDebtModal } from './features/debt/AddDebtModal';
```

and add `<AddDebtModal />` to the modal block, after `<QuickDepositModal />`:

```jsx
      <AddDebtModal />
```

- [ ] **Step 5: Verify CRUD end to end**

```bash
npm run build
```

Expected: build succeeds.

Then run `npm run dev` and, on the "ปลอดหนี้" tab:
1. Click "เพิ่มหนี้", pick ลดต้นลดดอก, enter name `สินเชื่อ ธ.ก.ส.`, principal
   `610000`, rate `6.575`, arrears `21306`, minimum `ไม่มีขั้นต่ำ`. Save.
   Expected: the row appears with a `6.575% ต่อปี` badge and a balance of
   `631,306 ฿`.
2. Add an installment debt: `มือถือ`, payment `856.90`, paid `0`, total `9`.
   Expected: balance `7,712 ฿`, `เหลือ 9 งวด`, and the 0% note.
3. Add a hire-purchase debt with the quote left blank. Expected: the row shows
   "ขอใบเสนอปิดบัญชีจากเจ้าหนี้" and **no** estimated rebate figure.
4. Edit that debt, enter a quote of `41000`. Expected: the row now shows a
   rebate and a per-month decay.
5. Delete a debt, then reload. Expected: the deletion persisted.

- [ ] **Step 6: Commit**

```bash
git add src/features/debt/AddDebtModal.jsx src/features/debt/DebtListPanel.jsx src/features/debt/DebtTab.jsx src/App.jsx
git commit -m "feat: add debt CRUD list and add/edit modal"
```

---

### Task 9: `ScheduleTable.jsx` — completes UI phase 1

**Files:**
- Create: `src/features/debt/ScheduleTable.jsx`
- Modify: `src/features/debt/DebtTab.jsx`

**Interfaces:**
- Consumes: a `Projection` (Task 2), `formatCurrency` and `formatMonthLabel` (Task 6)
- Produces: `<ScheduleTable projection />`

- [ ] **Step 1: Write the table**

Create `src/features/debt/ScheduleTable.jsx`:

```jsx
import React, { useState } from 'react';
import { formatCurrency, formatMonthLabel } from '../../shared/formatters';
import { CalendarRange } from 'lucide-react';

/**
 * The monthly schedule. Columns mirror MonthlyProjection exactly so the table
 * can be compared against the golden vectors by eye — it is the primary
 * debugging tool for the engine as well as a user-facing view.
 */
export const ScheduleTable = ({ projection }) => {
  const [limit, setLimit] = useState(24);
  const rows = projection.Months.slice(0, limit);

  if (!projection.Months.length) {
    return null;
  }

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">
            <CalendarRange size={18} />
            <span>ตารางจำลองรายเดือน</span>
          </div>
          <div className="card-subtitle">
            แถวสีอ่อนคือเดือนที่เงินต้นยังไม่ลด เพราะเงินที่จ่ายไปหมดกับดอกเบี้ยค้าง
          </div>
        </div>

        <div className="flex gap-2 items-center">
          <label className="text-xs text-muted">แสดง:</label>
          <select
            className="form-select"
            style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', width: '130px' }}
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value, 10))}
          >
            <option value="12">12 เดือนแรก</option>
            <option value="24">24 เดือนแรก</option>
            <option value="60">60 เดือนแรก</option>
            <option value="600">ทั้งหมด</option>
          </select>
        </div>
      </div>

      <div className="table-container" style={{ maxHeight: '520px', overflowY: 'auto' }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th>เดือน</th>
              <th className="text-right">ค่างวดผ่อน</th>
              <th className="text-right">เงินเหลือ</th>
              <th className="text-right">กองฉุกเฉิน</th>
              <th className="text-right">จ่ายหนี้</th>
              <th className="text-right">ดอกเบี้ยเดือนนี้</th>
              <th className="text-right">ดอกค้างสะสม</th>
              <th className="text-right">เงินต้นคงเหลือ</th>
              <th className="text-right">เพดานงบกินใช้</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => {
              // "Principal did not fall" is not the same as "payment did not
              // cover this month's interest" — a payment can exceed the month's
              // interest and still go entirely to clearing older arrears.
              // The honest signal is whether any principal was actually repaid.
              const principalRepaid = m.perDebt.reduce(
                (sum, d) => sum + d.principalPortion,
                0
              );
              const principalStuck = principalRepaid <= 0.005;
              const isArrearsCleared = projection.InterestArrearsClearedMonth === m.Index;
              // HeldForAnnualPayment is what was ADDED to holding pots this
              // month, not what remains in them — on the month a pot pays
              // out, the whole pot empties in the same row, so that field
              // would misreport cash as still set aside. Sum the per-debt
              // pot balances that actually remain at month end instead.
              const heldRemaining = m.perDebt.reduce((sum, d) => sum + d.held, 0);

              return (
                <tr
                  key={m.Index}
                  style={principalStuck ? { opacity: 0.62 } : undefined}
                >
                  <td className="text-xs num-font" style={{ whiteSpace: 'nowrap' }}>
                    {m.Index}. {formatMonthLabel(m.Month)}
                    {isArrearsCleared && (
                      <span className="badge badge-paid" style={{ marginLeft: '6px' }}>
                        ล้างดอกค้างหมด
                      </span>
                    )}
                  </td>
                  <td className="text-right num-font text-xs">
                    {formatCurrency(Math.round(m.InstallmentTotal))}
                  </td>
                  <td
                    className={`text-right num-font text-xs ${
                      m.Surplus < 0 ? 'text-danger font-bold' : ''
                    }`}
                  >
                    {formatCurrency(Math.round(m.Surplus))}
                  </td>
                  <td className="text-right num-font text-xs text-info">
                    {formatCurrency(Math.round(m.EmergencyContribution))}
                  </td>
                  <td className="text-right num-font text-xs text-success font-semibold">
                    {formatCurrency(Math.round(m.LoanPayment))}
                    {heldRemaining > 0.005 && (
                      <div className="text-xs text-warning">
                        กองไว้ {formatCurrency(Math.round(heldRemaining))}
                      </div>
                    )}
                  </td>
                  <td className="text-right num-font text-xs text-warning">
                    {formatCurrency(Math.round(m.InterestAccrued))}
                  </td>
                  <td className="text-right num-font text-xs">
                    {formatCurrency(Math.round(m.AccruedInterestBalance))}
                  </td>
                  <td className="text-right num-font text-xs font-bold">
                    {formatCurrency(Math.round(m.PrincipalBalance))}
                  </td>
                  <td className="text-right num-font text-xs text-muted">
                    {formatCurrency(Math.round(m.DiscretionaryCeiling))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-subtle mt-2">
        "เพดานงบกินใช้" คือระดับการใช้จ่ายที่หนี้หยุดลดในเดือนนั้น — เป็นขีดจำกัด ไม่ใช่เป้า
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Mount the table in `DebtTab.jsx`**

In `src/features/debt/DebtTab.jsx`, add the import:

```jsx
import { ScheduleTable } from './ScheduleTable';
```

and add it after the two-panel grid, as the last child of the tab panel:

```jsx
      <ScheduleTable projection={projection} />
```

- [ ] **Step 3: Verify phase 1 against the golden fixture by hand**

```bash
npm run build
```

Expected: build succeeds.

Then run `npm run dev` and enter the §8 fixture in the app:

Budget panel — income `29000`, extra income `0`, fixed expenses `7920.36`,
discretionary `5000`, emergency fund `8780`, target `40000`, contribution
`2000` with one step `เดือนที่ 3 → 3000`, buffer `1200` with one step
`เดือนที่ 2 → 0`, strategy Avalanche.

Debts — the amortizing loan (`610000` / `6.575` / arrears `21306` / no
minimum) plus `856.90 x 9`, `1699.00 x 6`, `1998.33 x 3`, `2496.66 x 2`,
`439.41 x 3` as installments and `3374.00 x 14` as hire purchase.

Expected in the table, matching the tests exactly:

| Row | Column | Value |
|---|---|---|
| 0 | ค่างวดผ่อน | 10,864 ฿ |
| 0 | เงินเหลือ | 5,215 ฿ |
| 0 | จ่ายหนี้ | 2,015 ฿ |
| 0 | ดอกค้างสะสม | 22,633 ฿ |
| 2 | ค่างวดผ่อน | 8,368 ฿ |
| 3 | จ่ายหนี้ | 7,150 ฿ |
| 7 | badge | ล้างดอกค้างหมด |
| 7 | เงินต้นคงเหลือ | 609,155 ฿ |
| 13 | — | กองฉุกเฉิน column is 0 and the fund has reached the target |
| 17 | ค่างวดผ่อน | 0 ฿ |

Summary cards: `MonthsToPayoff` 54 months, total interest `131,445 ฿`,
break-even `3,342 ฿/ด.`

Rows 0 to 6 must render dimmed (principal not falling); row 7 onward normal.

If any figure disagrees with the table above, the bug is in the UI wiring, not
the engine — the engine is already proven by `npm test`. Check that
`BudgetProfilePanel` is writing the schedule overrides in the
`{ fromMonth, amount }` shape.

- [ ] **Step 4: Run the full test suite once more**

```bash
npm test
```

Expected: PASS — nothing in phase 1 should have touched the engine.

- [ ] **Step 5: Commit**

```bash
git add src/features/debt/ScheduleTable.jsx src/features/debt/DebtTab.jsx
git commit -m "feat: add monthly payoff schedule table completing phase 1"
```

---

**UI phase 1 is now a working vertical slice.** Tasks 10 and 11 (amortization
chart, discretionary ceiling, what-if sliders, strategy panel) are specified in
`docs/superpowers/plans/2026-09-07-debt-payoff-planner-part-4.md`.
