# 13: Accounts management and transfer flow

**What to build:** an Accounts section (under Home or its own screen reachable from Home/Settings): list of accounts with icon, name, type (cash/card/bank) and live balance; add/edit account; delete guarded (blocked when it has transactions, with option to reassign or force); a transfer flow (from account, to account, amount, date, note) that creates a transfer and updates both balances without touching income/expense.

**Blocked by:** 03, 07

**Status:** ready-for-agent

- [ ] Account list shows live balances from the domain service
- [ ] Account CRUD works; delete with transactions is blocked with a clear message
- [ ] Transfer form validates (accounts differ, amount > 0) and moves money correctly
- [ ] `tsc --noEmit` and Jest green
