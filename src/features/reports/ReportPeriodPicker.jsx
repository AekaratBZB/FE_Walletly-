import React from 'react';
import { ArrowRight, CalendarDays } from 'lucide-react';
import { ThaiMonthPicker } from '../../components/ThaiDatePicker';
import { REPORT_PRESETS, countMonths, formatRangeLabel, normalizeRange } from './reportPeriod';

/**
 * แผงเลือกช่วงเวลารายงาน: ตัวเลือกด่วนแสดงช่วงเป็นข้อความ (แก้ไม่ได้)
 * มีแค่ "กำหนดเอง" ที่โชว์ช่องเลือกเดือน/ปี
 */
export const ReportPeriodPicker = ({ preset, range, onPresetChange, onRangeChange }) => {
  const setCustom = (patch) => onRangeChange(normalizeRange({ ...range, ...patch }));

  return (
    <div className="card mb-6 report-period">
      <div className="report-period-seg" role="tablist" aria-label="ช่วงเวลารายงาน">
        {REPORT_PRESETS.map(p => (
          <button
            key={p.key}
            type="button"
            role="tab"
            aria-selected={preset === p.key}
            className={preset === p.key ? 'is-active' : ''}
            onClick={() => onPresetChange(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {preset === 'custom' ? (
        <>
          <div className="report-period-custom">
            <div className="report-period-field">
              <label className="form-label">ตั้งแต่เดือน</label>
              <ThaiMonthPicker value={range.from} onChange={(v) => v && setCustom({ from: v })} ariaLabel="ตั้งแต่เดือน" />
            </div>
            <ArrowRight size={18} color="var(--text-subtle)" className="report-period-arrow" aria-hidden="true" />
            <div className="report-period-field">
              <label className="form-label">ถึงเดือน</label>
              <ThaiMonthPicker value={range.to} onChange={(v) => v && setCustom({ to: v })} ariaLabel="ถึงเดือน" />
            </div>
          </div>
          <div className="text-xs text-muted mt-2">
            {formatRangeLabel(range)} · {countMonths(range)} เดือน
          </div>
        </>
      ) : (
        <div className="report-period-summary">
          <div className="report-period-icon">
            <CalendarDays size={18} aria-hidden="true" />
          </div>
          <div>
            <div className="report-period-range">{formatRangeLabel(range)}</div>
            <div className="text-xs text-muted">{countMonths(range)} เดือน · ฟิกคอสนับแยกรายเดือน</div>
          </div>
        </div>
      )}
    </div>
  );
};
