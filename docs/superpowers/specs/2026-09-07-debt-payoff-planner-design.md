# Debt Payoff Planner — Design

Date: 2026-09-07
Status: Approved (pending user review of this doc)
Source spec: `debt-planner-feature-prompt.md` (external), adapted to this project

## Purpose

Let a user register every debt they carry, set a monthly budget, and see a
month-by-month simulation of when each debt is paid off — plus how that date
moves when they change their food budget, add side income, or switch payoff
strategy.

The single most important output is one number: **the month the user becomes
debt free**, and how it moves when one input changes.

Two things make naive payoff advice wrong, and this feature exists to model
both:

1. **Not all debt costs the same.** A 0% installment plan and a 19% cash card
   look identical on a bank statement and behave completely differently.
   Paying down the 0% one early gains nothing.
2. **Installments expire.** Monthly obligation is not constant — it falls in
   steps as each plan finishes, and the freed cash is exactly what accelerates
   payoff.

## Deviations from the source spec

The source spec assumes ASP.NET Core 10 + SQL Server + React. This repository
is a **React 18 + Vite frontend only** — all state lives in `localStorage` via
`src/context/WalletContext.jsx`. There is no backend. A backend was designed in
`docs/superpowers/specs/2026-08-28-database-design.md` but not built.

Decisions taken, in order:

| # | Decision | Rationale |
|---|---|---|
| 1 | **Frontend-only, API-ready.** Engine and data shapes follow the source spec; a `debtStorage.js` layer isolates persistence so `localStorage` can be swapped for `fetch` later. No API endpoints built now. | The golden vectors test a pure function with no DB dependency. Building auth + EF migrations first would delay the first real payoff number indefinitely. |
| 2 | **Separate state, prefilled from existing data.** `debts` and `budgetProfile` are new state and the planner's source of truth; on first load they are prefilled from `allocationSettings`, `fixedCosts`, `savingsGoals`. Existing tabs are not refactored. | Full merge would drag three tabs plus a localStorage migration into this feature. Fully separate state would make the user re-enter their salary and let two numbers drift apart. |
| 3 | **Multi-loan engine with per-debt interest rate**, three strategies (avalanche default / snowball / manual order). The source spec's §4 supports exactly one `AmortizingLoan` (`loan.Principal`, singular, no loop). | The user's requirement: model several interest-bearing debts, each with its own rate, set dynamically. A single-loan model cannot express a 19% card plus a 25% cash card plus a 6.5% mortgage. |
| 4 | **Add vitest**, write §8 golden vectors as real tests. The project currently has no test runner. | Interest compounding and payment-ordering errors produce numbers that still look plausible while being six months wrong. Eye inspection cannot catch them. |
| 5 | **Minimum payment supports fixed amount *and* percent-of-balance** (`{ mode, amount, percent, floor }`). | Thai credit cards and cash cards have a minimum of ~8% of outstanding balance, floored at ~500 THB — the minimum *falls every month*. A fixed-only field simulates the highest-rate, most common debt type wrongly. No fourth `DebtType` is added: a credit card is mathematically reducing-balance, identical to an amortizing loan; only the minimum-payment shape differs. |
| 6 | **UI ships in two phases.** Phase 1: debt CRUD, budget panel, summary cards, monthly schedule table. Phase 2: amortization chart, discretionary-ceiling chart, what-if sliders, strategy comparison. | The monthly table is the best debugging tool available — every column of `MonthlyProjection` visible per month, comparable to the golden vectors by eye. Verify the engine two ways before drawing charts on top of it. |
| 7 | **No intermediate rounding.** The source spec mandates `decimal(18,2)`. JavaScript has no decimal type. Full float64 precision is kept through the loop; money is rounded to 2 decimals only at the display and test-comparison boundary. | Rounding at every step accumulates roughly 0.27 THB of error over 54 months, which exceeds the ±0.01 tolerance §8 requires for `TotalInterestPaid`. Rounding once at the boundary drifts far less. If the engine is later ported to .NET, `decimal` will be more exact still. |

### Gaps in the source spec that had to be filled

Found while hand-verifying §8. Each is required for the golden vectors to pass:

1. **`shortTermBuffer` has no field in §3.2** but §4 uses it in the
   `availableForLoan` line. Without it, month 0's `LoanPayment` is 3,215.34
   instead of the required 2,015.34. Added to `BudgetProfile`.
2. **`EmergencyMonthlyContribution` is a scalar in §3.2** but the fixture needs
   2,000 for months 0–2 then 3,000 from month 3. Added an override schedule.
   `shortTermBuffer` needs the same (1,200 for months 0–1, then 0).
3. **The non-termination guard as written in §4 is wrong for the fixture
   itself.** "If `payment <= interest` every month the balance never falls" is
   true for the first seven months of §8, which is a *feasible* scenario — the
   installments are about to expire and release cash. See "Non-termination
   guard" below for the corrected condition.
