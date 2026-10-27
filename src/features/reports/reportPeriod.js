import { addMonths, monthsBetween } from '../fixed-costs/fixedCostPeriod';
import { formatThaiMonth } from '../../shared/thaiCalendar';

// ตัวเลือกช่วงเวลาของรายงาน: ตัวเลือกด่วนคำนวณจากเดือนปัจจุบันเสมอ มีแค่ 'custom' ที่ผู้ใช้เลือกเอง
export const REPORT_PRESETS = [
  { key: 'thisYear', label: 'ปีนี้' },
  { key: 'lastYear', label: 'ปีที่แล้ว' },
  { key: 'last6Months', label: '6 เดือนล่าสุด' },
  { key: 'thisMonth', label: 'เดือนนี้' },
  { key: 'custom', label: 'กำหนดเอง' }
];

/** ช่วงเดือน { from, to } ('YYYY-MM') ของตัวเลือกด่วน อ้างอิง currentMonth ('YYYY-MM') */
export const getPresetRange = (preset, currentMonth) => {
  const year = Number(currentMonth.slice(0, 4));
  switch (preset) {
    case 'lastYear':
      return { from: `${year - 1}-01`, to: `${year - 1}-12` };
    case 'last6Months':
      return { from: addMonths(currentMonth, -5), to: currentMonth };
    case 'thisMonth':
      return { from: currentMonth, to: currentMonth };
    case 'thisYear':
    default:
      return { from: `${year}-01`, to: `${year}-12` };
  }
};

/** เรียงช่วงให้ from <= to เสมอ */
export const normalizeRange = ({ from, to }) => (from <= to ? { from, to } : { from: to, to: from });

export const countMonths = ({ from, to }) => monthsBetween(from, to) + 1;

/** "มกราคม – ธันวาคม 2569" (ปีเดียวกัน) หรือ "ก.ค. 2568 – ต.ค. 2569" */
export const formatRangeLabel = ({ from, to }) => {
  if (from === to) return formatThaiMonth(from);
  if (from.slice(0, 4) === to.slice(0, 4)) {
    return `${formatThaiMonth(from).split(' ')[0]} – ${formatThaiMonth(to)}`;
  }
  return `${formatThaiMonth(from, { short: true })} – ${formatThaiMonth(to, { short: true })}`;
};
