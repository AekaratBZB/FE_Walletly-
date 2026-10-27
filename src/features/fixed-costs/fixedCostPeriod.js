import { formatMonthKey } from '../../shared/formatters';

// เดือนในฝั่ง FE เก็บเป็น 'YYYY-MM' (เทียบกันด้วย string ได้ตรง ๆ)
// BE เก็บเป็น DateOnly วันที่ 1 ของเดือน ('YYYY-MM-DD')

export const toMonthKey = (date) => (date ? String(date).slice(0, 7) : null);

export const toApiMonth = (monthKey) => (monthKey ? `${monthKey}-01` : null);

const toIndex = (monthKey) => {
  const [y, m] = monthKey.split('-').map(Number);
  return y * 12 + (m - 1);
};

const fromIndex = (index) => {
  const y = Math.floor(index / 12);
  const m = (index % 12) + 1;
  return `${y}-${String(m).padStart(2, '0')}`;
};

export const addMonths = (monthKey, n) => fromIndex(toIndex(monthKey) + n);

export const monthsBetween = (fromKey, toKey) => toIndex(toKey) - toIndex(fromKey);

/** จำนวนเดือนทั้งหมดของรายการ, null = ไม่มีกำหนด */
export const getDurationMonths = (fc) =>
  fc.startMonth && fc.endMonth ? monthsBetween(fc.startMonth, fc.endMonth) + 1 : null;

/** งวดที่เท่าไหร่ของเดือน monthKey (เริ่มที่ 1), null = ไม่ทราบเดือนเริ่ม */
export const getInstallmentNumber = (fc, monthKey) =>
  fc.startMonth ? monthsBetween(fc.startMonth, monthKey) + 1 : null;

export const isFixedCostActiveInMonth = (fc, monthKey) =>
  (!fc.startMonth || fc.startMonth <= monthKey) && (!fc.endMonth || monthKey <= fc.endMonth);

/** ฟิกคอสนับเป็นรายจ่ายของเดือนอัตโนมัติ เว้นแต่อยู่นอกระยะเวลาหรือถูกติ๊กออกในเดือนนั้น */
export const isFixedCostIncluded = (fc, monthKey) =>
  isFixedCostActiveInMonth(fc, monthKey) && !(fc.excludedMonths || []).includes(monthKey);

/** ข้อความระยะเวลาสั้น ๆ ของรายการ ณ เดือน monthKey เช่น "งวด 3/12 · ถึง ก.ย. 2570" */
export const describeFixedCostPeriod = (fc, monthKey) => {
  const duration = getDurationMonths(fc);
  if (!duration) return 'ไม่มีกำหนด';
  if (monthKey < fc.startMonth) return `เริ่ม ${formatMonthKey(fc.startMonth)} · ${duration} เดือน`;
  if (monthKey > fc.endMonth) return `สิ้นสุดแล้ว (${formatMonthKey(fc.endMonth)})`;
  return `งวด ${getInstallmentNumber(fc, monthKey)}/${duration} · ถึง ${formatMonthKey(fc.endMonth)}`;
};

export const sumIncludedFixedCosts = (fixedCosts, monthKey) =>
  fixedCosts
    .filter((fc) => isFixedCostIncluded(fc, monthKey))
    .reduce((sum, fc) => sum + (Number(fc.amount) || 0), 0);