4. **`minimumPayment` default must be `none` (0), not interest.** Month 0 of §8
   pays 2,015.34 against interest of 3,342.29. A minimum defaulting to the
   month's interest would flag a shortfall and break every vector. Growing
   interest arrears is the correct behaviour — it is why
   `InterestArrearsClearedMonth` is 7.

### Verification that §8 is internally consistent

Hand-checked before committing to it:

```
installmentTotal m0 = 856.90 + 1699.00 + 1998.33 + 2496.66 + 439.41 + 3374.00
                    = 10,864.30                                    matches
surplus m0          = 29000 - 7920.36 - 5000 - 10864.30 = 5,215.34 matches
threshold           = 610000 x 0.06575 / 12 = 3,342.29             matches
availableForLoan m0 = 5215.34 - 2000 (emergency) - 1200 (buffer)
                    = 2,015.34                                     matches LoanPayment
accrued balance m0  = 21306 + 3342.29 - 2015.34 = 22,632.95        matches
installmentTotal m2 = 10864.30 - 2496.66 (guitar done) = 8,367.64  matches
m3: obligations     = 856.90 + 1699.00 + 3374.00 = 5,929.90
    surplus         = 29000 - 7920.36 - 5000 - 5929.90 = 10,149.74
    LoanPayment     = 10149.74 - 3000 - 0 = 7,149.74               matches
```

The source spec's numbers are reproducible. Implementation targets them exactly.

## Scope

**In scope**

- CRUD for debts (three types)
- Monthly cash-flow simulation engine, multi-loan, per-debt rate
- Payoff projection with what-if inputs (discretionary budget, extra income)
- Payoff strategy ranking and avalanche/snowball comparison
- Read-only dashboard: payoff date, amortization chart, monthly schedule table,
  discretionary ceiling per month

**Out of scope**

- Payment execution, bank integration, transaction import
- Multi-currency
- Credit score, refinancing offers, product recommendations
- Backend API, auth, database (see decision 1)
- Anything readable as licensed financial advice (see "Product constraints")

## File layout

```
src/features/debt/
  DebtTab.jsx                 tab shell
  DebtListPanel.jsx           debt list, edit/delete
  AddDebtModal.jsx            form, fields switch on type
  BudgetProfilePanel.jsx      income / fixed / discretionary / emergency / buffer
  PayoffSummaryCards.jsx      summary cards + infeasible banner + assumptions box
  ScheduleTable.jsx           monthly schedule table
  useDebtState.js             state + CRUD hook
  debtStorage.js              localStorage I/O + prefill   <- the API swap point
  engine/
    payoffSimulator.js        pure simulate()
    strategyRanker.js         payoff ordering
    debtMath.js               balances, minimum payments, schedules, rebate
    types.js                  JSDoc typedefs, no runtime code
    __tests__/
      goldenFixture.js
      payoffSimulator.golden.test.js
      payoffSimulator.edge.test.js
      strategyRanker.test.js
```

Phase 2 adds `AmortizationChart.jsx`, `WhatIfSliders.jsx`, `CeilingPanel.jsx`,
`StrategyPanel.jsx`.

`WalletContext.jsx` is already ~380 lines. Debt state lives in
`useDebtState.js`; the context calls the hook and spreads the result into its
value, growing by about three lines. Consumers still use `useWallet()` like
every other feature.

## Data model

### Debt

```js
{
  id, name,
  type: 'amortizing' | 'hirePurchase' | 'installment',

  // amortizing only
  principal, accruedInterest, annualRatePct,
  frequency: 'monthly' | 'annual',
  annualDueMonth,                 // 1-12, required when frequency === 'annual'
  acceptsEarlyPayment,            // false => cash is held and paid in annualDueMonth
  minimumPayment: {
    mode: 'none' | 'fixed' | 'percentOfBalance',
    amount,                       // mode 'fixed'
    percent, floor                // mode 'percentOfBalance', e.g. 8 and 500
  },

  // hirePurchase | installment
  monthlyPayment, periodsPaid, periodsTotal,
  settlementQuote, settlementQuoteDate,

  isClosed
}
```

`periodsRemaining = periodsTotal - periodsPaid`

`outstandingBalance` for `hirePurchase` and `installment` is
`monthlyPayment * periodsRemaining`. **Never an interest formula.** Treating a
hire-purchase contract as a reducing-balance loan is the most common bug in
this domain and produces advice wrong by an order of magnitude.

| Type | Interest behaviour | Does paying early help? |
|---|---|---|
| `amortizing` | Accrues monthly on outstanding principal | Yes — principal drops immediately, next month's interest falls |
| `hirePurchase` | Total interest baked into the contract, never recalculated | Only via the lender's rebate on a settlement quote — never derived from a rate |
| `installment` | None (0%) | No |

### BudgetProfile

