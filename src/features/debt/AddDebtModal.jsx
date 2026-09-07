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

  /**
   * The form holds one flat object covering all three types, so switching type
   * mid-edit leaves the other type's fields populated. Nothing in the engine
   * reads them — it partitions on `type` alone — but a stale `monthlyPayment`
   * on an amortizing debt would show a figure in the list's "ค่างวด/เดือน"
   * column that no calculation ever uses. Keep only the fields the chosen type
   * actually owns.
   */
  const normalise = (d) => {
    const base = {
      id: d.id,
      name: d.name.trim(),
      type: d.type,
      isClosed: Boolean(d.isClosed)
    };

    if (d.type === 'amortizing') {
      return {
        ...base,
        principal: d.principal,
        accruedInterest: d.accruedInterest,
        annualRatePct: d.annualRatePct,
        frequency: d.frequency,
        annualDueMonth: d.acceptsEarlyPayment ? null : d.annualDueMonth,
        acceptsEarlyPayment: d.acceptsEarlyPayment,
        minimumPayment: d.minimumPayment
      };
    }

    const fixed = {
      ...base,
      monthlyPayment: d.monthlyPayment,
      periodsPaid: d.periodsPaid,
      periodsTotal: d.periodsTotal
    };

    return d.type === 'hirePurchase'
      ? {
          ...fixed,
          settlementQuote: d.settlementQuote,
          settlementQuoteDate: d.settlementQuoteDate
        }
      : fixed;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    saveDebt(normalise(form));
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
