import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  THAI_MONTHS_FULL,
  THAI_MONTHS_SHORT,
  THAI_WEEKDAYS_SHORT,
  buildMonthGrid,
  formatThaiDate,
  formatThaiMonth,
  parseValue,
  toBuddhistYear,
  toDateValue,
  toMonthValue
} from '../shared/thaiCalendar';

// ช่องเลือกเดือน/วันที่แบบ พ.ศ. แทน <input type="month|date"> ของเบราว์เซอร์ (ซึ่งแสดง ค.ศ. ตาม locale)
// value / onChange ยังเป็น ค.ศ. ('YYYY-MM' / 'YYYY-MM-DD') เหมือน input เดิม

const PANEL_WIDTH = 288;

const today = () => {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
};

const isOutOfRange = (value, min, max) => (min && value < min) || (max && value > max);

// แผงลอยผ่าน portal: Modal ใช้ overflow auto ถ้าวางในฟอร์มตรง ๆ แผงจะถูกตัด
const usePopover = () => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  const place = () => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    const panelHeight = panelRef.current?.offsetHeight || 340;
    const fitsBelow = r.bottom + 6 + panelHeight <= window.innerHeight;
    const top = fitsBelow || r.top - panelHeight - 6 < 0 ? r.bottom + 6 : r.top - panelHeight - 6;
    const left = Math.min(Math.max(8, r.left), window.innerWidth - PANEL_WIDTH - 8);
    setPos({ top, left });
  };

  useLayoutEffect(() => {
    if (open) place();
    else setPos(null);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      if (!(e.target instanceof Node)) return;
      if (!panelRef.current?.contains(e.target) && !triggerRef.current?.contains(e.target)) setOpen(false);
    };
    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  // Esc ปิดแค่ปฏิทิน ไม่ให้หลุดไปปิด Modal ที่ฟังอยู่บน window
  const onKeyDown = (e) => {
    if (e.key === 'Escape' && open) {
      e.stopPropagation();
      close();
    }
  };

  return { open, setOpen, close, pos, triggerRef, panelRef, onKeyDown };
};

const Trigger = ({ popover, label, placeholder, ariaLabel, disabled, style, className = '' }) => (
  <button
    type="button"
    ref={popover.triggerRef}
    className={`form-input thai-picker-trigger ${className}`}
    style={style}
    onClick={() => popover.setOpen(o => !o)}
    onKeyDown={popover.onKeyDown}
    aria-haspopup="dialog"
    aria-expanded={popover.open}
    aria-label={ariaLabel ? `${ariaLabel}${label ? `: ${label}` : ''}` : undefined}
    disabled={disabled}
  >
    <span className={label ? 'num-font' : 'thai-picker-placeholder'}>{label || placeholder}</span>
    <Calendar size={16} color="var(--text-muted)" aria-hidden="true" />
  </button>
);

const Panel = ({ popover, ariaLabel, children }) =>
  popover.open &&
  createPortal(
    <div
      ref={popover.panelRef}
      className="thai-picker-panel"
      role="dialog"
      aria-label={ariaLabel}
      onKeyDown={popover.onKeyDown}
      style={{ top: popover.pos?.top ?? 0, left: popover.pos?.left ?? 0, visibility: popover.pos ? 'visible' : 'hidden', width: PANEL_WIDTH }}
    >
      {children}
    </div>,
    document.body
  );

const NavHeader = ({ title, onPrev, onNext, onTitleClick, prevLabel, nextLabel }) => (
  <div className="thai-picker-nav">
    <button type="button" className="btn btn-ghost btn-sm" onClick={onPrev} aria-label={prevLabel}>
      <ChevronLeft size={16} />
    </button>
    {onTitleClick ? (
      <button type="button" className="thai-picker-title is-link" onClick={onTitleClick}>{title}</button>
    ) : (
      <span className="thai-picker-title">{title}</span>
    )}
    <button type="button" className="btn btn-ghost btn-sm" onClick={onNext} aria-label={nextLabel}>
      <ChevronRight size={16} />
    </button>
  </div>
);

const MonthGrid = ({ viewYear, selected, current, min, max, onPick }) => (
  <div className="thai-picker-grid cols-3">
    {THAI_MONTHS_SHORT.map((name, i) => {
      const value = toMonthValue(viewYear, i + 1);
      const classes = [
        'thai-picker-cell',
        value === selected && 'is-selected',
        value === current && 'is-current'
      ].filter(Boolean).join(' ');
      return (
        <button
          key={name}
          type="button"
          className={classes}
          disabled={isOutOfRange(value, min, max)}
          onClick={() => onPick(i + 1)}
          aria-label={`${THAI_MONTHS_FULL[i]} ${toBuddhistYear(viewYear)}`}
          aria-pressed={value === selected}
        >
          {name}
        </button>
      );
    })}
  </div>
);

const Footer = ({ todayLabel, onToday, todayDisabled, allowClear, onClear }) => (
  <div className="thai-picker-footer">
    <button type="button" className="btn btn-ghost btn-sm" onClick={onToday} disabled={todayDisabled}>
      {todayLabel}
    </button>
    {allowClear && (
      <button type="button" className="btn btn-ghost btn-sm" onClick={onClear}>
        ล้าง
      </button>
    )}
  </div>
);