```js
{
  netMonthlyIncome, fixedExpenses, discretionaryBudget, extraIncome,
  emergencyFundCurrent, emergencyFundTarget,

  emergencyMonthlyContribution,                            // default value
  emergencyContributionOverrides: [{ fromMonth, amount }],  // step schedule

  shortTermBuffer,                                         // default value
  bufferOverrides: [{ fromMonth, amount }],

  strategy: 'avalanche' | 'snowball' | 'manual',
  manualOrder: [debtId]
}
```

**Schedule resolution.** The value at month `m` is the `amount` of the last
override whose `fromMonth <= m`; if none matches, the scalar default. Overrides
are kept sorted by `fromMonth`.

## Simulation engine

```js
simulate(debts, budget, options) -> Projection
// options = { maxMonths: 600, startMonth: { year, month } }
```

Pure. No I/O, no DB, no `new Date()` inside — `startMonth` is passed in. This is
why §8 can say "Month 0 = October".

Before the loop:

```
fixedObligations = debts where type in {hirePurchase, installment} and not isClosed
interestBearing  = debts where type === 'amortizing' and not isClosed
```

### Per-month loop

```
for month = 0 .. maxMonths-1:

  step 1  installmentTotal = sum of d.monthlyPayment over fixedObligations
                             where month < d.periodsRemaining

  step 2  surplus = income + extraIncome - fixedExpenses
                  - discretionaryBudget - installmentTotal

          if surplus < 0:
              IsInfeasible = true; record this row; break

  step 3  contribution = resolveSchedule(emergency, month)
          emergencyContribution = min(contribution,
                                      max(0, target - fundCurrent),
                                      max(0, surplus))
          fundCurrent += emergencyContribution

  step 4  buffer = resolveSchedule(buffer, month)
          availableForLoan = max(0, surplus - emergencyContribution - buffer)

  step 5  ACCRUE FIRST, on every interest-bearing debt:
              for loan in interestBearing:
                  interest = loan.principal * (loan.annualRatePct / 100 / 12)
                  loan.accruedInterest += interest

  step 6  PAY MINIMUMS on every interest-bearing debt:
              for loan in interestBearing:
                  minDue = per loan.minimumPayment.mode:
                      'none'             -> 0
                      'fixed'            -> amount
                      'percentOfBalance' -> max(floor,
                                                (principal + accruedInterest)
                                                * percent / 100)
                  minDue = min(minDue, principal + accruedInterest)
                  paid = min(minDue, availableForLoan)
                  pay(loan, paid)
                  availableForLoan -= paid

  step 7  ATTACK with what is left, CASCADING through the strategy order:
              attackable = open loans
              while availableForLoan > EPS:
                  target = pickTarget(attackable) per budget.strategy:
                      'avalanche' -> highest annualRatePct
                                     (tie broken by smaller balance)
                      'snowball'  -> smallest (principal + accruedInterest)
                      'manual'    -> first still-open id in manualOrder,
                                     else the first open loan
                      (candidates are loans with balance > EPS; null stops
                       the cascade)
                  if target is null: break
                  drop target from attackable
                  if target.acceptsEarlyPayment is false:
                      room = max(0, balance(target) - target.holdingPot)
                      add  = min(availableForLoan, room)
                      target.holdingPot += add;  availableForLoan -= add
                  else:
                      paid = pay(target, availableForLoan)
                      availableForLoan -= paid

          The loop is what makes the step correct. `pay()` caps at the target's
          balance, so a single non-looping `pay(target, availableForLoan)`
          leaves the remainder in `availableForLoan` and nothing ever spends
          it — up to a full month's surplus is destroyed in every month a debt
          closes, which both understates the payoff speed and can make the
          non-termination guard fire on a feasible plan.

          Termination: each pass either exhausts `availableForLoan` or fills
          its target to capacity, so the target is dropped unconditionally and
          the loop runs at most once per open loan. Dropping is not optional
          for the holding-pot branch — topping up a pot does not reduce the
          loan's balance, so `pickTarget` would keep returning it forever.

          The cascade stops with money unspent only when no open debt can
          absorb another baht. That is correct, not a leak.

  step 8  close any loan with principal <= 0 and accruedInterest <= 0;
          hand any pot residue on a closing loan BACK to availableForLoan
          rather than assigning 0 (assigning 0 deletes real cash)
          append MonthlyProjection row
          if interestBearing all closed: break
          check the non-termination guard
```

`pay(loan, amount)` — **this order is mandatory.** Any other order silently
understates the payoff period:

```js
const p = Math.min(amount, loan.accruedInterest + loan.principal);
const interestPortion  = Math.min(p, loan.accruedInterest);
const principalPortion = p - interestPortion;
loan.accruedInterest -= interestPortion;
loan.principal       -= principalPortion;
```

Interest is accrued **before** the payment is applied, not after. Reversing it
shifts every row by one month.

### Why §8 still matches exactly

The §8 fixture has one `amortizing` debt with `minimumPayment.mode === 'none'`.

