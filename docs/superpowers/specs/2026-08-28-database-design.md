# Walletly Backend Database Design

Date: 2026-08-28
Status: Approved (pending user review of this doc)

## Purpose

Walletly is currently a pure React + Vite frontend with all state in
`localStorage` (see `src/context/WalletContext.jsx`). This design introduces a
real backend and relational database so data:

- Persists server-side (survives browser data clears)
- Syncs across devices for the same user
- Supports proper multi-user login (each user sees only their own data)

## Stack

| Layer | Choice | Why |
|---|---|---|
| Backend | ASP.NET Core Web API (separate project from the React frontend) | User's chosen/strongest framework |
| ORM | Entity Framework Core + `Microsoft.EntityFrameworkCore.SqlServer` | Migrations built in, matches .NET stack |
| Database | SQL Server — LocalDB (`(localdb)\MSSQLLocalDB`) for dev, SQL Server Express/Developer or Azure SQL for prod | Machine already has SSMS 22 + LocalDB installed; no extra install needed for dev |
| Auth | ASP.NET Core Identity + JWT Bearer tokens | Standard .NET auth, stateless API consumed by the Vite React app over CORS |
| Frontend integration | React (Vite) calls the API over REST, CORS enabled for the Vite dev origin | Frontend stays as-is structurally, swaps `WalletContext` local state writes for API calls |

Auth model: **1 user = 1 account**. No household/shared-account sharing in this
design.

## Entity list (9 tables)

Categories and payment methods are normalized into their own tables (each
user gets editable rows, seeded from the current `constants.js` values on
signup) rather than being hardcoded strings.

```
users
  id, email, password_hash, display_name, created_at, updated_at

categories
  id, user_id, type (income|expense|fixed|savings), name, color, sort_order, is_active
  UNIQUE(user_id, type, name)

payment_methods
  id, user_id, name, sort_order, is_active
  UNIQUE(user_id, name)

transactions
  id, user_id, category_id FK, payment_method_id FK,
  type (income|expense|fixed|savings), amount NUMERIC(12,2), tx_date DATE,
  note TEXT, is_recurring BOOL, savings_goal_id FK NULL, created_at

fixed_costs
  id, user_id, category_id FK, title, amount NUMERIC(12,2),
  due_day INT (1-31), is_paid BOOL, auto_deduct BOOL, note, created_at, updated_at

fixed_cost_payments        -- new: history log, not in the original localStorage model
  id, fixed_cost_id FK, period_month DATE, paid_at, transaction_id FK NULL

savings_goals
  id, user_id, title, category TEXT, target_amount NUMERIC(12,2),
  target_date DATE, monthly_contribution NUMERIC(12,2),
  expected_return_rate NUMERIC(5,2) NULL, color, created_at
  -- current_amount NOT stored, derived (see decisions below)

allocation_settings
  id, user_id UNIQUE, rule_key, monthly_income NUMERIC(12,2), updated_at

allocation_buckets
  id, allocation_settings_id FK, key, name, percent NUMERIC(5,2), color, sort_order

tax_settings
  id, user_id, tax_year INT, annual_salary, annual_bonus, freelance_income,
  social_security, personal_deduction, spouse_deduction, child_count, parent_count,
  life_insurance, health_insurance, ssf_amount, rmf_amount, thai_esg_amount,
  provident_fund, mortgage_interest, easy_receipt, donation_general,
  donation_education, withholding_tax
  UNIQUE(user_id, tax_year)
```

Mapping to the existing frontend: each table corresponds to one
`WalletContext` state slice (`transactions`, `fixedCosts`,
`allocationSettings`, `savingsGoals`, `taxSettings`), plus `users`,
`categories`, `payment_methods`, and `fixed_cost_payments` as new
first-class entities that the current localStorage model doesn't have.

## Design decisions (deltas from the current localStorage shape)

1. **`savings_goals.current_amount` is dropped, derived instead.**
   Current `WalletContext.depositToSavingsGoal` writes the balance in two
   places (the goal object *and* a new transaction) — two sources of truth
   that can drift. New design: `current_amount = SUM(transactions.amount
   WHERE savings_goal_id = goal.id)`. Depositing is still one user action;
   the app inserts a transaction and the balance is always computed from it.

2. **`fixed_cost_payments` is a new table.**
   Current `resetFixedCostsMonthly()` wipes `is_paid` back to `false` for
   every fixed cost, so history of past months' payments is lost. The new
   table logs each paid cycle (`fixed_cost_id`, `period_month`, `paid_at`,
   optional `transaction_id`), so history survives the monthly reset and
   enables future reporting (e.g. "paid on time %"). `fixed_costs.is_paid`
   remains as the current-cycle flag for UI convenience.

3. **`allocation_buckets` is a normalized child table, not JSON.**
   Bucket keys differ per rule (`50-30-20` has 3 buckets, `6jars` has 6) —
   see `ALLOCATION_PRESETS` in `src/shared/constants.js`. A child table lets
   the Reports tab compare budgeted vs. actual per bucket with a plain
   join/`SUM`, without parsing JSON in queries.

4. **Categories and payment methods are normalized, user-owned tables.**
   Currently hardcoded in `constants.js` per transaction type. New design
   seeds each user's `categories`/`payment_methods` rows from those
   constants on signup; users can add/edit/deactivate their own from there.
   `transactions.type` is still stored directly on the row (not derived via
   join) to keep type filtering simple, and must match the referenced
   category's `type`.

## Integrity rules

- `transactions.type` must match `categories.type` for the referenced
  category (enforced at the app/API layer).
- Deleting a `category` or `payment_method` that has referencing
  transactions is blocked (`RESTRICT`) — deactivate via `is_active` instead
  of hard delete.
- `fixed_costs`, `savings_goals`, `transactions` cascade-delete when their
  owning `user` is deleted (`ON DELETE CASCADE`).
- Indexes: `transactions(user_id, tx_date)`, `transactions(user_id, type)`,
  `transactions(savings_goal_id)`, `fixed_costs(user_id)`.

## Migration path from localStorage

`WalletContext.exportBackupJSON()` already produces a JSON backup
(`transactions`, `fixedCosts`, `allocationSettings`, `savingsGoals`,
`taxSettings`) that maps close to 1:1 onto this schema. A one-time import
tool: seed `categories`/`payment_methods` first (matched by name), then
insert `transactions`/`fixed_costs`/`savings_goals` with resolved foreign
keys from the backup JSON.

## Out of scope

- Household / multi-user shared accounts (single-owner accounts only).
- Real-time sync between devices (plain request/response API, no
  websockets/SignalR in this design).
- Bank account linking / open banking integration.
