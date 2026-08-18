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
