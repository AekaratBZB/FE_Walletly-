/**
 * JSDoc typedefs for the debt payoff engine. No runtime code — this file
 * exists so editors can complete the shapes and so the shapes are documented
 * in one place.
 *
 * @typedef {'amortizing' | 'hirePurchase' | 'installment'} DebtType
 *
 * @typedef {Object} MinimumPayment
 * @property {'none' | 'fixed' | 'percentOfBalance'} mode
 * @property {number} [amount]   Used when mode === 'fixed'
 * @property {number} [percent]  Used when mode === 'percentOfBalance', e.g. 8
 * @property {number} [floor]    Used when mode === 'percentOfBalance', e.g. 500
 *
 * @typedef {Object} Debt
 * @property {string} id
 * @property {string} name
 * @property {DebtType} type
 * @property {number} [principal]         amortizing only
 * @property {number} [accruedInterest]   amortizing only, unpaid interest carried over
 * @property {number} [annualRatePct]     amortizing only
 * @property {'monthly'|'annual'} [frequency]
 * @property {number|null} [annualDueMonth] 1-12, required when acceptsEarlyPayment is false
 * @property {boolean} [acceptsEarlyPayment] false => cash is held until annualDueMonth
 * @property {MinimumPayment} [minimumPayment]
 * @property {number} [monthlyPayment]    hirePurchase | installment
 * @property {number} [periodsPaid]       hirePurchase | installment
 * @property {number} [periodsTotal]      hirePurchase | installment
 * @property {number|null} [settlementQuote]     hirePurchase, lender-provided payoff figure
 * @property {string|null} [settlementQuoteDate] hirePurchase, YYYY-MM-DD
 * @property {boolean} isClosed
 *
 * @typedef {Object} ScheduleOverride
 * @property {number} fromMonth  0-based month index this amount takes effect from
 * @property {number} amount
 *
 * @typedef {Object} BudgetProfile
 * @property {number} netMonthlyIncome
 * @property {number} fixedExpenses
 * @property {number} discretionaryBudget
 * @property {number} extraIncome
 * @property {number} emergencyFundCurrent
 * @property {number} emergencyFundTarget
 * @property {number} emergencyMonthlyContribution
 * @property {ScheduleOverride[]} emergencyContributionOverrides
 * @property {number} shortTermBuffer
 * @property {ScheduleOverride[]} bufferOverrides
 * @property {'avalanche'|'snowball'|'manual'} strategy
 * @property {string[]} manualOrder
 *
 * @typedef {Object} YearMonth
 * @property {number} year
 * @property {number} month  1-12
 *
 * @typedef {Object} PerDebtRow
 * @property {string} debtId
 * @property {number} paid
 * @property {number} interestPortion
 * @property {number} principalPortion
 * @property {number} balance
 * @property {number} held
 *
 * @typedef {Object} MonthlyProjection
 * @property {number} Index
 * @property {YearMonth} Month
 * @property {number} InstallmentTotal
 * @property {number} Surplus
 * @property {number} EmergencyContribution
 * @property {number} LoanPayment
 * @property {number} HeldForAnnualPayment
 * @property {number} InterestAccrued
 * @property {number} AccruedInterestBalance
 * @property {number} PrincipalBalance
 * @property {number} EmergencyFundBalance
 * @property {number} DiscretionaryCeiling
 * @property {PerDebtRow[]} perDebt
 *
 * @typedef {Object} Projection
 * @property {MonthlyProjection[]} Months
 * @property {number} MonthsToPayoff
 * @property {YearMonth} PayoffDate
 * @property {number} TotalInterestPaid
 * @property {number|null} InterestArrearsClearedMonth
 * @property {number} MonthlyInterestThreshold
 * @property {boolean} IsInfeasible
 * @property {'budgetShortfall'|'debtNotFalling'|'horizonExhausted'|null} InfeasibleReason
 * @property {number|null} MinimumViablePayment
 * @property {number|null} MonthlyShortfall
 *
 * @typedef {Object} RankedDebt
 * @property {string} debtId
 * @property {string} name
 * @property {DebtType} type
 * @property {number|null} totalRemainingCost  null => not computable, see rankingUnreliable
 * @property {boolean} quoteMissing
 * @property {number|null} rebateDecayPerMonth
 * @property {boolean} rankingUnreliable  true on every row when the projection is infeasible
 * @property {string} reason
 */

export {};
