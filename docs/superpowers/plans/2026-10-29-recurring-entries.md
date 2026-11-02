# Recurring Income & Auto Fixed-Cost Rows Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Salary/recurring income and fixed costs appear as transactions automatically on their due day — projected before the day, real from the day on — with no background job.

**Architecture:** One pure planner decides which (source, month) entries exist in a date range. A materializer turns entries dated ≤ today into real `transactions` rows whenever user data is read; a projected-entries query returns entries dated > today without saving. Summary counts real rows plus projected totals; FE merges projected rows into the transactions tab.

**Tech Stack:** BE .NET 10, MediatR, EF Core (SQL Server + Postgres schema files), xUnit + EF InMemory. FE React + Vite, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-29-recurring-entries-design.md` (in `D:\FE_wallet`)

## Global Constraints

- Two repos: BE `D:\BE_wallet_net`, FE `D:\FE_wallet`. Create branch `feat/recurring-entries` in both from their current `feat/be-calculations` before Task 1.
- BE tests: `dotnet test tests/Walletly.Tests` run from `D:\BE_wallet_net`. FE tests: `npm test` from `D:\FE_wallet`.
- "Today" = Bangkok date = UTC + 7 hours (Thailand has no DST). Never `DateTime.Today` / `DateTime.UtcNow` for this decision; use `TimeProvider`.
- Months are always stored as day 1 (`FixedCostPeriod.ToMonthStart`).
- Entry date = `min(day, days in month)`.
- Source type strings exactly `"fixedCost"` and `"recurringIncome"`. Row `type`: `"fixed"` for fixed-cost rows, `"income"` for recurring-income rows.
- Auto rows have `account_id = null`; they never change account balances.
- User-facing text is Thai; copy is fixed in the FE tasks below.
- Schema changes go in both `database/schema.sql` and `database/schema.postgres.sql`, idempotent (docker init re-runs them).
- Comments follow the existing style: short Thai comments where the rule is non-obvious.

## Review Focus

1. A fixed-cost row that the pay endpoint attached to an account must never be deleted by unticking the month or by a manual salary — balance would drift. Only rows with `AccountId == null && !IsUserModified` are auto-deletable (tests in Tasks 6, 7).
2. 00:30 on the 1st in Bangkok is still the previous day in UTC; salary with day 1 must already be real then (test in Task 1).
3. A deleted auto row must not come back on the next read (test in Task 6).
4. Day 31 in February and day 30/31 in 30-day months clamp to the month's last day (test in Task 2).
5. Deactivated sources (`IsActive = false`) produce neither new rows nor projected rows, but keep their old rows (test in Task 4).

---

### Task 1: Clock, schema, entities

**Files:**
- Create: `D:\BE_wallet_net\src\Walletly.Application\Common\BusinessClock.cs`
- Create: `D:\BE_wallet_net\src\Walletly.Domain\Entities\RecurringIncome.cs`, `RecurringIncomeExclusion.cs`
- Modify: `D:\BE_wallet_net\src\Walletly.Domain\Entities\Transaction.cs`, `User.cs`, `Category.cs` (navigation collections)
- Modify: `D:\BE_wallet_net\src\Walletly.Infrastructure\Data\WalletlyDbContext.cs` (entity config next to `FixedCostExclusion`'s), `D:\BE_wallet_net\src\Walletly.Application\Common\Interfaces\IApplicationDbContext.cs`
- Modify: `D:\BE_wallet_net\src\Walletly.Application\DependencyInjection.cs` (register `TimeProvider.System` as singleton)
- Modify: `D:\BE_wallet_net\database\schema.sql`, `schema.postgres.sql`
- Test: `D:\BE_wallet_net\tests\Walletly.Tests\RecurringEntries\BusinessClockTests.cs`, `TestHelpers.cs`

**Interfaces:**
- Produces: `BusinessClock.Today(TimeProvider time) -> DateOnly`
- Produces: `RecurringIncome { Id, UserId, CategoryId, Title, Amount, PayDay (byte), StartMonth?, EndMonth?, IsActive, Note?, CreatedAt, UpdatedAt, Category, User, RecurringIncomeExclusions, Transactions }`
- Produces: `RecurringIncomeExclusion { Id, RecurringIncomeId, PeriodMonth, CreatedAt, RecurringIncome }`
- Produces: `Transaction.RecurringIncomeId (Guid?)`, `Transaction.SourcePeriod (DateOnly?)`, `Transaction.IsUserModified (bool)`, `Transaction.RecurringIncome`
- Produces: `IApplicationDbContext.RecurringIncomes`, `.RecurringIncomeExclusions`
- Produces (tests): `FixedTimeProvider(DateTimeOffset utcNow) : TimeProvider` in `TestHelpers.cs`

- [ ] **Step 1: Write failing tests**

```csharp
[Theory]
[InlineData("2026-10-31T17:30:00Z", 2026, 11, 1)] // 00:30 วันที่ 1 เวลาไทย
[InlineData("2026-10-31T16:59:59Z", 2026, 10, 31)]
public void Today_UsesBangkokDate(string utc, int y, int m, int d)
{
    var clock = new FixedTimeProvider(DateTimeOffset.Parse(utc));
    Assert.Equal(new DateOnly(y, m, d), BusinessClock.Today(clock));
}

