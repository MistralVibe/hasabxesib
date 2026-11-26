# 04: Budgets domain — monthly category budgets, progress, alert thresholds

**What to build:** the budgets domain service: monthly spent per category from expense transactions, budget progress (spent vs cap), status ok / warning (≥80%) / exceeded (≥100%), and total month budget summary for Home. Pure functions + Jest tests, including month-boundary cases.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] Spent for a category in a period sums only expense transactions in that category
- [ ] Status thresholds: ≥80% warning, ≥100% exceeded; boundary values tested with literals
- [ ] Month boundary: transactions from other months never count
- [ ] Total budget summary aggregates across all budgets for the current month
- [ ] Jest suite green; `tsc --noEmit` green