- Step 6 computes `minDue = 0`, pays nothing, leaves `availableForLoan` intact
- Step 7 has one candidate under `avalanche`, so the whole `availableForLoan`
  goes to it

The loop reduces to the source spec's pseudocode line for line. Month 0 gives
2,015.34 and an accrued balance of 22,632.95; month 3 gives 7,149.74.

### `acceptsEarlyPayment === false`

The holding-pot path is driven solely by `acceptsEarlyPayment === false`, which
requires `annualDueMonth` to be set. Such a debt **receives no payment in steps
6 or 7.** Instead:

- its minimum payment is forced to 0 in step 6 regardless of
  `minimumPayment.mode` — an annually-due loan has no monthly obligation
- if it is selected as the step 7 target, the money is added to
  `holdingPot[loanId]` rather than paid — **capped at what the loan can still
  owe**, i.e. `balance - holdingPot` (see below)
- in the calendar month matching `annualDueMonth`, the whole pot is paid via
  `pay(loan, holdingPot[loanId])` and the pot resets to 0
- **interest still accrues every month in step 5**

It stays eligible as a step 7 target — under `avalanche` a high-rate
annually-due loan should still attract the attack money, it just pools until
the due month. Holding cash while interest accrues is strictly worse than
paying monthly, so this path must produce a later payoff and higher total
interest than the monthly path — asserted as a direction, not a number.

**The pot is capped, and the excess cascades.** The pot is money already
committed to that loan, so the loan's *unpooled* remaining obligation is
`balance - holdingPot`, and that is the ceiling on what step 7 may add in a
month. Without the cap an uncapped pot pools an entire surplus a month against
a debt that cannot absorb it: `pay()` caps the annual release at the balance
and the excess is silently deleted, while every other debt in the portfolio
receives nothing for months. Once a pot is full the loan is dropped from
`attackable` and the remainder falls through to the next candidate in the same
step 7 loop.

Worked example — a 50,000 loan at 20% due in June alongside a 500,000 mortgage
at 5%, avalanche, 25,000/month available, month 0 = October. The pot fills in
months 0-2 (25,000 + 25,000 + 2,500, ending at exactly the 52,500 owed), the
mortgage takes the 22,500 of overflow from month 2 onward, and the June release
pays 57,500 and closes the loan. Payoff 24 months, total interest 35,803.51.
Uncapped this pooled 225,000, paid 57,500, deleted 167,500, and reported 31
months and 51,111.85.

Many agricultural and seasonal loans work this way and the difference in total
interest is material.

### Non-termination guard

The source spec's condition is wrong for its own fixture (see gap 3). The
corrected condition: stop only when **no new cash can ever be released** and
the debt is not falling.

```
noMoreCashComing = installmentTotal === 0        // every plan has expired
                && emergencyContribution === 0   // fund is at target
                && buffer === 0
                && no override has fromMonth in (month, month + 12]  // see below
                && every open loan's holdingPot is empty  // no annual payment pending

if noMoreCashComing and not closedThisMonth
                    and totalDebt >= totalDebt(previous month):
    IsInfeasible = true
    InfeasibleReason = 'debtNotFalling'
    MinimumViablePayment = sum of (principal * rate / 12) over open loans
    break
```

`closedThisMonth` — **a loan closing this month is itself proof the plan is
progressing**, so the guard must never fire on such a month. Without it, a
month whose attack money finishes off one debt can look flat on the remaining
ones and report a false `IsInfeasible` on a portfolio that in fact pays off
comfortably. (The step 7 cascade removes the usual cause; this clause is the
belt to its braces.)

The override look-ahead is **bounded to 12 months** (`hasFutureOverride`'s
`withinMonths`). An unbounded `fromMonth > month` test lets a single stale
override at, say, month 400 keep the guard switched off for 400 months, so a
portfolio whose debt is visibly growing grinds all the way to `maxMonths`
instead of reporting infeasibility. One year is the horizon over which a
household budget change is plausibly real.

`maxMonths = 600` remains as a final hard stop. Infeasible input returns a
structured result — it never hangs and never throws.

### The three infeasible modes

`InfeasibleReason` names which one ended the run, because the useful number
differs:

| `InfeasibleReason` | Cause | The number to show |
|---|---|---|
| `'budgetShortfall'` | step 2's `surplus < 0` | `MonthlyShortfall` |
| `'debtNotFalling'` | the guard above | `MinimumViablePayment` |
| `'horizonExhausted'` | `maxMonths` reached with debt open | `MinimumViablePayment` |

`MonthlyShortfall` is the magnitude of the negative surplus — how much more
cash the month needs before a single baht can reach any debt. It is the only
honest figure for `'budgetShortfall'`: there the obligations simply outrun the
income, and with no interest-bearing debt in the portfolio at all
`MinimumViablePayment` is a meaningless `0`.

### Output

