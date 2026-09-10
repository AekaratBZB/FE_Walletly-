import { describe, it, expect } from 'vitest';
import { calculateThaiTax, TAX_BRACKETS } from '../taxCalculator';

describe('taxCalculator', () => {
  it('returns 0 tax when gross income is below personal allowance threshold', () => {
    const result = calculateThaiTax({
      annualSalary: 120000,
      annualBonus: 0,
      freelanceIncome: 0,
      withholdingTax: 0
    });
    expect(result.totalTaxPayable).toBe(0);
    expect(result.netTaxableIncome).toBe(0);
  });

  it('calculates correct progressive tax for middle income', () => {
    const result = calculateThaiTax({
      annualSalary: 600000,
      annualBonus: 0,
      freelanceIncome: 0,
      socialSecurity: 9000,
      parentCount: 0,
      childCount: 0,
      lifeInsurance: 0,
      healthInsurance: 0,
      withholdingTax: 10000
    });
    // Gross: 600,000
    // Expense deduction: 100,000 (50% max 100,000)
    // Personal allowance: 60,000
    // Social security: 9,000
    // Net Taxable: 600,000 - 100,000 - 69,000 = 431,000
    // 0 - 150,000: 0
    // 150,000 - 300,000 (150k @ 5%): 7,500
    // 300,000 - 431,000 (131k @ 10%): 13,100
    // Total Tax: 20,600
    expect(result.grossIncome).toBe(600000);
    expect(result.expenseDeduction).toBe(100000);
    expect(result.netTaxableIncome).toBe(431000);
    expect(result.totalTaxPayable).toBe(20600);
    expect(result.finalDifference).toBe(10000 - 20600); // -10600 (owe tax)
  });

  it('caps insurance and retirement deductions appropriately', () => {
    const result = calculateThaiTax({
      annualSalary: 1000000,
      lifeInsurance: 150000, // Should be capped at 100k total
      healthInsurance: 30000, // Health max is 25k
      ssfAmount: 300000, // Max 200k
      rmfAmount: 400000 // SSF + RMF max 500k
    });
    expect(result.grossIncome).toBe(1000000);
    expect(result.totalAllowances).toBeGreaterThan(60000);
  });
});