[Fact]
public async Task RecurringIncome_RoundTripsWithExclusion()
{
    // add user, income category, RecurringIncome (PayDay 1, StartMonth 2026-10-01),
    // one RecurringIncomeExclusion for 2026-11-01, and a Transaction with RecurringIncomeId + SourcePeriod;
    // reload: income.RecurringIncomeExclusions has 1 item, transaction.SourcePeriod == 2026-10-01, IsUserModified == false
}
```

- [ ] **Step 2: Run** `dotnet test tests/Walletly.Tests --filter FullyQualifiedName~BusinessClockTests` — Expected: build FAIL (types missing).

- [ ] **Step 3: Implement** `BusinessClock.Today` as `DateOnly.FromDateTime(time.GetUtcNow().UtcDateTime.AddHours(7))`; entities; DbContext mapping (snake_case column names as the rest of the file: `recurring_incomes`, `recurring_income_exclusions`, `pay_day`, `recurring_income_id`, `source_period`, `is_user_modified`); register `services.AddSingleton(TimeProvider.System)`.

- [ ] **Step 4: Schema.** In both schema files add the two tables (spec §4.1, §4.2), the three transaction columns, FK `transactions.recurring_income_id` (`ON DELETE NO ACTION` in SQL Server like `fixed_cost_id`; `ON DELETE SET NULL` in Postgres), and unique filtered indexes `UX_transactions_fixed_cost_period (fixed_cost_id, source_period) WHERE source_period IS NOT NULL` and `UX_transactions_recurring_income_period (recurring_income_id, source_period) WHERE source_period IS NOT NULL`. Then the backfill (spec §4.4), idempotent:

```sql
-- SQL Server form; Postgres uses the same CTE with UPDATE ... FROM
WITH ranked AS (
    SELECT t.id, p.period_month,
           ROW_NUMBER() OVER (PARTITION BY t.fixed_cost_id, p.period_month ORDER BY t.created_at) AS rn
    FROM dbo.transactions t
    JOIN dbo.fixed_cost_payments p ON p.transaction_id = t.id
    WHERE t.source_period IS NULL AND t.fixed_cost_id IS NOT NULL
)
UPDATE t SET source_period = r.period_month
FROM dbo.transactions t JOIN ranked r ON r.id = t.id
WHERE r.rn = 1
  AND NOT EXISTS (SELECT 1 FROM dbo.transactions x
                  WHERE x.fixed_cost_id = t.fixed_cost_id AND x.source_period = r.period_month);
```

- [ ] **Step 5: Run** `dotnet test tests/Walletly.Tests` — Expected: all PASS.
- [ ] **Step 6: Verify schema** runs twice clean: `docker compose up` of the local DB (or run each file twice against a scratch DB) — Expected: no errors on second run.
- [ ] **Step 7: Commit** (BE) `feat(recurring): schema, entities and Bangkok clock`

---

### Task 2: Schedule rules and planner (pure)

**Files:**
- Create: `D:\BE_wallet_net\src\Walletly.Application\Features\RecurringEntries\Common\RecurringSchedule.cs`
- Create: `D:\BE_wallet_net\src\Walletly.Application\Features\RecurringEntries\Common\RecurringSource.cs`
- Create: `D:\BE_wallet_net\src\Walletly.Application\Features\RecurringEntries\Common\RecurringEntryPlanner.cs`
- Test: `D:\BE_wallet_net\tests\Walletly.Tests\RecurringEntries\RecurringEntryPlannerTests.cs`

**Interfaces:**
- Produces: `static class RecurringSourceTypes { const string FixedCost = "fixedCost"; const string RecurringIncome = "recurringIncome"; }`
- Produces: `RecurringSchedule.EntryDate(DateOnly month, int day) -> DateOnly`
- Produces: `RecurringSchedule.EffectiveStart(DateOnly? startMonth, DateTime createdAt) -> DateOnly` (start month, else month of `createdAt`)
- Produces: `RecurringSchedule.IsActiveIn(DateOnly? startMonth, DateOnly? endMonth, DateTime createdAt, DateOnly month) -> bool`
- Produces: `RecurringSchedule.ProjectedId(string sourceType, Guid sourceId, DateOnly month) -> Guid` (MD5 of `$"{sourceType}:{sourceId}:{month:yyyy-MM}"` → `new Guid(bytes)`)
- Produces: `record RecurringSource(string SourceType, Guid Id, Guid CategoryId, string Title, decimal Amount, int Day, DateOnly? StartMonth, DateOnly? EndMonth, DateTime CreatedAt, IReadOnlySet<DateOnly> ExcludedMonths)` with `string TxType => SourceType == FixedCost ? "fixed" : "income"`
- Produces: `record PlannedEntry(RecurringSource Source, DateOnly Month, DateOnly Date)`
- Produces: `RecurringEntryPlanner.Plan(IEnumerable<RecurringSource> sources, DateOnly from, DateOnly to, ISet<(string SourceType, Guid SourceId, DateOnly Month)> existing, ISet<(Guid CategoryId, DateOnly Month)> manualIncome) -> List<PlannedEntry>` — every (source, month) with entry date in `[from, to]`, active, not excluded, not in `existing`, and for recurring income not in `manualIncome`; ordered by date.

- [ ] **Step 1: Write failing tests**

```csharp
[Theory]
[InlineData(2027, 2, 31, 28)]
[InlineData(2028, 2, 31, 29)]
[InlineData(2026, 11, 31, 30)]
[InlineData(2026, 10, 1, 1)]
public void EntryDate_ClampsToMonthEnd(int y, int m, int day, int expected)
    => Assert.Equal(new DateOnly(y, m, expected), RecurringSchedule.EntryDate(new DateOnly(y, m, 1), day));

