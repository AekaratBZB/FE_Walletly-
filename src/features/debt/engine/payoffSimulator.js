import {
  periodsRemaining,
  resolveSchedule,
  hasFutureOverride,
  monthlyInterest,
  minimumDue,
  addMonths
} from './debtMath';

const MAX_MONTHS_DEFAULT = 600;

/** Half a satang. Real balances are never smaller, so this is a safe zero. */
const EPS = 0.005;

/** Mutable per-month copy of an amortizing debt. The input array is never touched. */
const makeWorkingLoan = (d) => ({
  id: d.id,
  name: d.name,
  principal: Number(d.principal) || 0,
  accruedInterest: Number(d.accruedInterest) || 0,
  annualRatePct: Number(d.annualRatePct) || 0,
  // undefined means yes; only an explicit false switches on the holding-pot path
  acceptsEarlyPayment: d.acceptsEarlyPayment !== false,
  annualDueMonth: Number(d.annualDueMonth) || null,
  minimumPayment: d.minimumPayment || { mode: 'none' },
  holdingPot: 0,
  isClosed: false
});

/**
 * Apply a payment. THIS ORDER IS MANDATORY: accrued interest is cleared before
 * anything touches principal. Any other order silently understates the payoff
 * period.
 */
const pay = (loan, amount) => {
  const p = Math.min(amount, loan.accruedInterest + loan.principal);
  if (p <= 0) return { paid: 0, interestPortion: 0, principalPortion: 0 };
  const interestPortion = Math.min(p, loan.accruedInterest);
  const principalPortion = p - interestPortion;
  loan.accruedInterest -= interestPortion;
  loan.principal -= principalPortion;
  return { paid: p, interestPortion, principalPortion };
};

const balanceOf = (loan) => loan.principal + loan.accruedInterest;

/**
 * Builds one MonthlyProjection row. Both the infeasible-budget early return
 * and the normal end-of-iteration path funnel through here so the row's
 * 13-key shape is declared exactly once. Values are passed through untouched
 * — no rounding, no derived fields — this is purely a single point of truth
 * for the shape.
 */
const buildMonthRow = ({
  index,
  month,
  installmentTotal,
  surplus,
  emergencyContribution,
  loanPayment,
  heldForAnnualPayment,
  interestAccrued,
  arrearsBalance,
  principalBalance,
  emergencyFundBalance,
  discretionaryCeiling,
  perDebt
}) => ({
  Index: index,
  Month: month,
  InstallmentTotal: installmentTotal,
  Surplus: surplus,
  EmergencyContribution: emergencyContribution,
  LoanPayment: loanPayment,
  HeldForAnnualPayment: heldForAnnualPayment,
  InterestAccrued: interestAccrued,
  AccruedInterestBalance: arrearsBalance,
  PrincipalBalance: principalBalance,
  EmergencyFundBalance: emergencyFundBalance,
  DiscretionaryCeiling: discretionaryCeiling,
  perDebt
});

/** Which single debt gets the money left after every minimum is paid. */
const pickTarget = (openLoans, budget) => {
  // A loan that already owes nothing has nothing left to attack — sending it
  // more money would just pile up in its holding pot forever.
  const candidates = openLoans.filter((l) => balanceOf(l) > EPS);
  if (!candidates.length) return null;

  if (budget.strategy === 'snowball') {
    return candidates.reduce((best, l) => (balanceOf(l) < balanceOf(best) ? l : best));
  }

  if (budget.strategy === 'manual') {
    for (const id of budget.manualOrder || []) {
      const found = candidates.find((l) => l.id === id);
      if (found) return found;
    }
    return candidates[0];
  }

  // avalanche: highest rate wins, ties broken by the smaller balance
  return candidates.reduce((best, l) => {
    if (l.annualRatePct > best.annualRatePct) return l;
    if (l.annualRatePct === best.annualRatePct && balanceOf(l) < balanceOf(best)) return l;
    return best;
  });
};

/**
 * Month-by-month cash-flow simulation.
 *
 * Pure: no I/O, no DB, no clock. startMonth is passed in so the UI can re-run
 * this on every slider drag and the tests can pin "Month 0 = October".
 *
 * @param {import('./types').Debt[]} debts
 * @param {import('./types').BudgetProfile} budget
 * @param {{ maxMonths?: number, startMonth?: import('./types').YearMonth }} [options]
 * @returns {import('./types').Projection}
 */
