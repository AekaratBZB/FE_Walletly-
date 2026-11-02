export const mapTransactionDto = (dto) => ({
  id: dto.id,
  date: dto.txDate,
  type: dto.type,
  category: dto.categoryName || 'ทั่วไป',
  categoryId: dto.categoryId,
  amount: Number(dto.amount) || 0,
  paymentMethod: dto.paymentMethodName || '',
  paymentMethodId: dto.paymentMethodId ?? null,
  note: dto.note || '',
  isProjected: dto.isProjected === true,
  sourceType: dto.sourceType ?? null,
  sourceId: dto.sourceId ?? null,
  sourcePeriod: dto.sourcePeriod ?? null,
  isUserModified: dto.isUserModified === true,
  // ลิงก์ที่ PUT ต้องส่งกลับไปเหมือนเดิม ไม่งั้น BE จะล้างทิ้ง (เช่น เป้าออม/หนี้ที่ผูกไว้)
  accountId: dto.accountId ?? null,
  destinationAccountId: dto.destinationAccountId ?? null,
  savingsGoalId: dto.savingsGoalId ?? null,
  fixedCostId: dto.fixedCostId ?? null,
  debtId: dto.debtId ?? null,
  isRecurring: dto.isRecurring === true
});

// รายการที่ผูกกับเป้าออม/หนี้/ฟิกคอส/รายรับประจำ: ห้ามเปลี่ยนประเภท เพราะยอดฝั่งนั้นอิงประเภทเดิม
export const isLinkedTransaction = (tx) =>
  !!(tx?.sourceType || tx?.savingsGoalId || tx?.debtId || tx?.fixedCostId);

// body ของ PUT /transactions/{id}: คงลิงก์เดิมไว้ทั้งหมด
// เปลี่ยนช่องทางชำระแล้วส่ง accountId = null ให้ BE ผูกบัญชีตามช่องทางใหม่เอง
export const buildUpdatePayload = (original, changes, { categoryId, paymentMethodId }) => ({
  type: changes.type,
  amount: Number(changes.amount) || 0,
  txDate: changes.date,
  categoryId,
  accountId: paymentMethodId === original.paymentMethodId ? original.accountId ?? null : null,
  destinationAccountId: original.destinationAccountId ?? null,
  paymentMethodId: paymentMethodId ?? null,
  savingsGoalId: original.savingsGoalId ?? null,
  fixedCostId: original.fixedCostId ?? null,
  debtId: original.debtId ?? null,
  note: changes.note || '',
  isRecurring: original.isRecurring === true
});

// ยอดเงินรวมจากรายการจริงถึงวันนี้ (ไม่นับรายการคาดการณ์): รายรับ/เงินเดือน - รายจ่าย - ฟิกคอส - เงินออม
export const summarizeWallet = (transactions = [], today) => {
  const totals = { income: 0, expense: 0, fixed: 0, savings: 0 };
  for (const t of transactions) {
    if (t.isProjected || (today && t.date > today)) continue;
    if (t.type in totals) totals[t.type] += Number(t.amount) || 0;
  }
  return { ...totals, balance: totals.income - totals.expense - totals.fixed - totals.savings };
};

const normalizeName = (name) => String(name || '').toLowerCase().replace(/\s+/g, '');

// หา categoryId จากชื่อหมวด: ชื่อตรง > ชื่อตรงเมื่อไม่สนช่องว่าง > หมวด "อื่น" ของประเภทเดียวกัน > หมวดแรกของประเภทนั้น
// ห้ามเลือกหมวดแรกของประเภทก่อนเช็คชื่อ: รายรับจะตกไปหมวดเงินเดือน แล้ว BE ลบแถวเงินเดือนอัตโนมัติของเดือนนั้นทิ้ง
export const resolveCategoryId = (tx, categories = []) => {
  if (tx.categoryId) return tx.categoryId;
  const sameType = categories.filter(c => c.type === tx.type);
  const name = normalizeName(tx.category);
  const match =
    sameType.find(c => c.name === tx.category) ||
    sameType.find(c => normalizeName(c.name) === name) ||
    sameType.find(c => c.name.includes('อื่น')) ||
    sameType[0];
  return match?.id ?? null;
};

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
