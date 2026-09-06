/**
 * Formats a number to Thai Baht currency string
 * e.g., 50000 -> "50,000 ฿"
 */
export const formatCurrency = (amount, includeSymbol = true, decimals = 0) => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return includeSymbol ? '0 ฿' : '0';
  }
  const formatted = Number(amount).toLocaleString('th-TH', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
  return includeSymbol ? `${formatted} ฿` : formatted;
};

/**
 * Formats a date string (YYYY-MM-DD) into readable format
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  } catch (e) {
    return dateStr;
  }
};

/**
 * Returns today's date in YYYY-MM-DD format
 */
export const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Returns current month prefix in YYYY-MM format
 */
export const getCurrentMonthPrefix = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

/**
 * Formats a { year, month } pair (month 1-12) as a Thai short month with a
 * Buddhist-era year, e.g. { year: 2031, month: 3 } -> "มี.ค. 2574"
 */
export const formatMonthLabel = (m) => {
  if (!m || !m.year || !m.month) return '-';
  return `${THAI_MONTHS_SHORT[m.month - 1]} ${m.year + 543}`;
};
