# Handoff — Debt Payoff Planner

Written 2026-09-08, at the end of the Claude Code session that built the
feature. Aimed at whichever agent or person picks this up next, including
Antigravity (`agy`) or any other harness.

Branch: `feat/debt-payoff-planner`, 19 commits ahead of `main`.
State: 122/122 tests green, `npm run build` clean, feature complete and
verified in a running browser. Every merge blocker from the final review is
closed.

---

## The plan documents embed the source, and are kept in sync automatically

`docs/superpowers/plans/2026-09-07-debt-payoff-planner*.md` (four parts)
contain **complete code blocks for every file**. That duplication is what made
them dangerous: seven fix passes landed after they were written, and 17 of
their 21 whole-file blocks had drifted behind the shipped code. Re-applying
them verbatim would have reintroduced defects the reviews had already caught.

They are now synced, and stay synced:

```bash
npm run sync:plans     # rewrite any block that has drifted from its file
npm run check:plans    # report drift and exit 1 — for CI or a pre-commit hook
```

`scripts/sync-plan-code.mjs` does the work. It only touches blocks a human
opted in by marking them, on the line immediately before the fence:

```
<!-- sync:src/features/debt/StrategyPanel.jsx -->
```

That opt-in matters: not every whole-file block is meant to match the shipped
file. Task 6 deliberately ships a stub `DebtTab` that Task 11 replaces, so its
block carries no marker and stays as history. Everything else — 21 blocks — is
marked and tracked.

In this repo Claude Code also runs the sync on its own: `.claude/settings.json`
registers a `PostToolUse` hook that pipes the tool payload to
`node scripts/sync-plan-code.mjs --hook`, which syncs only when the edited file
is under `src/features/debt/`. It exits 0 whatever happens, so a docs sync can
never block an edit.

**If you are not running Claude Code**, that hook does nothing for you — run
`npm run sync:plans` after touching the feature, or wire your own harness's
equivalent. `npm run check:plans` is the guard worth putting in CI either way.

**Even so: the shipped code under `src/` is the truth, and the spec is
current.** The plans are a build narrative that now happens to quote the code
accurately. If they ever disagree with `src/`, the code wins.

For the record, these are the defects the drift would have reintroduced:

| Reintroduced defect | What it did |
|---|---|
| Single, non-cascading attack step | Destroyed surplus above a target's balance. On one verified portfolio it pooled 225,000 THB, paid 57,500, and **deleted 167,500** |
| Uncapped holding pot, closure zeroing the residue | An annually-paid loan was never closed; the loop ran to its 600-month horizon pooling 8.7M THB against a zero balance and reported the plan infeasible |
| `Math.abs` on the strategy delta | The comparison card credited avalanche even when snowball won on both measures |
| Card four summing only amortizing balances | A hire-purchase plus installment portfolio read "0 ฿" against 201,000 THB of real debt |
| `MinimumViablePayment` in every banner | Told a user whose obligations exceeded income that they needed "at least 0 ฿" |
| No `LineController` registration in `CeilingPanel` | Worked only because a sibling's import registered it bundle-wide; a code-split would have broken it in production with dev and build both green |

The **spec** — `docs/superpowers/specs/2026-09-07-debt-payoff-planner-design.md`
— *is* current. It was amended for the cascade, the pot cap, the row shape and
the ceiling formula. Trust the spec over the plan.

If you intend to keep working from the plan documents, sync their code blocks
against `src/` first. Otherwise read the spec and the code.

## Where the decision record lives

`.superpowers/sdd/` on this machine holds the full trail: `progress.md` is the
ledger, one line per task and fix pass with the reasoning, plus a
`task-N-report.md` and `fix-N-report.md` for each.

**That directory is git-ignored** (`.superpowers/sdd/.gitignore` contains `*`),
so it exists here but not in a fresh clone. If you are working from a clone,
`git log` is your record instead — the commit messages carry the why, not just
the what.

## What must not break

These are load-bearing. Each was violated at least once during the build and
caught by review.

**Engine correctness**

- The 24 golden vectors in
  `src/features/debt/engine/__tests__/payoffSimulator.golden.test.js` pin exact
  money figures from the source spec's §8 fixture, to the satang. If one moves,
  something is wrong with the change, not the expectation. `TotalInterestPaid`
  is 131,445.49 and payoff is 54 months.
- Money is **never rounded inside the loop**. Full float64 precision through
  the simulation; rounding is display-only. Rounding each step accumulates
  about 0.27 THB over 54 months, which breaks the ±0.01 tolerance.
