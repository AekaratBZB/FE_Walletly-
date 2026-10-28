# Recurring Income & Auto Fixed-Cost Rows — Design

Date: 2026-10-29
Status: Draft (awaiting review)
Scope: BE (`D:\BE_wallet_net`) + FE (`D:\FE_wallet`)

## 1. Goal

Users should not have to type the same salary and fixed costs every month.

- A user can set recurring income (salary and other regular income) the same way they set fixed costs: amount, category, start/end month, day of month.
- Every fixed cost and recurring income that is active in a month shows up in the transaction list on its due day, like a transaction the user entered.
- Rows whose date has not arrived yet are **projected**: shown, but not recorded as income/expense.
- When the date arrives the row becomes a real transaction automatically. No background job: it happens when the user's data is read.
- Editing a fixed cost or recurring income changes everything that has not happened yet; what is already recorded keeps its history.

Success criteria:
- User with salary 50,000 on day 1 and car loan 12,000 on day 1 (48 months) opens November 2026 on 29 Oct: sees both rows as projected; opens October: sees both as real transactions; dashboard income for October is 50,000 without entering anything.
- User opens any future month inside the loan period and sees the same two projected rows plus projected balance 38,000.
- Raising the loan to 13,000 changes every projected row immediately; October's recorded 12,000 stays.
- Nothing is counted twice: a salary the user enters by hand replaces the automatic one for that month.

## 2. Current state (verified)

| Fact | Location |
|------|----------|
| Monthly summary adds all included fixed costs from the fixed-cost list, not from transactions | `GetMonthlySummaryQueryHandler.cs:29-33` |
| Summary ignores `type = "fixed"` transactions to avoid double counting | `SummaryData.cs:24, 56` |
| Income in summary = `type = "income"` transactions only; salary setting is never used | `GetMonthlySummaryQueryHandler.cs:25` |
| Salary lives in three unrelated places: `AllocationSetting.MonthlyIncome`, `TaxSetting.AnnualSalary`, `DebtBudgetProfile.NetMonthlyIncome` | entities |
| Fixed cost has `DueDay`, `StartMonth`, `EndMonth`, per-month exclusions (`fixed_cost_exclusions`) | `FixedCost.cs`, `FixedCostPeriod.cs` |
| Pay endpoint creates a `type = "fixed"` transaction only when `AccountId` is sent; FE never sends it | `PayFixedCostCommandHandler.cs:46`, `useFixedCostsState.js:194` |
| Delete fixed cost is a soft delete (`IsActive = false`) when it has payments/transactions | `DeleteFixedCostCommandHandler.cs:29-39` |
| Transaction list is filtered by date range (FE sends current month by default) and paged | `GetTransactionsQueryHandler.cs` |
| Two schema files: SQL Server `database/schema.sql`, Postgres `database/schema.postgres.sql` | `D:\BE_wallet_net\database` |

## 3. Concepts

**Source** — a fixed cost or a recurring income. Each source produces at most one entry per month.

**Entry date** — `min(DueDay, last day of month)` in that month. Day 31 in February → 28/29.

**"Today"** — the current date in `Asia/Bangkok`, not UTC.

For a source `S` and month `M` where `S` is active in `M` and `M` is not excluded:

| Situation | What exists | Shown in list | Counted |
|-----------|-------------|---------------|---------|
| Real row for (S, M) exists | transaction row | real row | as actual |
| No row, entry date ≤ today | created on read ("materialized") | real row | as actual |
| No row, entry date > today | nothing in DB | projected row | as projected only |

A month is "excluded" for a source when it has an exclusion record. Deleting a row (real or projected) creates the exclusion, so it never comes back.

## 4. Data model

### 4.1 New table `recurring_incomes`

Mirrors `fixed_costs`.

| Column | Type | Note |
|--------|------|------|
| id | uuid PK | |
| user_id | uuid FK users | |
| category_id | uuid FK categories | income category, default "เงินเดือน (Salary)" |
| title | nvarchar(100) | e.g. "เงินเดือน" |
| amount | decimal(18,2) | > 0 |
| pay_day | tinyint | 1–31 |
| start_month | date null | first day of month; null = from the month it was created |
| end_month | date null | null = no end |
| is_active | bit | soft delete |
| note | nvarchar null | |
| created_at, updated_at | datetime | |

### 4.2 New table `recurring_income_exclusions`

Same shape as `fixed_cost_exclusions`: `(id, recurring_income_id, period_month, created_at)`, unique `(recurring_income_id, period_month)`.

### 4.3 New columns on `transactions`