[Fact] public void EffectiveStart_FallsBackToCreatedMonth()
    // null start, createdAt 2026-08-15 → 2026-08-01; start 2026-01-01 → 2026-01-01

[Fact] public void ProjectedId_IsStableAndDistinct()
    // same inputs → equal; different month or type → different

[Fact] public void Plan_SkipsExcludedExistingOutOfPeriodAndOutOfRange()
    // source day 1, Start 2026-09, End 2026-12, excluded 2026-11, existing 2026-09;
    // Plan(from 2026-09-01, to 2027-01-31) → months [2026-10, 2026-12] only

[Fact] public void Plan_EntryDateOutsideRangeIsSkipped()
    // day 25, range 2026-10-01..2026-10-20 → empty

[Fact] public void Plan_ManualSalarySuppressesOnlyRecurringIncome()
    // income source cat A + fixed source cat A, manualIncome {(A, 2026-10)} → only the fixed entry
```

- [ ] **Step 2: Run** `dotnet test tests/Walletly.Tests --filter FullyQualifiedName~RecurringEntryPlannerTests` — Expected: FAIL (types missing).
- [ ] **Step 3: Implement** the four statics and `Plan` (iterate `FixedCostPeriod.MonthsBetween(from, to)` per source).
- [ ] **Step 4: Run** same filter — Expected: PASS.
- [ ] **Step 5: Commit** (BE) `feat(recurring): schedule rules and entry planner`

---

### Task 3: Recurring income CRUD + inclusion API

**Files:**
- Create under `D:\BE_wallet_net\src\Walletly.Application\Features\RecurringIncomes\`: `Commands/CreateRecurringIncome`, `Commands/UpdateRecurringIncome`, `Commands/DeleteRecurringIncome`, `Commands/SetRecurringIncomeInclusion`, `Queries/GetRecurringIncomes`, `DTOs/RecurringIncomeDto.cs` — mirror the matching `FixedCosts` folders (command, handler, validator).
- Create: `D:\BE_wallet_net\src\Walletly.Api\Controllers\RecurringIncomesController.cs` (copy `FixedCostsController` shape)
- Test: `D:\BE_wallet_net\tests\Walletly.Tests\RecurringIncomes\RecurringIncomeTests.cs`

**Interfaces:**
- Produces: `RecurringIncomeDto(Guid Id, Guid CategoryId, string? CategoryName, string Title, decimal Amount, byte PayDay, DateOnly? StartMonth, DateOnly? EndMonth, bool IsActive, string? Note, List<DateOnly> ExcludedMonths, DateTime CreatedAt)`
- Produces: `CreateRecurringIncomeCommand(Guid UserId, Guid CategoryId, string Title, decimal Amount, byte PayDay, DateOnly? StartMonth = null, DateOnly? EndMonth = null, string? Note = null) : IRequest<RecurringIncomeDto>`
- Produces: `UpdateRecurringIncomeCommand(Guid UserId, Guid Id, Guid CategoryId, string Title, decimal Amount, byte PayDay, DateOnly? StartMonth = null, DateOnly? EndMonth = null, string? Note = null, DateOnly? EffectiveFrom = null) : IRequest<RecurringIncomeDto>` (EffectiveFrom used in Task 7)
- Produces: `DeleteRecurringIncomeCommand(Guid UserId, Guid Id)`: soft delete (`IsActive = false`) when it has transactions, else remove — same as `DeleteFixedCostCommandHandler`.
- Produces: `SetRecurringIncomeInclusionCommand(Guid UserId, DateOnly PeriodMonth, List<Guid> RecurringIncomeIds, bool Included)` — mirror of `SetFixedCostInclusionCommandHandler`.
- Produces: `GetRecurringIncomesQuery(Guid UserId, bool IncludeInactive) : IRequest<List<RecurringIncomeDto>>`
- Routes: `api/recurring-incomes` — GET, POST, PUT `{id}`, DELETE `{id}`, PUT `inclusion`.

Validation: amount > 0; pay day 1–31; title 1–100 chars; category must belong to user and have `Type == "income"`; `EndMonth >= StartMonth` when both set. Error messages in Thai like the fixed-cost validators.

- [ ] **Step 1: Write failing tests**: `Create_NormalizesPeriodToFirstOfMonth`, `Create_RejectsNonIncomeCategory` (throws `ValidationException` or `InvalidOperationException` — whichever the fixed-cost create uses for wrong category), `ExcludeThenInclude_TogglesOnlyThatMonth`, `SetInclusion_IgnoresOtherUsersItems`, `Delete_SoftDeletesWhenTransactionsExist`.
- [ ] **Step 2: Run** `--filter FullyQualifiedName~RecurringIncomeTests` — Expected: FAIL.
- [ ] **Step 3: Implement** commands, queries, controller.
- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Commit** (BE) `feat(recurring): recurring income CRUD and month inclusion`

---

### Task 4: Source loader + materializer

**Files:**
- Create: `D:\BE_wallet_net\src\Walletly.Application\Features\RecurringEntries\Common\RecurringSources.cs`
- Create: `D:\BE_wallet_net\src\Walletly.Application\Features\RecurringEntries\Common\RecurringEntryMaterializer.cs`
- Modify: `D:\BE_wallet_net\src\Walletly.Application\DependencyInjection.cs` (register materializer scoped)
- Test: `D:\BE_wallet_net\tests\Walletly.Tests\RecurringEntries\MaterializerTests.cs`

**Interfaces:**
- Consumes: Task 2 planner and types; Task 1 clock.
- Produces: `RecurringSources.LoadAsync(IApplicationDbContext context, Guid userId, CancellationToken ct) -> Task<List<RecurringSource>>` — active fixed costs (`Day = DueDay`) + active recurring incomes (`Day = PayDay`) with exclusions.
- Produces: `RecurringSources.LoadPlanningKeysAsync(IApplicationDbContext context, Guid userId, DateOnly from, DateOnly to, CancellationToken ct) -> Task<(HashSet<(string, Guid, DateOnly)> Existing, HashSet<(Guid, DateOnly)> ManualIncome)>` — existing = rows with `SourcePeriod` in `[month(from), month(to)]`; manual income = `type == "income" && RecurringIncomeId == null` rows in range, keyed by (category, month).
- Produces: `class RecurringEntryMaterializer(IApplicationDbContext context, TimeProvider time)` with `Task<int> EnsureAsync(Guid userId, DateOnly? from, DateOnly? to, CancellationToken ct)` returning rows created. `from` null → earliest effective start among sources; `to` null or > today → today.

Created row: `Id = Guid.NewGuid()`, `Type = source.TxType`, `Amount`, `TxDate = entry.Date`, `CategoryId`, `FixedCostId` or `RecurringIncomeId`, `SourcePeriod = entry.Month`, `Note = source.Title`, `IsRecurring = true`, `AccountId = null`, timestamps UTC now. Save once; on `DbUpdateException` detach the added entries and return 0 (another request created them — unique index).

- [ ] **Step 1: Write failing tests** (clock fixed at Bangkok 2026-10-29):
  - `Ensure_CreatesRowsUpToTodayOnly` — salary day 1 from 2026-09, fixed day 30 from 2026-09 → rows: salary Sep, Oct; fixed Sep only (Oct 30 > today).
  - `Ensure_IsIdempotent` — second call returns 0, row count unchanged.
  - `Ensure_NullStartUsesCreatedMonth` — fixed cost `StartMonth = null`, `CreatedAt = 2026-10-05` → only Oct row, none for Sep.
  - `Ensure_SkipsInactiveSourcesButKeepsOldRows` — (Review Focus 5) materialize, deactivate, advance clock to 2026-12-15, ensure → no Nov/Dec rows, Oct row still there.
  - `Ensure_ManualSalarySuppressesAutoSalary` — manual income tx same category on 2026-10-03 → no auto salary Oct.
- [ ] **Step 2: Run** `--filter FullyQualifiedName~MaterializerTests` — Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Commit** (BE) `feat(recurring): materialize due entries on read`

---

### Task 5: Transaction DTO fields, projected query, wire materializer into transaction list

**Files:**
- Modify: `D:\BE_wallet_net\src\Walletly.Application\Features\Transactions\DTOs\TransactionDto.cs`
- Modify: `D:\BE_wallet_net\src\Walletly.Application\Features\Transactions\Queries\GetTransactions\GetTransactionsQueryHandler.cs` (+ `GetTransactionById` projection)
- Create: `D:\BE_wallet_net\src\Walletly.Application\Features\RecurringEntries\Queries\GetProjectedEntries\GetProjectedEntriesQuery.cs` (+ handler)
- Create: `D:\BE_wallet_net\src\Walletly.Api\Controllers\RecurringEntriesController.cs` (route `api/recurring-entries`)
- Test: `D:\BE_wallet_net\tests\Walletly.Tests\RecurringEntries\ProjectedEntriesTests.cs`

**Interfaces:**
- Produces: `TransactionDto` gains trailing optional params `Guid? RecurringIncomeId = null, string? SourceType = null, Guid? SourceId = null, DateOnly? SourcePeriod = null, bool IsUserModified = false, bool IsProjected = false`. Existing positional constructions keep compiling.
- Produces: `GetProjectedEntriesQuery(Guid UserId, DateOnly StartDate, DateOnly EndDate) : IRequest<List<TransactionDto>>` — entries from the planner with date > today and in range; range > 24 months → `ValidationException`/`BadRequest` "ช่วงวันที่ยาวเกิน 24 เดือน". DTO: `Id = RecurringSchedule.ProjectedId(...)`, `Note = Title`, category name/color/icon/type from category, `IsRecurring = true`, `IsProjected = true`, source fields set, `CreatedAt/UpdatedAt = time.GetUtcNow()`.
- Produces: `GET api/recurring-entries/projected?startDate=&endDate=` (both required).
- Change: `GetTransactionsQueryHandler` calls `materializer.EnsureAsync(userId, request.StartDate, request.EndDate, ct)` before querying, and maps the new DTO fields (`SourceType` from which FK is set).

- [ ] **Step 1: Write failing tests** (today 2026-10-29): `Projected_OnlyAfterToday` (salary day 1, fixed day 30, range Oct–Nov → fixed Oct 30, salary Nov 1, fixed Nov 30), `Projected_RespectsExclusion`, `Projected_RejectsRangeOver24Months`, `GetTransactions_MaterializesBeforeListing` (no rows → list returns salary Oct with `SourceType == "recurringIncome"`, `SourcePeriod == 2026-10-01`).
- [ ] **Step 2: Run** `--filter FullyQualifiedName~ProjectedEntriesTests` — Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** full `dotnet test tests/Walletly.Tests` — Expected: PASS.
- [ ] **Step 5: Commit** (BE) `feat(recurring): projected entries endpoint and auto rows in transaction list`

---

### Task 6: Editing and deleting entries

**Files:**
- Create: `D:\BE_wallet_net\src\Walletly.Application\Features\RecurringEntries\Common\RecurringExclusions.cs`
- Create: `.../RecurringEntries/Commands/MaterializeRecurringEntry/` (command + handler + validator)
- Create: `.../RecurringEntries/Commands/ExcludeRecurringEntry/` (command + handler)
- Modify: `.../Transactions/Commands/DeleteTransaction/DeleteTransactionCommandHandler.cs`, `UpdateTransaction/UpdateTransactionCommandHandler.cs`, `CreateTransaction/CreateTransactionCommandHandler.cs`
- Modify: `RecurringEntriesController.cs`
- Test: `D:\BE_wallet_net\tests\Walletly.Tests\RecurringEntries\EntryEditingTests.cs`

**Interfaces:**
- Produces: `RecurringExclusions.AddAsync(IApplicationDbContext context, string sourceType, Guid sourceId, DateOnly month, CancellationToken ct) -> Task` (adds if missing; no save)
- Produces: `RecurringExclusions.IsAutoDeletable(Transaction t) -> bool` = `t.SourcePeriod != null && !t.IsUserModified && t.AccountId == null`
- Produces: `MaterializeRecurringEntryCommand(Guid UserId, string SourceType, Guid SourceId, DateOnly Period, decimal? Amount, DateOnly? TxDate, string? Note, Guid? CategoryId) : IRequest<TransactionDto>` — 404 if source not the user's; `InvalidOperationException` if a row for (source, period) exists; creates row with values or source defaults, `IsUserModified = true`.
- Produces: `ExcludeRecurringEntryCommand(Guid UserId, string SourceType, Guid SourceId, DateOnly Period) : IRequest`
- Routes: `POST api/recurring-entries/materialize`, `POST api/recurring-entries/exclude`
- Changes:
  - Delete transaction with `SourcePeriod != null` → also `RecurringExclusions.AddAsync` for its source and month.
  - Update transaction with `SourcePeriod != null` → `IsUserModified = true`.
  - Create transaction `type == "income"` (no `RecurringIncomeId`) → remove rows of that user where `RecurringIncomeId != null`, same category, `SourcePeriod == month(TxDate)` and `IsAutoDeletable` (spec §5.4).

- [ ] **Step 1: Write failing tests**
  - `DeleteAutoRow_AddsExclusionAndIsNotRecreated` (Review Focus 3): materialize, delete via handler, `EnsureAsync` again → 0 created, exclusion exists.
  - `UpdateAutoRow_MarksUserModified`.
  - `MaterializeProjected_CreatesModifiedRowAndProjectionDisappears`.
  - `MaterializeTwice_Throws`.
  - `ExcludeProjected_RemovesItFromProjection`.
  - `ManualSalary_RemovesUnmodifiedAutoSalaryOnly`: auto salary Oct exists → create manual income same category Oct 25 → auto row gone; repeat with an auto row that has `AccountId` set → auto row stays (Review Focus 1).
- [ ] **Step 2: Run** `--filter FullyQualifiedName~EntryEditingTests` — Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Commit** (BE) `feat(recurring): edit, delete and replace auto entries`

---

### Task 7: Source edits, month untick, pay endpoint

**Files:**
- Create: `D:\BE_wallet_net\src\Walletly.Application\Features\RecurringEntries\Common\RecurringRowSync.cs`
- Modify: `.../FixedCosts/Commands/UpdateFixedCost/UpdateFixedCostCommand.cs` + handler, `FixedCostsController.cs` (request gets `EffectiveFrom`)
- Modify: `.../RecurringIncomes/Commands/UpdateRecurringIncome/...Handler.cs`
- Modify: `.../FixedCosts/Commands/SetFixedCostInclusion/SetFixedCostInclusionCommandHandler.cs`, `.../RecurringIncomes/Commands/SetRecurringIncomeInclusion/...Handler.cs`
- Modify: `.../FixedCosts/Commands/PayFixedCost/PayFixedCostCommandHandler.cs`
- Test: `D:\BE_wallet_net\tests\Walletly.Tests\RecurringEntries\SourceEditTests.cs`

**Interfaces:**
- Produces: `RecurringRowSync.ApplyAsync(IApplicationDbContext context, string sourceType, Guid sourceId, DateOnly effectiveFrom, decimal amount, Guid categoryId, int day, string title, CancellationToken ct) -> Task` — rows of that source with `SourcePeriod >= month(effectiveFrom)` and `!IsUserModified && AccountId == null` get amount, category, `TxDate = EntryDate(SourcePeriod, day)`, `Note = title`. No save.
- Change: `UpdateFixedCostCommand` gains trailing `DateOnly? EffectiveFrom = null`; both update handlers call `ApplyAsync` with `EffectiveFrom ?? month(BusinessClock.Today)`.
- Change: inclusion handlers with `Included == false` also remove that month's rows of those sources where `IsAutoDeletable`.
- Change: pay handler — when `AccountId` is given and a row with (FixedCostId, SourcePeriod == periodMonth) exists, set its `AccountId`, deduct the balance from it, use it as the payment's transaction; otherwise create the row as today but with `SourcePeriod = periodMonth`.

- [ ] **Step 1: Write failing tests**
  - `EditFromThisMonth_UpdatesThisMonthKeepsPast`: rows Sep, Oct (12,000); edit to 13,000 → Sep 12,000, Oct 13,000; projected Nov 13,000.
  - `EditFromPastMonth_SkipsUserModifiedRows`.
  - `ChangingDay_MovesUnmodifiedRowsDate`.
  - `Untick_RemovesAutoRowButNotPaidRow`: two fixed costs with Oct auto rows; pay the second with an account; untick both for Oct → first row removed, second row stays, both months excluded (Review Focus 1).
  - `Pay_ReusesExistingAutoRow`: auto row Oct exists → pay with account → still 1 row for (fc, Oct), `AccountId` set, balance reduced by amount.
- [ ] **Step 2: Run** `--filter FullyQualifiedName~SourceEditTests` — Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Commit** (BE) `feat(recurring): source edits, untick and pay reuse auto rows`

---

### Task 8: Summary and report from rows

**Files:**
- Modify: `.../Summary/Common/SummaryData.cs`, `.../Summary/DTOs/SummaryDto.cs`
- Modify: `.../Summary/Queries/GetMonthlySummary/GetMonthlySummaryQueryHandler.cs`, `.../GetFinanceReport/GetFinanceReportQueryHandler.cs`
- Modify tests: `tests/Walletly.Tests/Summary/MonthlySummaryTests.cs`, `FinanceReportTests.cs`, `SummaryTestData.cs`

**Interfaces:**
- Consumes: materializer (Task 4), planner (Task 2).
- Produces: `MonthlySummaryDto` gains trailing `decimal ProjectedIncome, decimal ProjectedFixedCosts, decimal ProjectedBalance`.
- Change: `SummaryData.LoadTransactionsAsync` includes `type == "fixed"`; `TotalFixedCosts` = sum of `fixed` rows. `FixedCostsActiveCount/IncludedCount` use `RecurringSchedule.IsActiveIn` with `CreatedAt`. Projected = planner entries in the month with date > today. `ProjectedBalance = NetRemaining + ProjectedIncome − ProjectedFixedCosts`.
- Change: both handlers call `materializer.EnsureAsync` for their range first. Report `ExpenseBreakdown` "fixed" items = `fixed` rows grouped by fixed-cost title (fallback note).

- [ ] **Step 1: Update tests to new rules**: the existing `MonthlySummary_CountsOnlyThatMonthAndIncludedFixedCosts` now expects the 12,000 `fixed` transaction counted once and fixed costs counted via materialized rows; add `MonthlySummary_SplitsActualAndProjected` (today 2026-10-29: salary 50,000 day 1, loan 12,000 day 1, internet 600 day 30 → Oct: income 50,000, fixed 12,000, projectedFixedCosts 600; Nov: income 0, projectedIncome 50,000, projectedFixedCosts 12,600, projectedBalance 37,400) and `MonthlySummary_PastMonthHasNoProjection`.
- [ ] **Step 2: Run** `--filter FullyQualifiedName~Summary` — Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** full `dotnet test tests/Walletly.Tests` — Expected: PASS.
- [ ] **Step 5: Commit** (BE) `feat(summary): count auto rows and show projected totals`

---

### Task 9: FE API clients and transaction mapping

**Files:**
- Create: `D:\FE_wallet\src\shared\api\recurringIncomesApi.js`, `recurringEntriesApi.js`; export both from `src/shared/api/index.js`
- Create: `D:\FE_wallet\src\features\transactions\transactionMapping.js`
- Modify: `D:\FE_wallet\src\features\transactions\useTransactionsState.js` (use `mapTransactionDto`)
- Test: `D:\FE_wallet\src\features\transactions\__tests__\transactionMapping.test.js`

**Interfaces:**
- Produces: `recurringIncomesApi = { getAll(), create(data), update(id, data), delete(id), setInclusion({ periodMonth, recurringIncomeIds, included }) }` (shape of `fixedCostsApi`)
- Produces: `recurringEntriesApi = { getProjected({ startDate, endDate }), materialize({ sourceType, sourceId, period, amount, txDate, note }), exclude({ sourceType, sourceId, period }) }`
- Produces: `mapTransactionDto(dto) -> { id, date, type, category, categoryId, amount, paymentMethod, note, isProjected, sourceType, sourceId, sourcePeriod, isUserModified }`
- Produces: `periodToRange({ periodMode, month, startDate, endDate }) -> { startDate, endDate } | null` (month → first/last day; range → as given when both set; otherwise null)
- Produces: `mergeWithProjected(transactions, projected) -> array` sorted by `date` desc, projected after real on the same date.

- [ ] **Step 1: Write failing tests**: mapping defaults (`isProjected` false when absent, category fallback `'ทั่วไป'`), `periodToRange` for `'2027-02'` → `2027-02-01`/`2027-02-28`, range with one side empty → null, `'all'` → null; merge ordering.
- [ ] **Step 2: Run** `npm test -- transactionMapping` — Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npm test` — Expected: PASS.
- [ ] **Step 5: Commit** (FE) `feat(recurring): API clients and transaction mapping`

