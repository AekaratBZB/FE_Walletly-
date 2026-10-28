export const mapTransactionDto = (dto) => ({
  id: dto.id,
  date: dto.txDate,
  type: dto.type,
  category: dto.categoryName || 'ทั่วไป',
  categoryId: dto.categoryId,
  amount: Number(dto.amount) || 0,
  paymentMethod: dto.paymentMethodName || '',
  note: dto.note || '',
  isProjected: dto.isProjected === true,
  sourceType: dto.sourceType ?? null,
  sourceId: dto.sourceId ?? null,
  sourcePeriod: dto.sourcePeriod ?? null,
  isUserModified: dto.isUserModified === true
});

// เดือน -> วันแรก/วันสุดท้าย (คำนวณวันสุดท้ายจริง เช่น ก.พ. 2570 = 28), ช่วงวันที่ต้องครบทั้งสองฝั่ง
export const periodToRange = ({ periodMode, month, startDate, endDate } = {}) => {
  if (periodMode === 'month' && month) {
    const [y, m] = month.split('-').map(Number);
    const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
    return { startDate: `${month}-01`, endDate: `${month}-${String(last).padStart(2, '0')}` };
  }
  if (periodMode === 'range' && startDate && endDate) return { startDate, endDate };
  return null;
};

// วันที่ใหม่ -> เก่า, วันเดียวกันให้รายการจริงมาก่อนรายการคาดการณ์
export const mergeWithProjected = (transactions, projected) =>
  [...(transactions || []), ...(projected || [])]
    .map((t, i) => ({ t, i }))
    .sort((a, b) => {
      if (a.t.date !== b.t.date) return a.t.date < b.t.date ? 1 : -1;
      const ap = a.t.isProjected ? 1 : 0;
      const bp = b.t.isProjected ? 1 : 0;
      return ap - bp || a.i - b.i;
    })
    .map(({ t }) => t);