| Column | Type | Note |
|--------|------|------|
| recurring_income_id | uuid null FK recurring_incomes | `ON DELETE SET NULL` / `NO ACTION` per schema file |
| source_period | date null | month (day 1) this row stands for; set on every row that came from a source |
| is_user_modified | bit not null default 0 | set when the user edits an auto row |

Unique filtered indexes (they make materializing safe under concurrent reads):
- `(fixed_cost_id, source_period) WHERE source_period IS NOT NULL`
- `(recurring_income_id, source_period) WHERE source_period IS NOT NULL`

Row types: fixed-cost rows use `type = "fixed"`; recurring-income rows use `type = "income"`.

### 4.4 Migration of existing data

- Existing `type = "fixed"` rows created by the pay endpoint: set `source_period` from `fixed_cost_payments.period_month` via `transaction_id`. If two rows map to the same (fixed cost, month), keep the oldest, leave the others with `source_period = null`.
- `null start_month` sources: the effective start is the month of `created_at` everywhere (materialize, projected rows, dashboard checklist), so old fixed costs do not suddenly create years of rows. Today `FixedCostPeriod.IsActiveIn` treats null as "always"; it gets a `createdAt` fallback. Past months before creation then show no fixed costs — acceptable, those months were never real.
- No automatic conversion of `AllocationSetting.MonthlyIncome` into a recurring income. The FE offers it once (section 7.1).

Both `schema.sql` and `schema.postgres.sql` get the changes, written idempotently (the docker init script re-runs them).

## 5. BE behaviour

### 5.1 Materializer (no job)

`RecurringEntryMaterializer.EnsureAsync(userId, from, to)`:
1. Clamp `to` to today. If `from > to`, do nothing.
2. Load active sources of the user (with exclusions) and existing rows with `source_period` in range.
3. For every (source, month) in range with entry date in `[from, to]`, not excluded, no row, not suppressed (5.4) → insert row: amount, category, title as note, entry date, `source_period`, `is_recurring = true`, `account_id = null`.
4. Unique-index violation → ignore (another request created it).

Called at the start of: transaction list, monthly summary, finance report — with the range being read. Reading never creates anything after today.

Rows have no account, so they never change account balances. Linking a default account is out of scope.

### 5.2 Projected entries

`ProjectedEntries.For(userId, from, to)` returns, for each (source, month) whose entry date is after today and inside `[from, to]`, not excluded, no row, not suppressed: a DTO identical to `TransactionDto` plus

- `id` = deterministic Guid derived from (sourceType, sourceId, month) so FE keys are stable and `TransactionDto.Id` stays a Guid
- `isProjected = true`
- `sourceType` (`fixedCost` | `recurringIncome`), `sourceId`, `sourcePeriod`

Real rows get `isProjected = false` and the same `source*` fields when they came from a source.

Range guard: projected rows are produced only when the request has both `startDate` and `endDate`, max 24 months.

### 5.3 Transaction list

The FE loads every transaction once (`GET /transactions`, all pages, no date range) and filters by period in the browser. So:

- `GET /transactions` runs the materializer first. Without a date range it materializes from each source's effective start up to today.
- Projected rows come from a separate `GET /recurring-entries/projected?startDate&endDate`; the transactions tab calls it for the period on screen and merges the rows in the browser. `/transactions` paging and counts stay real-rows only.

### 5.4 Manual salary replaces automatic salary

If in month `M` a user has an income transaction they entered themselves (`recurring_income_id is null`) in the **same category** as recurring income `S`, then `S` is suppressed in `M`: no projected row, no materialized row.

When the user creates such a manual income and an unmodified auto row of `S` for that month already exists, the create handler deletes the auto row in the same save. If the auto row was user-modified, keep both and let the user decide.

Applies to recurring income only. Fixed costs are not suppressed by manual expenses.

### 5.5 Editing a row

- **Real auto row** — normal update; sets `is_user_modified = 1`.
- **Projected row** — `POST /recurring-entries/materialize { sourceType, sourceId, period, amount?, txDate?, note?, categoryId? }` creates the real row now with the given values, `is_user_modified = 1`. Returns the new transaction.
- **Delete real auto row** — deletes it and adds an exclusion for (source, month).
- **Delete projected row** — `POST /recurring-entries/exclude { sourceType, sourceId, period }` adds the exclusion. For fixed costs this is the existing exclusion table, same as unticking on the dashboard.

### 5.6 Editing a source

Update requests for fixed cost and recurring income get an optional `effectiveFrom` month, default = current month.