export const simulate = (debts, budget, options = {}) => {
  const maxMonths = options.maxMonths || MAX_MONTHS_DEFAULT;
  const startMonth = options.startMonth || { year: 2026, month: 1 };

  const active = (debts || []).filter((d) => !d.isClosed);

  const fixedObligations = active
    .filter((d) => d.type === 'hirePurchase' || d.type === 'installment')
    .map((d) => ({
      monthlyPayment: Number(d.monthlyPayment) || 0,
      periods: periodsRemaining(d)
    }));

  const loans = active.filter((d) => d.type === 'amortizing').map(makeWorkingLoan);

  const income = Number(budget.netMonthlyIncome) || 0;
  const extraIncome = Number(budget.extraIncome) || 0;
  const fixedExpenses = Number(budget.fixedExpenses) || 0;
  const discretionaryBudget = Number(budget.discretionaryBudget) || 0;
  const fundTarget = Number(budget.emergencyFundTarget) || 0;
  let fundCurrent = Number(budget.emergencyFundCurrent) || 0;

  const monthlyInterestThreshold = loans.reduce((s, l) => s + monthlyInterest(l), 0);

  const months = [];
  let totalInterestPaid = 0;
  let interestArrearsClearedMonth = null;
  const startedWithArrears = loans.some((l) => l.accruedInterest > EPS);
  let isInfeasible = false;
  let infeasibleReason = null;
  let minimumViablePayment = null;
  let monthlyShortfall = null;
  let prevTotalDebt = loans.reduce((s, l) => s + balanceOf(l), 0);

  for (let month = 0; month < maxMonths; month++) {
    const installmentTotal = fixedObligations.reduce(
      (s, o) => s + (month < o.periods ? o.monthlyPayment : 0),
      0
    );

    const openLoans = loans.filter((l) => !l.isClosed);

    // Debt free: no interest-bearing debt left AND no installment plans running.
    if (!openLoans.length && installmentTotal === 0) break;

    const surplus =
      income + extraIncome - fixedExpenses - discretionaryBudget - installmentTotal;

    // Interest accrues even in a month the budget cannot cover, so the recorded
    // row stays honest.
    if (surplus < 0) {
      let accrued = 0;
      for (const loan of openLoans) {
        const i = monthlyInterest(loan);
        loan.accruedInterest += i;
        accrued += i;
      }
      isInfeasible = true;
      infeasibleReason = 'budgetShortfall';
      minimumViablePayment = openLoans.reduce((s, l) => s + monthlyInterest(l), 0);
      // The binding constraint here is NOT interest — the fixed obligations
      // alone outrun the income, and with no interest-bearing debt at all
      // minimumViablePayment is a meaningless 0. MonthlyShortfall is the
      // honest figure for this failure mode: how much more cash the month
      // needs before a single baht can reach any debt.
      monthlyShortfall = -surplus;
      months.push(
        buildMonthRow({
          index: month,
          month: addMonths(startMonth, month),
          installmentTotal,
          surplus,
          emergencyContribution: 0,
          loanPayment: 0,
          heldForAnnualPayment: 0,
          interestAccrued: accrued,
          arrearsBalance: loans.reduce((s, l) => s + l.accruedInterest, 0),
          principalBalance: loans.reduce((s, l) => s + l.principal, 0),
          emergencyFundBalance: fundCurrent,
          discretionaryCeiling:
            income + extraIncome - fixedExpenses - installmentTotal - accrued,
          perDebt: loans.map((l) => ({
            debtId: l.id,
            paid: 0,
            interestPortion: 0,
            principalPortion: 0,
            balance: balanceOf(l),
            held: l.holdingPot
          }))
        })
      );
      break;
    }

    // The emergency fund is served before any debt, capped at the target.
    const contribution = resolveSchedule(
      budget.emergencyMonthlyContribution,
      budget.emergencyContributionOverrides,
      month
    );
    const emergencyContribution = Math.min(
      contribution,
      Math.max(0, fundTarget - fundCurrent),
      Math.max(0, surplus)
    );
    fundCurrent += emergencyContribution;

    const buffer = resolveSchedule(budget.shortTermBuffer, budget.bufferOverrides, month);
    let availableForLoan = Math.max(0, surplus - emergencyContribution - buffer);

    // ACCRUE FIRST, then pay. Reversing this shifts every row by one month.
    let interestAccrued = 0;
    for (const loan of openLoans) {
      const i = monthlyInterest(loan);
      loan.accruedInterest += i;
      interestAccrued += i;
    }

    const paidByDebt = new Map();
    const record = (loan, r) => {
      const cur = paidByDebt.get(loan.id) || {
        paid: 0,
        interestPortion: 0,
        principalPortion: 0
      };
      cur.paid += r.paid;
      cur.interestPortion += r.interestPortion;
      cur.principalPortion += r.principalPortion;
      paidByDebt.set(loan.id, cur);
    };

    let loanPayment = 0;
    let interestPaidThisMonth = 0;
    let heldThisMonth = 0;

    // Minimums on every loan that accepts monthly payment. A loan with
    // acceptsEarlyPayment === false has no monthly obligation at all.
    for (const loan of openLoans) {
      if (!loan.acceptsEarlyPayment) continue;
      if (availableForLoan <= 0) break;
      const due = Math.min(minimumDue(loan), availableForLoan);
      if (due <= 0) continue;
      const r = pay(loan, due);
      availableForLoan -= r.paid;
      loanPayment += r.paid;
      interestPaidThisMonth += r.interestPortion;
      record(loan, r);
    }

    // Everything left attacks debts in strategy order, CASCADING: the target
    // takes what it can absorb and the remainder falls through to the next
    // candidate. A single non-looping pay() here destroys up to a full month's
    // surplus in every month a debt closes, because pay() caps at the balance
    // and nothing else ever spends the difference.
    //
    // `attackable` is the candidate pool for this month's cascade. Each pass
    // either exhausts availableForLoan or fills its target to capacity, so the
    // target is dropped unconditionally: the loop can run at most once per
    // open loan and cannot spin. (pickTarget's own balance > EPS filter drops a
    // paid-off loan too, but a holding-pot loan's balance does not fall when
    // its pot is topped up, so the explicit drop is what guarantees progress.)
    const attackable = openLoans.slice();
    while (availableForLoan > EPS) {
      const target = pickTarget(attackable, budget);
      if (!target) break;
      attackable.splice(attackable.indexOf(target), 1);

      if (!target.acceptsEarlyPayment) {
        // NEVER pool more than the loan can owe. The pot is money already
        // committed to this loan, so its unpooled obligation is
        // balance - holdingPot. Without the cap the pot pools a whole surplus
        // a month against a debt that cannot absorb it, the annual release
        // caps at the balance, and the excess is deleted.
        const room = Math.max(0, balanceOf(target) - target.holdingPot);
        const add = Math.min(availableForLoan, room);
        if (add <= 0) continue;
        target.holdingPot += add;
        heldThisMonth += add;
        availableForLoan -= add;
      } else {
        const r = pay(target, availableForLoan);
        if (r.paid <= 0) continue;
        availableForLoan -= r.paid;
        loanPayment += r.paid;
        interestPaidThisMonth += r.interestPortion;
        record(target, r);
      }
    }

    // Release any holding pot whose annual due month is this calendar month.
    const calendarMonth = addMonths(startMonth, month).month;
    for (const loan of openLoans) {
      if (loan.acceptsEarlyPayment) continue;
      if (loan.holdingPot <= 0) continue;
      if (loan.annualDueMonth !== calendarMonth) continue;
      const r = pay(loan, loan.holdingPot);
      loan.holdingPot -= r.paid;
      loanPayment += r.paid;
      interestPaidThisMonth += r.interestPortion;
      record(loan, r);
    }

    totalInterestPaid += interestPaidThisMonth;

    let closedThisMonth = false;
    for (const loan of openLoans) {
      if (loan.principal <= EPS && loan.accruedInterest <= EPS) {
        loan.isClosed = true;
        closedThisMonth = true;
        // The debt is gone — any cash still sitting in its pot is no longer
        // earmarked for it and must not be treated as an outstanding
        // obligation (see the non-termination guard's holdingPot check).
        //
        // Assigning 0 here would DELETE that cash. The pot cap in the attack
        // step means a residue should never arise, but if one ever does the
        // money belongs back in the month's budget, not in the bin — so hand
        // it back to availableForLoan and keep the books balanced.
        const potResidue = loan.holdingPot;
        loan.holdingPot = 0;
        availableForLoan += potResidue;
      }
    }

    const arrearsBalance = loans.reduce((s, l) => s + l.accruedInterest, 0);
    if (
      interestArrearsClearedMonth === null &&
      startedWithArrears &&
      arrearsBalance <= EPS
    ) {
      interestArrearsClearedMonth = month;
    }

    months.push(
      buildMonthRow({
        index: month,
        month: addMonths(startMonth, month),
        installmentTotal,
        surplus,
        emergencyContribution,
        loanPayment,
        heldForAnnualPayment: heldThisMonth,
        interestAccrued,
        arrearsBalance,
        principalBalance: loans.reduce((s, l) => s + l.principal, 0),
        emergencyFundBalance: fundCurrent,
        discretionaryCeiling:
          income + extraIncome - fixedExpenses - installmentTotal - interestAccrued,
        perDebt: loans.map((l) => {
          const r = paidByDebt.get(l.id) || {
            paid: 0,
            interestPortion: 0,
            principalPortion: 0
          };
          return {
            debtId: l.id,
            paid: r.paid,
            interestPortion: r.interestPortion,
            principalPortion: r.principalPortion,
            balance: balanceOf(l),
            held: l.holdingPot
          };
        })
      })
    );

    // Non-termination guard. The source spec's "payment <= interest" rule is
    // wrong: that holds for the first seven months of its own fixture, which
    // is feasible because the installment plans are about to expire and free
    // up cash. Only stop when no new cash can ever arrive.
    const stillOpen = loans.filter((l) => !l.isClosed);
    if (stillOpen.length) {
      const noMoreCashComing =
        installmentTotal === 0 &&
        emergencyContribution === 0 &&
        buffer === 0 &&
        !hasFutureOverride(budget.emergencyContributionOverrides, month) &&
        !hasFutureOverride(budget.bufferOverrides, month) &&
        // Cash sitting in a holding pot IS on its way — it lands in the annual
        // due month. Without this the annual path is wrongly flagged
        // infeasible once the installments expire.
        stillOpen.every((l) => l.holdingPot <= EPS);

      const totalDebt = stillOpen.reduce((s, l) => s + balanceOf(l), 0);
      // A loan CLOSING this month is itself proof the plan is progressing, so
      // the guard must never fire on such a month. Without this, a month whose
      // attack money finishes off one debt can look flat on the remaining
      // ones and report a false IsInfeasible on a portfolio that in fact pays
      // off comfortably.
      if (noMoreCashComing && !closedThisMonth && totalDebt >= prevTotalDebt) {
        isInfeasible = true;
        infeasibleReason = 'debtNotFalling';
        minimumViablePayment = stillOpen.reduce((s, l) => s + monthlyInterest(l), 0);
        break;
      }
      prevTotalDebt = totalDebt;
    }
  }

  // Ran out of horizon with debt still open.
  if (!isInfeasible && loans.some((l) => !l.isClosed) && months.length >= maxMonths) {
    isInfeasible = true;
    infeasibleReason = 'horizonExhausted';
    minimumViablePayment = loans
      .filter((l) => !l.isClosed)
      .reduce((s, l) => s + monthlyInterest(l), 0);
  }

  return {
    Months: months,
    MonthsToPayoff: months.length,
    PayoffDate: months.length ? addMonths(startMonth, months.length - 1) : startMonth,
    TotalInterestPaid: totalInterestPaid,
    InterestArrearsClearedMonth: interestArrearsClearedMonth,
    MonthlyInterestThreshold: monthlyInterestThreshold,
    IsInfeasible: isInfeasible,
    // Which failure mode ended the run: 'budgetShortfall' (surplus < 0),
    // 'debtNotFalling' (the non-termination guard) or 'horizonExhausted'
    // (maxMonths reached). null on a feasible run.
    InfeasibleReason: isInfeasible ? infeasibleReason : null,
    // The monthly interest floor: the amount that must reach the loans each
    // month before balances start falling. Meaningful for 'debtNotFalling'
    // and 'horizonExhausted'. For 'budgetShortfall' the interest is NOT the
    // binding constraint — read MonthlyShortfall instead.
    MinimumViablePayment: isInfeasible ? minimumViablePayment : null,
    // How much the failing month is short by, i.e. the magnitude of the
    // negative surplus. Non-null only for 'budgetShortfall'.
    MonthlyShortfall: isInfeasible ? monthlyShortfall : null
  };
};
