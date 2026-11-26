# 08: Home tab — dashboard summary

**What to build:** the Home screen: total balance across all accounts, current-month spent vs total budget with a progress bar, the last 5 transactions, and the next upcoming recurring posting — each section tappable to its tab/detail. Pulls from domain services 03–05 via a Zustand store fed by repositories.

**Blocked by:** 03, 04, 05, 07

**Status:** ready-for-agent

- [ ] Shows total balance (sum of account balances), month spent vs total budget progress, recent 5 transactions, next recurring
- [ ] Tapping sections navigates to Transactions/Budgets/Reports or the item detail
- [ ] Empty state when no data yet (calls to action to add account/transaction)
- [ ] `tsc --noEmit` and Jest green