- Projected rows always follow the new values (they are computed).
- Real auto rows with `source_period >= effectiveFrom` and `is_user_modified = 0` are updated: amount, category, entry date (from new day), note.
- Rows before `effectiveFrom` and user-modified rows are untouched.
- Shortening `end_month`: real rows after it stay; projected rows after it disappear.
- Delete source: existing soft/hard delete logic; real rows stay (unlinked on hard delete); projected rows disappear.

### 5.7 Pay endpoint

`POST /fixed-costs/{id}/pay` with `accountId`: if a row for (fixed cost, period) exists, attach the account to it and deduct the balance instead of creating a second row; otherwise create the row with `source_period`. Without `accountId` behaviour is unchanged.

### 5.8 Summary and report

The finance report counts `fixed` rows the same way (materializing its range first) but has no projected fields. Monthly summary becomes:

| Field | Meaning |
|-------|---------|
| totalIncome | real `income` rows in month (now includes materialized salary) |
| totalVariableExpense | real `expense` rows |
| totalFixedCosts | real `fixed` rows (no longer from the fixed-cost list) |
| totalSavings | unchanged |
| totalSpent, balance | from the real values above, as today |
| projectedIncome | sum of projected income entries in month |
| projectedFixedCosts | sum of projected fixed entries in month |
| projectedBalance | balance + projectedIncome − projectedFixedCosts |
| fixedCostsIncludedCount / ActiveCount | unchanged meaning |

`SummaryData` stops excluding `type = "fixed"`.

For a past month everything is real, so projected fields are 0. For a future month everything from sources is projected.

## 6. API summary

| Method | Path | Note |
|--------|------|------|
| GET/POST/PUT/DELETE | `/recurring-incomes` | CRUD, PUT accepts `effectiveFrom` |
| PUT | `/recurring-incomes/inclusion` | body `{ periodMonth, recurringIncomeIds, included }`; tick/untick a month, mirrors fixed costs |
| GET | `/transactions` | materializes first; DTO + `isProjected` (always false here), `sourceType`, `sourceId`, `sourcePeriod`, `isUserModified` |
| GET | `/recurring-entries/projected?startDate&endDate` | projected rows, same DTO, `isProjected = true` |
| POST | `/recurring-entries/materialize` | edit a projected row |
| POST | `/recurring-entries/exclude` | delete a projected row |
| PUT | `/fixed-costs/{id}` | + `effectiveFrom` |
| GET | `/summary/monthly` | + projected fields |

## 7. FE

### 7.1 Recurring income screen
- New tab "รายรับประจำ" built from the fixed-costs tab pieces (list, add/edit modal with start month + duration, period column).
- Day field labelled "วันที่เงินเข้า".
- Edit modal adds "มีผลตั้งแต่เดือน" (default this month). Same field added to the fixed-cost edit modal.
- Empty state: if `allocationSettings.monthlyIncome > 0`, offer "ใช้เงินเดือน {amount} บาทจากหน้าแบ่งเงิน" to create the first item in one click.

### 7.2 Transactions tab
- Projected rows render like other rows with a "รอดำเนินการ" badge and muted style.
- Edit on a projected row → same modal; save calls `materialize`.
- Delete on a projected row → confirm "ไม่นับรายการนี้ในเดือน {month}" → `exclude`.
- Delete on a real auto row → same confirm text.
- The "next month" button is no longer disabled at the current month, so future months can be browsed; they contain only projected rows.
- The tab fetches projected rows for the period on screen (month mode: that month; range mode: the range; "all" mode: none) and merges them with the loaded transactions.

### 7.3 Dashboard
- Income/expense cards show actual values; under them "คาดการณ์สิ้นเดือน" with `projectedBalance` when projected values are non-zero.
- Fixed-cost checklist unticking keeps calling the inclusion endpoint (BE now also deletes the unmodified auto row of that month).

## 8. Out of scope

- Default account per source and automatic balance deduction.
- Making Allocation, Tax and Debt read salary from recurring income (follow-up; today they keep their own fields).
- Weekly / yearly frequency. Monthly only.
- Notifications on due day.

## 9. Testing

BE unit tests (`Walletly.Tests`):
- Entry date clamping (31 → Feb 28/29).
- Materializer: creates up to today only; idempotent; respects exclusions, start/end month, suppression; duplicate insert race ignored.
- Projected entries: only after today; range guard.
- Summary: past month all real, current month split, future month all projected; manual salary not double counted; `fixed` rows counted once.
- Source edit with `effectiveFrom`: updates only unmodified rows from that month.
- Pay endpoint reuses existing row.
- Delete auto row adds exclusion and is not recreated.

FE: Vitest for any new pure helpers (e.g. projected badge mapping); manual check in the browser for the transactions tab and dashboard.
