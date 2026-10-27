// ปฏิทินไทย: แสดงปีเป็น พ.ศ. แต่ค่าที่เก็บ/ส่ง BE ยังเป็น ค.ศ. ('YYYY-MM', 'YYYY-MM-DD')

export const BE_OFFSET = 543;

export const THAI_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

export const THAI_WEEKDAYS_SHORT = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

export const toBuddhistYear = (year) => year + BE_OFFSET;

const pad = (n) => String(n).padStart(2, '0');

export const toMonthValue = (year, month) => `${year}-${pad(month)}`;

export const toDateValue = (year, month, day) => `${year}-${pad(month)}-${pad(day)}`;

/** 'YYYY-MM' หรือ 'YYYY-MM-DD' -> { year, month, day } (month 1-12), null ถ้ารูปแบบไม่ถูก */
export const parseValue = (value) => {
  const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(value || '');
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]), day: m[3] ? Number(m[3]) : null };
};

export const daysInMonth = (year, month) => new Date(year, month, 0).getDate();

/** วันในตารางปฏิทินของเดือน เริ่มวันอาทิตย์ ช่องว่างหน้าวันที่ 1 เป็น null */
export const buildMonthGrid = (year, month) => {
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const cells = Array(firstWeekday).fill(null);
  for (let d = 1; d <= daysInMonth(year, month); d++) cells.push(d);
  return cells;
};

/** 'YYYY-MM' -> 'ตุลาคม 2569' */
export const formatThaiMonth = (value, { short = false } = {}) => {
  const p = parseValue(value);
  if (!p) return '';
  const names = short ? THAI_MONTHS_SHORT : THAI_MONTHS_FULL;
  return `${names[p.month - 1]} ${toBuddhistYear(p.year)}`;
};

/** 'YYYY-MM-DD' -> '27 ต.ค. 2569' */
export const formatThaiDate = (value) => {
  const p = parseValue(value);
  if (!p || !p.day) return '';
  return `${p.day} ${THAI_MONTHS_SHORT[p.month - 1]} ${toBuddhistYear(p.year)}`;
};