---

### Task 10: Recurring income tab + effective-from on fixed costs

**Files:**
- Create: `D:\FE_wallet\src\features\recurring-income\useRecurringIncomesState.js`, `RecurringIncomesTab.jsx`, `RecurringIncomeModal.jsx`, `index.js`
- Modify: `D:\FE_wallet\src\App.jsx` (case `'recurring-income'`), `src\components\Navbar.jsx` (entry after fixed costs: `{ id: 'recurring-income', label: 'รายรับประจำ', fullLabel: 'รายรับประจำรายเดือน', icon: Wallet }`)
- Modify: `D:\FE_wallet\src\features\fixed-costs\AddFixedCostModal.jsx`, `useFixedCostsState.js` (send `effectiveFrom`)
- Test: `D:\FE_wallet\src\features\recurring-income\__tests__\recurringIncomeForm.test.js`

**Interfaces:**
- Consumes: `recurringIncomesApi` (Task 9), `fixedCostPeriod.js` helpers (`toApiMonth`, `toMonthKey`, `describeFixedCostPeriod`, `addMonths`).
- Produces: `toRecurringIncomePayload(form) -> { title, amount, payDay, categoryId, startMonth, endMonth, note, effectiveFrom }` in `RecurringIncomeModal.jsx` (exported for the test). Start month + duration months → `endMonth = addMonths(start, duration - 1)`; empty duration → `endMonth: null`.
- Produces: `useRecurringIncomesState() -> { items, isLoading, create, update, remove }`; after each mutation call the same refresh the fixed-cost state calls after saving (`onSynced` / `reloadTransactions` from `useWallet()`), so transactions and summary reload.