```js
Projection {
  Months: MonthlyProjection[],
  MonthsToPayoff, PayoffDate,
  TotalInterestPaid,
  InterestArrearsClearedMonth,   // null when there were none
  MonthlyInterestThreshold,
  IsInfeasible,
  InfeasibleReason,              // 'budgetShortfall' | 'debtNotFalling'
                                 // | 'horizonExhausted' | null
  MinimumViablePayment,          // interest floor; set when IsInfeasible
  MonthlyShortfall               // set only for 'budgetShortfall'
}

// 13 fields
MonthlyProjection {
  Index, Month,
  InstallmentTotal, Surplus,
  EmergencyContribution, LoanPayment,
  HeldForAnnualPayment,          // added to holding pots THIS month
  InterestAccrued, AccruedInterestBalance,
  PrincipalBalance, EmergencyFundBalance,
  DiscretionaryCeiling,
  perDebt: [{ debtId, paid, interestPortion, principalPortion, balance, held }]
}
```

`perDebt[].paid` counts money paid to the debt this month, which for an
annually-due loan includes a pot release funded in earlier months.
`perDebt[].held` is that loan's pot balance at the end of the month. So the
cash that actually left a month's budget is
`sum(paid) + sum(held_now - held_prev)`, and that must equal the month's
`availableForLoan` whenever any debt could still absorb another baht — the
money-conservation invariant asserted in the tests.

`perDebt` is an addition to the source spec, required because multi-loan
payments cannot otherwise be displayed or debugged.

`MonthlyInterestThreshold` is the sum of `principal * rate / 12` over all
interest-bearing debts, computed at month 0. It is the break-even level the
user must stay above, and a first-class output — the frontend does not
recompute it. For a single loan it is 3,342.29.

### Implementation checkpoint: `TotalInterestPaid`

§8 requires `131,445.49`. The spec does not define what is counted, and two
readings are possible:

1. Sum of `interestPortion` actually paid each month — **includes** clearing
   the 21,306 of pre-existing arrears
2. Sum of `interestAccrued` newly generated during the simulation —
   **excludes** it

They differ by about 21,306 THB and the given figures cannot distinguish them.
Implement reading 1 first (closer to the name "Paid"); if the test fails, switch
to reading 2. This is a checkpoint in the build order, not an open question.

## Payoff strategy ranking

Separate service, `strategyRanker.js`. Ranks debts by the **actual cost of
carrying them**, not by size and not by balance — a large 0% balance costs
nothing.

`TotalRemainingCost` per debt:

- `amortizing` — projected interest over the remaining life
- `installment` — `0`
- `hirePurchase` — `(monthlyPayment * periodsRemaining) - settlementQuote`,
  i.e. only the rebate actually obtainable today. **Never computed from an
  interest rate.** When `settlementQuote` is null the debt is flagged
  `quoteMissing` and the UI shows "ask your lender for a payoff quote".

Ranked descending. Each rank carries a plain-language Thai reason so the UI
never invents one.

**When the projection is infeasible the ranking cannot be derived from it.**
`simulate` truncates its rows, so summing `perDebt[].interestPortion` collapses
an amortizing debt's `totalRemainingCost` toward zero and can rank a real
interest-bearing loan *below* a hire-purchase rebate — inverting the order the
UI presents as an action plan. In that case:

- every row carries `rankingUnreliable: true` (`false` on a feasible run)
- amortizing rows report `totalRemainingCost: null` — no interest estimate is
  ever fabricated — with a reason saying the budget must be fixed first
- those rows are pinned **above** the non-amortizing ones (an interest-bearing
  debt always costs more to carry than a 0% plan), ordered by descending
  `annualRatePct` then descending balance, both facts about the debt itself
- `installment` and `hirePurchase` rows are unaffected: their cost never came
  from the projection

Every returned row therefore has the shape
`{ debtId, name, type, totalRemainingCost, quoteMissing, rebateDecayPerMonth,
rankingUnreliable, reason }`.

`hirePurchase` also exposes `RebateDecayPerMonth` — the rebate shrinks every
period, and users routinely plan around a rebate that will have mostly
evaporated by the time they act.

## Discretionary ceiling

Per month:

```
availableBeforeDiscretionary = income + extraIncome - fixedExpenses
                             - installmentTotal
discretionaryCeiling         = availableBeforeDiscretionary
                             - monthlyInterestThreshold
breathingRoom                = discretionaryCeiling - discretionaryBudget
```

`discretionaryCeiling` is the spend level at which the debt stops shrinking. It
is **a limit, not a target**, and is labelled that way in the UI
("ขีดจำกัด ไม่ใช่เป้า"). `breathingRoom` is shown with sign and colour;
negative means the debt grows that month.

Because installments expire, the ceiling rises in steps. That step chart is the
most motivating view in the feature.

## State, persistence, prefill

```js
STORAGE_KEYS.DEBTS          = 'finsmart_debts_v1'
STORAGE_KEYS.BUDGET_PROFILE = 'finsmart_budget_profile_v1'
```

