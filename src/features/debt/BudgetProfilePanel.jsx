import React from 'react';
import { useWallet } from '../../context/WalletContext';
import { Wallet, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';

const NumberField = ({ label, hint, value, onChange }) => (
  <div className="form-group">
    <label className="form-label">{label}</label>
    <input
      type="number"
      className="form-input num-font"
      step="any"
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
    />
    {hint && <div className="text-xs text-subtle mt-1">{hint}</div>}
  </div>
);

/**
 * Stepped schedule editor. Used for the emergency contribution and the
 * short-term buffer, both of which change at known months — the golden fixture
 * needs 2,000 for months 0-2 then 3,000, and a buffer of 1,200 for months 0-1
 * then 0.
 */
const ScheduleEditor = ({ label, overrides, onChange }) => {
  const list = overrides || [];

  const update = (index, patch) => {
    onChange(list.map((o, i) => (i === index ? { ...o, ...patch } : o)));
  };

  return (
    <div className="form-group">
      <label className="form-label">{label}</label>

      {list.map((o, i) => (
        <div key={i} className="flex gap-2 items-center mb-2">
          <span className="text-xs text-muted" style={{ whiteSpace: 'nowrap' }}>
            ตั้งแต่เดือนที่
          </span>
          <input
            type="number"
            className="form-input num-font"
            style={{ width: '80px', padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
            min="0"
            value={o.fromMonth}
            onChange={(e) => update(i, { fromMonth: parseInt(e.target.value, 10) || 0 })}
          />
          <span className="text-xs text-muted">เป็น</span>
          <input
            type="number"
            className="form-input num-font"
            style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
            step="any"
            value={o.amount}
            onChange={(e) => update(i, { amount: parseFloat(e.target.value) || 0 })}
          />
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            title="ลบขั้นนี้"
            onClick={() => onChange(list.filter((_, idx) => idx !== i))}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}

      <button
        type="button"
        className="btn btn-outline btn-sm"
        onClick={() =>
          onChange([...list, { fromMonth: list.length ? 0 : 1, amount: 0 }])
        }
      >
        <Plus size={14} />
        <span>เพิ่มขั้น</span>
      </button>
    </div>
  );
};

/**
 * Order editor for the manual strategy.
 *
 * Only `amortizing` debts can receive attack money — the engine pays fixed
 * obligations on their own schedule — so only they are orderable. The list is
 * always seeded from the current debts, so selecting Manual never shows a blank
 * panel and a debt added later cannot silently fall off the end of the order.
 */
const ManualOrderEditor = ({ debts, manualOrder, onChange }) => {
  const orderable = (debts || []).filter((d) => !d.isClosed && d.type === 'amortizing');

  if (!orderable.length) {
    return (
      <div className="text-xs text-subtle mb-2">
        ยังไม่มีหนี้ที่คิดดอกเบี้ยให้จัดลำดับ — โหมดนี้จัดลำดับได้เฉพาะหนี้แบบลดต้นลดดอก
        เพราะหนี้ผ่อนกับเช่าซื้อจ่ายตามงวดในสัญญาอยู่แล้ว
      </div>
    );
  }

  // Ids the user has ordered, minus any that no longer exist, plus any debt
  // they have not placed yet — appended in the order the debts were added.
  const ordered = (manualOrder || []).filter((id) => orderable.some((d) => d.id === id));
  const effective = [
    ...ordered,
    ...orderable.filter((d) => !ordered.includes(d.id)).map((d) => d.id)
  ];

  const nameOf = (id) => orderable.find((d) => d.id === id);

  const move = (index, delta) => {
    const next = [...effective];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="form-group">
      <label className="form-label">ลำดับที่จะโปะ (บนสุดได้เงินก่อน)</label>

      {effective.map((id, i) => {
        const debt = nameOf(id);
        return (
          <div key={id} className="flex gap-2 items-center mb-1">
            <span className="text-xs text-muted num-font" style={{ width: '18px' }}>
              {i + 1}.
            </span>
            <span className="text-xs text-main flex-1">
              {debt.name}{' '}
              <span className="text-muted num-font">{debt.annualRatePct}% ต่อปี</span>
            </span>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              title="เลื่อนขึ้น"
              disabled={i === 0}
              onClick={() => move(i, -1)}
            >
              <ChevronUp size={14} />
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              title="เลื่อนลง"
              disabled={i === effective.length - 1}
              onClick={() => move(i, 1)}
            >
              <ChevronDown size={14} />
            </button>
          </div>
        );
      })}

      <div className="text-xs text-subtle mt-1">
        เงินที่เหลือหลังจ่ายขั้นต่ำทุกก้อนจะทุ่มลงก้อนบนสุดก่อน แล้วไล่ลงมา
      </div>
    </div>
  );
};

export const BudgetProfilePanel = () => {
  const { budgetProfile, updateBudgetProfile, debts } = useWallet();
  const p = budgetProfile;
  const set = (key) => (value) => updateBudgetProfile({ [key]: value });

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">
            <Wallet size={18} />
            <span>ตั้งค่างบประมาณ</span>
          </div>
          <div className="card-subtitle">
            ตัวเลขทุกช่องเป็นของแผนปลอดหนี้ แก้ที่นี่ไม่กระทบแท็บอื่น
          </div>
        </div>
      </div>

      <NumberField
        label="รายได้สุทธิต่อเดือน (บาท)"
        value={p.netMonthlyIncome}
        onChange={set('netMonthlyIncome')}
      />

      <NumberField
        label="รายได้เสริมต่อเดือน (บาท)"
        hint="ตัวแปรสำหรับทดลอง — เพิ่มแล้วดูวันปลอดหนี้ขยับ"
        value={p.extraIncome}
        onChange={set('extraIncome')}
      />

      <NumberField
        label="ค่าใช้จ่ายคงที่ต่อเดือน (บาท)"
        hint="ค่าเช่า ค่าน้ำค่าไฟ มือถือ ประกัน — ไม่รวมค่างวดหนี้"
        value={p.fixedExpenses}
        onChange={set('fixedExpenses')}
      />

      <NumberField
        label="งบกินใช้ต่อเดือน (บาท)"
        hint="อาหาร + ของใช้ส่วนตัว — ตัวแปรหลักที่ขยับวันปลอดหนี้"
        value={p.discretionaryBudget}
        onChange={set('discretionaryBudget')}
      />

      <NumberField
        label="กองฉุกเฉินปัจจุบัน (บาท)"
        value={p.emergencyFundCurrent}
        onChange={set('emergencyFundCurrent')}
      />

      <NumberField
        label="เป้ากองฉุกเฉิน (บาท)"
        hint="ถึงเป้าแล้วเงินส่วนนี้จะไหลไปชำระหนี้เอง"
        value={p.emergencyFundTarget}
        onChange={set('emergencyFundTarget')}
      />

      <NumberField
        label="เงินเข้ากองฉุกเฉินต่อเดือน (บาท)"
        value={p.emergencyMonthlyContribution}
        onChange={set('emergencyMonthlyContribution')}
      />

      <ScheduleEditor
        label="ขั้นของเงินเข้ากองฉุกเฉิน (ถ้ามี)"
        overrides={p.emergencyContributionOverrides}
        onChange={(v) => updateBudgetProfile({ emergencyContributionOverrides: v })}
      />

      <NumberField
        label="เงินกันสำรองระยะสั้นต่อเดือน (บาท)"
        hint="เงินที่กันไว้ไม่เอาไปโปะหนี้ เช่น ค่าใช้จ่ายก้อนที่รู้ล่วงหน้า"
        value={p.shortTermBuffer}
        onChange={set('shortTermBuffer')}
      />

      <ScheduleEditor
        label="ขั้นของเงินกันสำรอง (ถ้ามี)"
        overrides={p.bufferOverrides}
        onChange={(v) => updateBudgetProfile({ bufferOverrides: v })}
      />

      <div className="form-group">
        <label className="form-label">ลำดับการโปะหนี้</label>
        <select
          className="form-select"
          value={p.strategy}
          onChange={(e) => updateBudgetProfile({ strategy: e.target.value })}
        >
          <option value="avalanche">
            Avalanche — โปะก้อนดอกแพงสุดก่อน (ประหยัดดอกที่สุด)
          </option>
          <option value="snowball">
            Snowball — โปะก้อนยอดน้อยสุดก่อน (ปิดหนี้ได้เร็วเป็นก้อน)
          </option>
          <option value="manual">Manual — เรียงลำดับเอง</option>
        </select>
      </div>

      {p.strategy === 'manual' && (
        <ManualOrderEditor
          debts={debts}
          manualOrder={p.manualOrder}
          onChange={(v) => updateBudgetProfile({ manualOrder: v })}
        />
      )}
    </div>
  );
};