UI copy (exact):
- Tab header: `💰 รายรับประจำ` / `เงินเดือนและรายรับที่เข้าทุกเดือน ระบบจะบันทึกให้อัตโนมัติเมื่อถึงวันที่เงินเข้า`
- Fields: `ชื่อรายการ`, `จำนวนเงิน`, `วันที่เงินเข้า`, `หมวดหมู่` (income categories only), `เดือนเริ่ม`, `ระยะเวลา (เดือน)` (blank = `ไม่มีกำหนด`), `หมายเหตุ`
- Edit-only field in both this modal and `AddFixedCostModal`: `มีผลตั้งแต่เดือน` (ThaiMonthPicker, default current month)
- Empty state when `allocationSettings.monthlyIncome > 0`: button `ใช้เงินเดือน {formatCurrency(monthlyIncome)} จากหน้าแบ่งสัดส่วน` → creates `{ title: 'เงินเดือน', amount: monthlyIncome, payDay: 1, categoryId: first income category whose name contains 'เงินเดือน' else first income category }`.

- [ ] **Step 1: Write failing tests** for `toRecurringIncomePayload`: `'2026-10'` + 12 → `startMonth '2026-10-01'`, `endMonth '2027-09-01'`; blank duration → `endMonth null`; `effectiveFrom` passes through as `'YYYY-MM-01'`.
- [ ] **Step 2: Run** `npm test -- recurringIncomeForm` — Expected: FAIL.
- [ ] **Step 3: Implement** tab, modal, hook, wiring, fixed-cost `effectiveFrom`.
- [ ] **Step 4: Run** `npm test` and `npm run build` — Expected: PASS, build OK.
- [ ] **Step 5: Check in browser** (preview): add salary 50,000 day 1 → transactions tab shows this month's salary row; edit fixed cost with effective-from → amounts update.
- [ ] **Step 6: Commit** (FE) `feat(recurring): recurring income tab and effective-from edits`