Both are wired into the existing `exportBackupJSON`, `importBackupJSON`,
`resetToDemo` and `clearAllData` in `WalletContext.jsx` — otherwise backups
would silently omit the user's debts.

`debtStorage.js` is the single swap point. It reads and writes `localStorage`
today; replacing its body with `fetch('/api/debts')` later touches neither the
engine nor the UI.

### First-load prefill

When `budgetProfile` is absent from `localStorage`, build it from existing
state:

| Field | Source |
|---|---|
| `netMonthlyIncome` | `allocationSettings.monthlyIncome` |
| `fixedExpenses` | sum of `fixedCosts.amount` where category is **not** `ชำระหนี้สิน (บัตรเครดิต/สินเชื่อบุคคล)` |
| `discretionaryBudget` | latest month's `transactions` in categories `อาหารและเครื่องดื่ม` + `ช้อปปิ้งและของใช้` |
| `emergencyFundCurrent` / `Target` / `Contribution` | first `savingsGoals` entry with `category === 'ความมั่นคง'` |
| `shortTermBuffer` | `0` |

`debts` prefills as **empty**. Existing `fixedCosts` in the debt category are
not auto-converted: they carry no rate, no principal and no period count.
Inventing those would violate the product constraint against fabricating
figures.

Instead, when such fixed costs exist, show a prompt —
"เจอ N รายการหนี้ในฟิกคอส — เพิ่มเข้าแผนปลอดหนี้?" — which opens
`AddDebtModal` prefilled with the name and `monthlyPayment`. The user supplies
the rate, principal and periods.

Every prefilled field is editable. After prefill, `budgetProfile` is the
planner's source of truth and does not sync back to `allocationSettings`.

## UI

### Phase 1

New tab `debt`, labelled "ปลอดหนี้", icon `Landmark` from `lucide-react`,
inserted after `projection` in the `TABS` array in `src/components/Navbar.jsx`.

The existing `projection` tab is left alone: it models daily cash flow and
runway over 30 days, a different horizon and a different mental model from
month-by-month payoff over years.

Layout follows existing patterns (`.card`, `.grid-cols-*`, `.custom-table`,
`StatCard`):

```
summary cards, 4 across
  debt-free month | total interest | break-even per month | debt remaining

infeasible banner (only when IsInfeasible)
  budget short — you must pay at least X per month before the debt starts falling

assumptions box (always visible, never a tooltip)
  computed from: income 29,000 - fixed 7,920 - discretionary 5,000
  a projection from figures you entered, not financial advice

left column (1)          right column (2)
  BudgetProfilePanel       DebtListPanel + add-debt button
                           badges per type, rate, periods remaining

monthly schedule table (scrolls internally)
  month | installments | surplus | emergency | loan payment
        | interest accrued | arrears | principal | ceiling
```

The table doubles as the debugging tool: its columns mirror
`MonthlyProjection` exactly, so it can be compared to the golden vectors by
eye. Rows where principal does not fall are dimmed; the month matching
`InterestArrearsClearedMonth` gets a marker.

`AddDebtModal` fields switch on type:

- `amortizing` — principal, accrued interest, **annual rate %**, monthly or
  annual, accepts early payment, minimum payment (fixed / percent-of-balance
  with floor / none)
- `hirePurchase` — monthly payment, periods paid and total, **settlement quote
  from the lender plus quote date** (may be left blank, which shows
  "ขอใบเสนอปิดบัญชีจากเจ้าหนี้")
- `installment` — monthly payment, periods paid and total, with the note
  "ผ่อน 0% โปะก่อนไม่ประหยัด"

### Phase 2

- `AmortizationChart` — chart.js is already a dependency; line chart with three
  series: principal, interest arrears, emergency fund
- `CeilingPanel` — step bar chart of `discretionaryCeiling` with
  `discretionaryBudget` overlaid; negative `breathingRoom` in red; labelled
  "ขีดจำกัด ไม่ใช่เป้า"
- `WhatIfSliders` — discretionary budget and extra income, via `useMemo` and
  `useDeferredValue`. No network debounce is needed because there is no
  network: 60 months across 8 debts is under 5 ms of pure JS, well inside the
  200 ms target
- `StrategyPanel` — ranked payoff order with reasons, plus an
  avalanche/snowball toggle that shows the **total interest difference** by
  running `simulate` twice
- `RebateDecayPerMonth` shown on each `hirePurchase` card

## Product constraints

- **Never present output as financial advice.** It is a projection from
  user-entered figures. Every view carries a short disclaimer.
- **Never fabricate a settlement quote.** A null `settlementQuote` shows "ask
  your lender for a payoff quote", never an estimate from a rate. An estimated
  rebate that turns out to be five times too high sends the user into a bad
  decision — the exact failure this feature exists to prevent.