- Interest accrues **before** payment. Payments clear accrued interest
  **before** principal. Reversing either shifts every row.
- `simulate` is pure: no clock, no storage, no config. `startMonth` is passed
  in. The UI resolves the current month and hands it over.
- Every baht of `availableForLoan` must be spent or explicitly withheld. Nothing
  may be silently dropped. There is an invariant test for this — keep it.

**Product constraints** (from the spec; these are why the feature exists)

- **Never fabricate a settlement quote.** A hire-purchase debt with no lender
  quote surfaces as "ask your lender" and a dash, never an estimated figure. An
  estimated rebate five times too high sends a user into a bad decision, which
  is the exact failure this feature was built to prevent.
- `hirePurchase` and `installment` balances are `monthlyPayment *
  periodsRemaining`. **Never an interest formula.** Treating a hire-purchase
  contract as reducing-balance is the most common bug in this domain and is
  wrong by an order of magnitude.
- Never present output as financial advice. Every view carries the one-line
  disclaimer.
- Assumptions render on screen, never in a tooltip.
- The discretionary ceiling is labelled a limit, not a target.
- No gamification, streaks or mascots. `canvas-confetti` is a project
  dependency and must not be imported by this feature.
- Nothing may nudge toward new borrowing, consolidation, or third-party offers.

**Project conventions**

- Reuse existing CSS classes from `src/index.css`. No new stylesheets. Note
  that some classes live in grouped selectors (`.form-input, .form-select,
  .form-textarea { ... }`), so a line-start search gives false negatives.
- Thai UI copy, in the voice of the existing tabs.
- No `localStorage` access outside `src/features/debt/debtStorage.js` — it is
  the single swap point for a future REST API.
- No new dependencies beyond `vitest`, which this branch added.

## One known item, not blocking

**There are no component tests.** Every finding in the UI is covered only by
manual browser verification. Two of the final review's five merge blockers lived
in `.jsx` and were invisible to `npm test` — they would be invisible again.

Recommended if you add them: `@testing-library/react` plus `jsdom`, and start
with the four states that actually caught bugs, none of which any test drives:

- a portfolio of only a hire-purchase and an installment plan (card four must
  show their real combined balance, not 0)
- a budget where fixed costs plus installments exceed income (the banner must
  name the shortfall with a real number)
- a portfolio where the strategy comparison's winner is not avalanche (the
  figures' colour and the sentence must agree — they are derived from one
  `winnersOf` call, so a test should assert they cannot diverge)
- a debt edited from `installment` to `amortizing` (no stale cross-type fields
  should persist)

Adding `jsdom` is a new dev dependency, so it is a deliberate choice rather
than a given. Weigh it against the alternative of leaving the UI covered only
by manual checks.

## How to see it running

```bash
npm run dev
```

Port 3000, per `vite.config.js`. Open the "ปลอดหนี้" tab.

To put the app into the spec's golden fixture without typing seven debts into
the forms, seed storage directly in the browser console — the shapes are in
`src/features/debt/engine/__tests__/goldenFixture.js`, and the keys are
`finsmart_debts_v1` and `finsmart_budget_profile_v1`. Then reload.

With that fixture loaded the tab should read: debt-free in 54 months, total
interest 131,445 ฿, break-even 3,342 ฿/month, and the schedule table's first
row 10,864 / 5,215 / 2,000 / 2,015 / 3,342 / 22,633 / 610,000. Those figures
match the engine's own tests, so a disagreement means the UI wiring drifted,
not the engine.

Screenshots proved unreliable in the environment this was built in. Reading the
rendered text out of the DOM worked, and is cheaper.

## If you are Antigravity

The superpowers skills used to build this ship a tool mapping for the
Antigravity CLI at
`skills/using-superpowers/references/antigravity-tools.md`: `invoke_subagent`
in place of subagent dispatch, and a markdown **task artifact**
(`write_to_file` with `IsArtifact: true`, `ArtifactType: "task"`) in place of a
todo list, since `manage_task` manages background processes rather than a
checklist.

The workflow that produced this branch was: brainstorming to a spec, then
writing-plans, then subagent-driven-development — a fresh subagent per task
with a two-verdict review after each, and a whole-branch review at the end.
That final review is what caught the money-destruction bug that eleven passing
per-task reviews had missed. If you continue with a different process, keep some
equivalent of that last broad pass.