---

### Task 11: Projected rows in the transactions tab

**Files:**
- Create: `D:\FE_wallet\src\features\transactions\useProjectedEntries.js`, `ProjectedEntryModal.jsx`
- Modify: `D:\FE_wallet\src\features\transactions\TransactionsTab.jsx`

**Interfaces:**
- Consumes: `periodToRange`, `mergeWithProjected`, `mapTransactionDto` (Task 9); `recurringEntriesApi`.
- Produces: `useProjectedEntries(range) -> { projected, reload }` — fetches when `range` is non-null and a token exists; refetches on `dataVersion` change (same pattern as `useMonthlySummary`).
- Produces: `ProjectedEntryModal({ entry, onClose, onSave })` — fields amount, date (ThaiDatePicker), note; `onSave({ amount, txDate, note })`.

Changes in `TransactionsTab.jsx`:
- List = `mergeWithProjected(filteredTransactions, filteredProjected)`; same type/search filter applies to projected rows; the count text includes them.
- Remove `disabled={month >= currentMonth}` on the next-month button.
- Projected row: extra badge `<span className="badge">รอดำเนินการ</span>` next to the type badge, row `style={{ opacity: 0.65 }}`; actions: edit (Pencil icon, title `แก้ไขยอดเดือนนี้`) opens `ProjectedEntryModal` → `recurringEntriesApi.materialize(...)` then reload transactions + projected; delete → confirm `ไม่นับ "{category}" ในเดือน {formatMonthKey(sourcePeriod)} ใช่หรือไม่?` → `exclude`.
- Real auto row (`sourceType` set) delete uses the same confirm text; then the normal delete call.

