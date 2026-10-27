// แปลงผลคำนวณภาษีจาก BE (POST /taxes/calculate -> TaxCalculationSummaryDto) เป็นรูปที่ TaxTab ใช้แสดง

export const EMPTY_TAX_RESULT = {
  grossIncome: 0,
  expenseDeduction: 0,
  personalDeduction: 60000,
  totalAllowances: 0,
  netTaxableIncome: 0,
  totalTaxPayable: 0,
  withholdingTax: 0,
  finalDifference: 0,
  effectiveTaxRate: 0,
  bracketBreakdowns: []
};

export const toTaxResult = (dto) => {
  if (!dto) return EMPTY_TAX_RESULT;
  const totalIncome = Number(dto.totalIncome) || 0;
  const expenseDeduction = Number(dto.expenseDeduction) || 0;
  const grossTax = Number(dto.grossTax) || 0;
  const withholdingTax = Number(dto.withholdingTax) || 0;

  return {
    grossIncome: totalIncome,
    expenseDeduction,
    personalDeduction: Number(dto.deductions?.personalDeduction) || 0,
    // ค่าลดหย่อน (ไม่รวมค่าใช้จ่าย 50%) เพื่อแสดงแยกบรรทัดเหมือนเดิม
    totalAllowances: (Number(dto.totalDeductions) || 0) - expenseDeduction,
    netTaxableIncome: Number(dto.netTaxableIncome) || 0,
    totalTaxPayable: grossTax,
    withholdingTax,
    // > 0 ได้เงินคืน, < 0 ต้องจ่ายเพิ่ม
    finalDifference: withholdingTax - grossTax,
    effectiveTaxRate: Number(dto.effectiveTaxRate) || 0,
    bracketBreakdowns: (dto.bracketDetails || []).map(b => ({
      label: b.labelTh,
      rate: `${Math.round(Number(b.rate) * 10000) / 100}%`,
      amountInBracket: Number(b.taxableInBracket) || 0,
      tax: Number(b.taxInBracket) || 0,
      isActive: Number(b.taxableInBracket) > 0
    }))
  };
};