- **Assumptions on screen, not buried in a tooltip.** The whole projection
  rests on user-entered numbers; if the food budget is a guess, the payoff date
  is a guess.
- **No gamification, streaks, or motivational nagging.** `canvas-confetti` is
  already in the dependencies and must not be used on this tab. Users in debt
  do not need a mascot.
- Nothing here nudges toward new borrowing, consolidation products, or any
  third-party offer.

## Testing

```bash
npm i -D vitest
```

Scripts: `"test": "vitest run"`, `"test:watch": "vitest"`. `vite.config.js`
needs no change and jsdom is not required — the engine is pure JS and never
touches the DOM.

### `goldenFixture.js`

The §8 fixture as data:

```js
export const GOLDEN_BUDGET = {
  netMonthlyIncome: 29000, fixedExpenses: 7920.36,
  discretionaryBudget: 5000, extraIncome: 0,
  emergencyFundCurrent: 8780, emergencyFundTarget: 40000,
  emergencyMonthlyContribution: 2000,
  emergencyContributionOverrides: [{ fromMonth: 3, amount: 3000 }],
  shortTermBuffer: 1200,
  bufferOverrides: [{ fromMonth: 2, amount: 0 }],
  strategy: 'avalanche', manualOrder: []
};

// amortizing: principal 610000, accruedInterest 21306, annualRatePct 6.575,
//   frequency 'monthly', acceptsEarlyPayment true,
//   minimumPayment { mode: 'none' }
// installment: phone 856.90 x 9, camera 1699.00 x 6, monitor 1998.33 x 3,
//   guitar 2496.66 x 2, keyboard 439.41 x 3
// hirePurchase: car 3374.00 x 14
// each with periodsPaid 0 and periodsTotal equal to the periods remaining

export const GOLDEN_START = { year: 2026, month: 10 };  // Month 0 = October
```

### `payoffSimulator.golden.test.js`

All 13 assertions from the §8 table:

| Assertion | Value |
|---|---|
| `MonthlyInterestThreshold` | 3,342.29 |
| `Months[0].InstallmentTotal` | 10,864.30 |
| `Months[0].Surplus` | 5,215.34 |
| `Months[0].LoanPayment` | 2,015.34 |
| `Months[0].AccruedInterestBalance` | 22,632.95 |
| `Months[2].InstallmentTotal` | 8,367.64 |
| `Months[3].LoanPayment` | 7,149.74 |
| `InterestArrearsClearedMonth` | 7 |
| `Months[7].PrincipalBalance` | 609,154.95 |
| `Months[13].EmergencyFundBalance` | 40,000.00 |
| `Months[17].InstallmentTotal` | 0.00 |
| `MonthsToPayoff` | 54 |
| `TotalInterestPaid` | 131,445.49 |

Money compared with `expect(actual).toBeCloseTo(expected, 2)` — ±0.01. Month
counts compared with `toBe` — exact, no tolerance.

Sensitivity tables as `describe.each`:

| discretionaryBudget | MonthsToPayoff | TotalInterestPaid |
|---|---|---|
| 3,000 | 47 | 117,038 |
| 4,000 | 50 | 123,754 |
| 5,000 | 54 | 131,445 |
| 6,000 | 58 | 140,350 |
| 7,000 | 62 | 150,749 |

| extraIncome | MonthsToPayoff | TotalInterestPaid |
|---|---|---|
| 0 | 54 | 131,445 |
| 3,000 | 44 | 111,129 |
| 5,000 | 40 | 101,200 |
| 8,000 | 34 | 89,801 |

The sensitivity tables give interest to the nearest whole baht, so those rows
use a ±1 tolerance. The main fixture's 131,445.49 uses ±0.01.

### `payoffSimulator.edge.test.js`

From §8's edge case list:

1. `discretionaryBudget` high enough that `surplus < 0` — `IsInfeasible` is
   true, the run terminates instead of reaching 600 months, and
   `MinimumViablePayment` is populated
2. `accruedInterest === 0` — the first payment reaches principal immediately
3. `acceptsEarlyPayment === false` with `annualDueMonth === 6` — a **later**
   `MonthsToPayoff` and **higher** `TotalInterestPaid` than the monthly path
   (direction asserted, not a figure)
4. all debts closed — empty projection, no crash
5. `periodsPaid === periodsTotal` — excluded from `installmentTotal`

Added for multi-loan, which §8 does not cover but which is the user's core
requirement:

6. two loans at 19% and 6.5% under `avalanche` — all attack money goes to the
   19% loan; the 6.5% loan receives only its minimum
7. the same fixture under `snowball` — `TotalInterestPaid` is **higher** than
   under avalanche (direction)
8. `minimumPayment.mode === 'percentOfBalance'` at 8% with a floor of 500 — the
   minimum falls every month as the balance falls, then holds flat at 500
9. `mode === 'fixed'` with `availableForLoan` insufficient to cover every
   minimum — minimums are paid in order until the money runs out; nothing goes
   negative and nothing throws

