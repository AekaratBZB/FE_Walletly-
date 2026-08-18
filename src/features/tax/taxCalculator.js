/**
 * Thai Personal Income Tax Calculator (ภ.ง.ด. 90/91)
 * Up to date with Thai Revenue Department progressive tax rates and deductions.
 */

export const TAX_BRACKETS = [
  { min: 0, max: 150000, rate: 0.00, label: '0 - 150,000 บาท (0% ได้รับยกเว้น)' },
  { min: 150000, max: 300000, rate: 0.05, label: '150,001 - 300,000 บาท (5%)' },
  { min: 300000, max: 500000, rate: 0.10, label: '300,001 - 500,000 บาท (10%)' },
  { min: 500000, max: 750000, rate: 0.15, label: '500,001 - 750,000 บาท (15%)' },
  { min: 750000, max: 1000000, rate: 0.20, label: '750,001 - 1,000,000 บาท (20%)' },
  { min: 1000000, max: 2000000, rate: 0.25, label: '1,000,001 - 2,000,000 บาท (25%)' },
  { min: 2000000, max: 5000000, rate: 0.30, label: '2,000,001 - 5,000,000 บาท (30%)' },
  { min: 5000000, max: Infinity, rate: 0.35, label: 'เกิน 5,000,000 บาทขึ้นไป (35%)' }
];

export const calculateThaiTax = (s = {}) => {
  // 1. Total Income
  const grossIncome = (Number(s.annualSalary) || 0) + (Number(s.annualBonus) || 0) + (Number(s.freelanceIncome) || 0);

  // 2. Standard Expense Deduction (50% of 40(1)+40(2), Max 100,000 THB)
  const expenseDeduction = Math.min(100000, grossIncome * 0.5);

  // 3. Deductions & Allowances
  const personalAllowance = 60000;
  const parentAllowance = Math.min(120000, (Number(s.parentCount) || 0) * 30000);
  const childAllowance = (Number(s.childCount) || 0) * 30000;
  const socialSecurityDeduction = Math.min(9000, Number(s.socialSecurity) || 0);

  // Life & Health Insurance (Combined max 100,000 THB, health max 25,000 THB)
  const validHealth = Math.min(25000, Number(s.healthInsurance) || 0);
  const validLife = Number(s.lifeInsurance) || 0;
  const totalInsuranceDeduction = Math.min(100000, validLife + validHealth);

  // Retirement Group (SSF, RMF, PVD combined max 500,000 THB)
  const validSSF = Math.min(200000, Math.min(grossIncome * 0.3, Number(s.ssfAmount) || 0));
  const validRMF = Math.min(500000, Math.min(grossIncome * 0.3, Number(s.rmfAmount) || 0));
  const validPVD = Math.min(500000, Math.min(grossIncome * 0.15, Number(s.providentFund) || 0));
  const retirementGroupTotal = Math.min(500000, validSSF + validRMF + validPVD);

  // ThaiESG (Separate quota: max 300,000 THB and <= 30% of income)
  const validThaiESG = Math.min(300000, Math.min(grossIncome * 0.3, Number(s.thaiEsgAmount) || 0));

  // Mortgage Interest (Max 100,000 THB)
  const validMortgage = Math.min(100000, Number(s.mortgageInterest) || 0);

  // Easy E-Receipt (Max 50,000 THB)
  const validEasyReceipt = Math.min(50000, Number(s.easyReceipt) || 0);

  // Total Allowances before donation
  const subtotalAllowances = personalAllowance + parentAllowance + childAllowance +
    socialSecurityDeduction + totalInsuranceDeduction + retirementGroupTotal +
    validThaiESG + validMortgage + validEasyReceipt;

  // Income before donation
  const incomeBeforeDonation = Math.max(0, grossIncome - expenseDeduction - subtotalAllowances);

  // Donations (Max 10% of income after deductions)
  const maxDonationAllowed = incomeBeforeDonation * 0.10;
  const validDonation = Math.min(maxDonationAllowed, Number(s.donationGeneral) || 0);

  const totalAllowances = subtotalAllowances + validDonation;

  // 4. Net Taxable Income (เงินได้สุทธิ)
  const netTaxableIncome = Math.max(0, grossIncome - expenseDeduction - totalAllowances);

  // 5. Progressive Tax Calculation
  let totalTaxPayable = 0;
  const bracketBreakdowns = [];

  for (const b of TAX_BRACKETS) {
    if (netTaxableIncome > b.min) {
      const taxableInThisBracket = Math.min(netTaxableIncome, b.max) - b.min;
      const taxInThisBracket = taxableInThisBracket * b.rate;
      totalTaxPayable += taxInThisBracket;

      bracketBreakdowns.push({
        label: b.label,
        rate: `${b.rate * 100}%`,
        amountInBracket: taxableInThisBracket,
        tax: taxInThisBracket,
        isActive: true
      });
    } else {
      bracketBreakdowns.push({
        label: b.label,
        rate: `${b.rate * 100}%`,
        amountInBracket: 0,
        tax: 0,
        isActive: false
      });
    }
  }

  // 6. Withholding Tax Offset & Final Result
  const withholdingTax = Number(s.withholdingTax) || 0;
  const finalDifference = withholdingTax - totalTaxPayable; // >0 is refund, <0 is due
  const effectiveTaxRate = grossIncome > 0 ? (totalTaxPayable / grossIncome) * 100 : 0;

  return {
    grossIncome,
    expenseDeduction,
    totalAllowances,
    netTaxableIncome,
    totalTaxPayable,
    withholdingTax,
    finalDifference,
    effectiveTaxRate,
    bracketBreakdowns
  };
};
