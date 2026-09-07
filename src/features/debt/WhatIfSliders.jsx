import React from 'react';
import { formatCurrency } from '../../shared/formatters';
import { SlidersHorizontal, RotateCcw } from 'lucide-react';

const Slider = ({ label, hint, value, min, max, step, onChange }) => (
  <div className="form-group">
    <div className="flex justify-between items-baseline mb-1">
      <label className="form-label" style={{ marginBottom: 0 }}>
        {label}
      </label>
      <span className="font-bold num-font text-sm text-primary">
        {formatCurrency(Math.round(value))}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      style={{ width: '100%' }}
    />
    <div className="flex justify-between text-xs text-subtle">
      <span className="num-font">{formatCurrency(min)}</span>
      <span className="num-font">{formatCurrency(max)}</span>
    </div>
    {hint && <div className="text-xs text-subtle mt-1">{hint}</div>}
  </div>
);

/**
 * What-if levers. These override the saved budget for the projection only and
 * are never persisted — the same contract as the source spec's /simulate body.
 */
export const WhatIfSliders = ({ budgetProfile, overrides, onChange }) => {
  const discretionary =
    overrides.discretionaryBudget === null
      ? Number(budgetProfile.discretionaryBudget) || 0
      : overrides.discretionaryBudget;

  const extra =
    overrides.extraIncome === null
      ? Number(budgetProfile.extraIncome) || 0
      : overrides.extraIncome;

  const income = Number(budgetProfile.netMonthlyIncome) || 0;
  // The max must accommodate the current value, or a saved budget above it
  // renders the thumb pinned at the end while the label shows the real figure.
  const discretionaryMax = Math.max(
    20000,
    Math.ceil(income / 1000) * 1000,
    Math.ceil(discretionary / 1000) * 1000
  );

  const isDirty =
    overrides.discretionaryBudget !== null || overrides.extraIncome !== null;

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">
            <SlidersHorizontal size={18} />
            <span>ทดลองปรับตัวเลข (What-if)</span>
          </div>
          <div className="card-subtitle">
            ลากแล้วดูวันปลอดหนี้ขยับทันที — ค่านี้ไม่ถูกบันทึกทับงบที่ตั้งไว้
          </div>
        </div>

        {isDirty && (
          <button
            className="btn btn-outline btn-sm"
            onClick={() => onChange({ discretionaryBudget: null, extraIncome: null })}
          >
            <RotateCcw size={14} />
            <span>กลับค่าที่ตั้งไว้</span>
          </button>
        )}
      </div>

      <Slider
        label="งบกินใช้ต่อเดือน"
        hint="ลดงบกินใช้ 1,000 บาท มักย่นเวลาปลอดหนี้ได้หลายเดือน"
        value={discretionary}
        min={0}
        max={discretionaryMax}
        step={500}
        onChange={(v) => onChange({ ...overrides, discretionaryBudget: v })}
      />

      <Slider
        label="รายได้เสริมต่อเดือน"
        hint="รายได้เสริมทุกบาทไหลเข้าชำระหนี้ทั้งหมด หลังกองฉุกเฉินถึงเป้า"
        value={extra}
        min={0}
        max={20000}
        step={500}
        onChange={(v) => onChange({ ...overrides, extraIncome: v })}
      />
    </div>
  );
};