export const ThaiMonthPicker = ({
  value,
  onChange,
  min,
  max,
  placeholder = 'เลือกเดือน',
  ariaLabel,
  allowClear = false,
  disabled,
  style,
  className
}) => {
  const popover = usePopover();
  const now = today();
  const selected = parseValue(value);
  const [viewYear, setViewYear] = useState(selected?.year || now.year);

  useEffect(() => {
    if (popover.open) setViewYear(parseValue(value)?.year || today().year);
  }, [popover.open]);

  const pick = (month) => {
    onChange(toMonthValue(viewYear, month));
    popover.close();
  };

  const currentMonth = toMonthValue(now.year, now.month);

  return (
    <>
      <Trigger
        popover={popover}
        label={formatThaiMonth(value)}
        placeholder={placeholder}
        ariaLabel={ariaLabel}
        disabled={disabled}
        style={style}
        className={className}
      />
      <Panel popover={popover} ariaLabel={ariaLabel || placeholder}>
        <NavHeader
          title={`พ.ศ. ${toBuddhistYear(viewYear)}`}
          onPrev={() => setViewYear(y => y - 1)}
          onNext={() => setViewYear(y => y + 1)}
          prevLabel="ปีก่อนหน้า"
          nextLabel="ปีถัดไป"
        />
        <MonthGrid
          viewYear={viewYear}
          selected={value}
          current={currentMonth}
          min={min}
          max={max}
          onPick={pick}
        />
        <Footer
          todayLabel="เดือนนี้"
          todayDisabled={isOutOfRange(currentMonth, min, max)}
          onToday={() => {
            onChange(currentMonth);
            popover.close();
          }}
          allowClear={allowClear}
          onClear={() => {
            onChange('');
            popover.close();
          }}
        />
      </Panel>
    </>
  );
};

export const ThaiDatePicker = ({
  value,
  onChange,
  min,
  max,
  placeholder = 'เลือกวันที่',
  ariaLabel,
  allowClear = false,
  disabled,
  style,
  className
}) => {
  const popover = usePopover();
  const now = today();
  const [view, setView] = useState(() => {
    const p = parseValue(value);
    return { year: p?.year || now.year, month: p?.month || now.month };
  });
  // 'days' = ตารางวัน, 'months' = กดหัวข้อเพื่อกระโดดข้ามเดือน/ปีเร็ว ๆ
  const [mode, setMode] = useState('days');

  useEffect(() => {
    if (!popover.open) return;
    const p = parseValue(value);
    const t = today();
    setView({ year: p?.year || t.year, month: p?.month || t.month });
    setMode('days');
  }, [popover.open]);

  const shiftMonth = (delta) =>
    setView(v => {
      const index = v.year * 12 + (v.month - 1) + delta;
      return { year: Math.floor(index / 12), month: (index % 12) + 1 };
    });

  const pick = (day) => {
    onChange(toDateValue(view.year, view.month, day));
    popover.close();
  };

  const todayValue = toDateValue(now.year, now.month, now.day);

  return (
    <>
      <Trigger
        popover={popover}
        label={formatThaiDate(value)}
        placeholder={placeholder}
        ariaLabel={ariaLabel}
        disabled={disabled}
        style={style}
        className={className}
      />
      <Panel popover={popover} ariaLabel={ariaLabel || placeholder}>
        {mode === 'months' ? (
          <>
            <NavHeader
              title={`พ.ศ. ${toBuddhistYear(view.year)}`}
              onPrev={() => setView(v => ({ ...v, year: v.year - 1 }))}
              onNext={() => setView(v => ({ ...v, year: v.year + 1 }))}
              prevLabel="ปีก่อนหน้า"
              nextLabel="ปีถัดไป"
            />
            <MonthGrid
              viewYear={view.year}
              selected={value ? value.slice(0, 7) : ''}
              current={toMonthValue(now.year, now.month)}
              onPick={(month) => {
                setView(v => ({ ...v, month }));
                setMode('days');
              }}
            />
          </>
        ) : (
          <>
            <NavHeader
              title={`${THAI_MONTHS_FULL[view.month - 1]} ${toBuddhistYear(view.year)}`}
              onPrev={() => shiftMonth(-1)}
              onNext={() => shiftMonth(1)}
              onTitleClick={() => setMode('months')}
              prevLabel="เดือนก่อนหน้า"
              nextLabel="เดือนถัดไป"
            />
            <div className="thai-picker-grid cols-7">
              {THAI_WEEKDAYS_SHORT.map(d => (
                <span key={d} className="thai-picker-weekday">{d}</span>
              ))}
              {buildMonthGrid(view.year, view.month).map((day, i) => {
                if (!day) return <span key={`blank-${i}`} />;
                const cellValue = toDateValue(view.year, view.month, day);
                const classes = [
                  'thai-picker-cell',
                  cellValue === value && 'is-selected',
                  cellValue === todayValue && 'is-current'
                ].filter(Boolean).join(' ');
                return (
                  <button
                    key={cellValue}
                    type="button"
                    className={classes}
                    disabled={isOutOfRange(cellValue, min, max)}
                    onClick={() => pick(day)}
                    aria-label={formatThaiDate(cellValue)}
                    aria-pressed={cellValue === value}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </>
        )}
        <Footer
          todayLabel="วันนี้"
          todayDisabled={isOutOfRange(todayValue, min, max)}
          onToday={() => {
            onChange(todayValue);
            popover.close();
          }}
          allowClear={allowClear}
          onClear={() => {
            onChange('');
            popover.close();
          }}
        />
      </Panel>
    </>
  );
};