### `payoffSimulator.cascade.test.js`

The money-conservation invariant and the step 7 regressions. This file exists
because nothing else asserted that a month's payments equal the money the month
had, which is how the destroyed-cash defects survived four review passes.

1. **The invariant** — for every month, `sum(perDebt[].paid) + Σ(held_now -
   held_prev)` equals the month's `availableForLoan` (re-derived from the row's
   own `Surplus`, `EmergencyContribution` and the buffer resolved for that
   month, not from the loop), within `EPS`. The equality is asserted whenever
   any debt could still absorb another baht — capacity being `balance - held` —
   and relaxed to `<=` only when every debt is full. Applied to the golden
   fixture, a closing debt under both `avalanche` and `snowball`, the
   holding-pot path, and the minimums-exceed-budget case.
2. **Cascade** — two loans of 100,000 at 5% and 25%, 25,000/month, `avalanche`:
   in month 4 the 25% loan takes its last 5,541.86 and the remaining 19,458.14
   falls through to the 5% loan. 9 months, 8,384.17 interest. (Non-cascading:
   10 months, 8,714.88, with 19,458.14 destroyed.)
3. **Pot cap** — the 50,000-at-20%-annual plus 500,000-at-5%-mortgage fixture
   above: no pot ever exceeds its loan's balance, the mortgage receives money
   from month 2, 24 months, 35,803.51 interest. (Uncapped: 31 months,
   51,111.85, 167,500 destroyed.)
4. **No false infeasibility** — the same two-loan portfolio under `snowball`,
   and under `manual` with an empty order, both come back
   `IsInfeasible: false`. (Before: `IsInfeasible: true`, `MonthsToPayoff: 5`,
   `MinimumViablePayment: 2,083.33` for a user with 25,000/month of free cash.)
5. **Budget shortfall** — a hire-purchase of 8,000 plus an installment of 1,000
   against 12,000 of income and 4,000 of fixed expenses returns
   `InfeasibleReason: 'budgetShortfall'` and `MonthlyShortfall: 1,000`, not a
   `MinimumViablePayment` of 0.
6. **Bounded override look-ahead** — a flat portfolio reports infeasibility on
   month 0 even with a leftover override at month 400, but still waits when the
   override lands within the 12-month window.
7. **`manual`** — an explicit `manualOrder` overrides both rate and balance; an
   empty or missing order falls back to the first open debt.

### `strategyRanker.test.js`

- `installment` yields `TotalRemainingCost === 0` even on a large balance
- `hirePurchase` with no `settlementQuote` is flagged `quoteMissing`, never
  given an estimated figure
- ranking is descending by `TotalRemainingCost`
- a feasible projection leaves every row `rankingUnreliable: false`
- an **infeasible** projection flags every row `rankingUnreliable: true`, gives
  the amortizing rows `totalRemainingCost: null`, and still keeps the
  interest-bearing loan above the hire-purchase rebate

## Build order

| # | Task | Done when |
|---|---|---|
| 1 | vitest, `types.js`, `goldenFixture.js`, all test files (**all failing**) | `npm test` runs and reports failures |
| 2 | `debtMath.js` — balances, the three minimum-payment modes, `resolveSchedule`, rebate decay | its unit tests pass |
| 3 | `payoffSimulator.js`, single-loan path — **all 13 §8 assertions plus both sensitivity tables** | golden tests green; resolve the `TotalInterestPaid` checkpoint here |
| 4 | extend to multi-loan and the three strategies — tests 6–9 pass **and §8 is still green** | whole suite green |
| 5 | `acceptsEarlyPayment === false` path and the non-termination guard — edge cases 1 and 3 | whole suite green |
| 6 | `strategyRanker.js` | ranker tests pass |
| 7 | `useDebtState`, `debtStorage`, prefill, backup/reset wiring | debts survive a page reload; backup JSON contains them |
| 8 | UI phase 1 — tab, summary cards, assumptions box, both panels, schedule table | entering the §8 fixture in the app produces a table matching the tests |
| 9 | UI phase 2 — chart, ceiling, sliders, strategy panel | dragging a slider updates the numbers immediately |

**Gate at step 4:** §8 must still be green after the multi-loan
generalization. If it breaks, the generalization is wrong and must be fixed
before proceeding — not worked around in the UI.

Steps 1–8 form a working vertical slice, matching the source spec's
"ship 1–5 before starting 6".

## Definition of done

- All §8 golden vectors pass, plus the four multi-loan tests
- `simulate` is a pure function with no DB, clock, or config dependency
- Infeasible input returns a structured result — never hangs, never throws
- `hirePurchase` debts are never amortized as reducing-balance loans
- A null `settlementQuote` never becomes an estimated figure
- Every projection view renders the assumptions it was computed from
- Slider drag updates the chart in under 200 ms at 60 months
- §8 is still green after the multi-loan generalization
