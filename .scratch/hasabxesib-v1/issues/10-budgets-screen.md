# 10: Budgets tab — budget list, progress, CRUD

**What to build:** the Budgets screen: list of category budgets for the current month with spent/cap, progress bar and status color (ok/warning/exceeded), spent-this-month per category even without a budget, and create/edit/delete budget (category picker + amount). Writes via repositories; reads via budgets domain.

**Blocked by:** 04, 07

**Status:** ready-for-agent

- [ ] Each budget row shows category icon, spent vs cap, progress bar, status color
- [ ] Categories without a budget listed with spent only
- [ ] Create/edit/delete budget persists and refreshes Home summary
- [ ] `tsc --noEmit` and Jest green