- [ ] **Step 1: Implement** (logic is covered by Task 9 tests; this task is UI wiring).
- [ ] **Step 2: Run** `npm test` and `npm run build` — Expected: PASS.
- [ ] **Step 3: Check in browser**: next month shows salary + fixed costs with `รอดำเนินการ`; edit one → becomes normal row with new amount; delete another → gone after reload; this month's past-due rows are normal rows.
- [ ] **Step 4: Commit** (FE) `feat(transactions): show projected recurring entries`

---

### Task 12: Dashboard projected balance

**Files:**
- Modify: `D:\FE_wallet\src\features\dashboard\DashboardTab.jsx`

**Interfaces:**
- Consumes: `summary.projectedIncome`, `summary.projectedFixedCosts`, `summary.projectedBalance` (Task 8).

- Under the balance card value, when `projectedIncome > 0 || projectedFixedCosts > 0`, show `คาดการณ์สิ้นเดือน {formatCurrency(projectedBalance)}` in `text-xs text-muted`, and below the income card `+ รอเข้า {formatCurrency(projectedIncome)}` when `projectedIncome > 0`.

- [ ] **Step 1: Implement.**
- [ ] **Step 2: Run** `npm run build` — Expected: OK.
- [ ] **Step 3: Check in browser**: with internet bill due day 30 and today 29, dashboard shows actual fixed costs without it and the projected line includes it.
- [ ] **Step 4: Commit** (FE) `feat(dashboard): projected month-end balance`
