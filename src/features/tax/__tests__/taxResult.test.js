import { describe, it, expect } from 'vitest';
import { EMPTY_TAX_RESULT, toTaxResult } from '../taxResult';

describe('toTaxResult', () => {
  it('maps the backend calculation to the tax tab shape', () => {
    // ผลจริงของ BE สำหรับเงินเดือน 600,000 ประกันสังคม 9,000 หัก ณ ที่จ่าย 10,000
    const result = toTaxResult({
      totalIncome: 600000,
      expenseDeduction: 100000,
      totalDeductions: 169000,
      netTaxableIncome: 431000,
      grossTax: 20600,
      withholdingTax: 10000,
      effectiveTaxRate: 3.43,
      deductions: { personalDeduction: 60000 },
      bracketDetails: [
        { labelTh: '0 - 150,000 บาท', rate: 0, taxableInBracket: 150000, taxInBracket: 0 },
        { labelTh: '150,001 - 300,000 บาท (5%)', rate: 0.05, taxableInBracket: 150000, taxInBracket: 7500 },
        { labelTh: '300,001 - 500,000 บาท (10%)', rate: 0.1, taxableInBracket: 131000, taxInBracket: 13100 },
        { labelTh: '500,001 - 750,000 บาท (15%)', rate: 0.15, taxableInBracket: 0, taxInBracket: 0 }
      ]
    });

    expect(result.grossIncome).toBe(600000);
    expect(result.totalAllowances).toBe(69000);
    expect(result.netTaxableIncome).toBe(431000);
    expect(result.totalTaxPayable).toBe(20600);
    expect(result.finalDifference).toBe(-10600);
    expect(result.personalDeduction).toBe(60000);
    expect(result.bracketBreakdowns[2]).toEqual({
      label: '300,001 - 500,000 บาท (10%)',
      rate: '10%',
      amountInBracket: 131000,
      tax: 13100,
      isActive: true
    });
    expect(result.bracketBreakdowns[3].isActive).toBe(false);
  });

  it('returns an empty result before the first response', () => {
    expect(toTaxResult(null)).toBe(EMPTY_TAX_RESULT);
  });
});
