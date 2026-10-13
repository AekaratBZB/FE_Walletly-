/**
 * The §8 golden fixture from the source spec, as data.
 *
 * Verified by hand before implementation:
 *   installmentTotal m0 = 856.90+1699.00+1998.33+2496.66+439.41+3374.00 = 10,864.30
 *   surplus m0          = 29000 - 7920.36 - 5000 - 10864.30            =  5,215.34
 *   threshold           = 610000 * 0.06575 / 12                        =  3,342.29
 *   availableForLoan m0 = 5215.34 - 2000 - 1200                        =  2,015.34
 *   arrears m0          = 21306 + 3342.2916667 - 2015.34               = 22,632.95
 *   installmentTotal m2 = 10864.30 - 2496.66 (guitar done)             =  8,367.64
 *   m3 obligations      = 856.90 + 1699.00 + 3374.00                   =  5,929.90
 *   LoanPayment m3      = (29000-7920.36-5000-5929.90) - 3000 - 0      =  7,149.74
 *   principal m7        = 610000 - 845.0466667                         = 609,154.95
 */

export const GOLDEN_BUDGET = {
  netMonthlyIncome: 29000,
  fixedExpenses: 7920.36,
  discretionaryBudget: 5000,
  extraIncome: 0,
  emergencyFundCurrent: 8780,
  emergencyFundTarget: 40000,
  emergencyMonthlyContribution: 2000,
  emergencyContributionOverrides: [{ fromMonth: 3, amount: 3000 }],
  shortTermBuffer: 1200,
  bufferOverrides: [{ fromMonth: 2, amount: 0 }],
  strategy: 'avalanche',
  manualOrder: []
};

export const GOLDEN_DEBTS = [
  {
    id: 'loan-1',
    name: 'สินเชื่อ ธ.ก.ส.',
    type: 'amortizing',
    principal: 610000,
    accruedInterest: 21306,
    annualRatePct: 6.575,
    frequency: 'monthly',
    annualDueMonth: null,
    acceptsEarlyPayment: true,
    minimumPayment: { mode: 'none' },
    isClosed: false
  },
  { id: 'inst-phone', name: 'มือถือ', type: 'installment', monthlyPayment: 856.90, periodsPaid: 0, periodsTotal: 9, isClosed: false },
  { id: 'inst-camera', name: 'กล้อง', type: 'installment', monthlyPayment: 1699.00, periodsPaid: 0, periodsTotal: 6, isClosed: false },
  { id: 'inst-monitor', name: 'จอมอนิเตอร์', type: 'installment', monthlyPayment: 1998.33, periodsPaid: 0, periodsTotal: 3, isClosed: false },
  { id: 'inst-guitar', name: 'กีตาร์', type: 'installment', monthlyPayment: 2496.66, periodsPaid: 0, periodsTotal: 2, isClosed: false },
  { id: 'inst-keyboard', name: 'คีย์บอร์ด', type: 'installment', monthlyPayment: 439.41, periodsPaid: 0, periodsTotal: 3, isClosed: false },
  {
    id: 'hp-car',
    name: 'รถยนต์ (เช่าซื้อ)',
    type: 'hirePurchase',
    monthlyPayment: 3374.00,
    periodsPaid: 0,
    periodsTotal: 14,
    settlementQuote: null,
    settlementQuoteDate: null,
    isClosed: false
  }
];

/** Month 0 = October, per the source spec's fixture. */
export const GOLDEN_START = { year: 2026, month: 10 };
