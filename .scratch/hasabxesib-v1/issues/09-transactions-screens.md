# 09: Transactions tab — list, search/filter, add/edit/delete

**What to build:** the Transactions screen: a FlashList of all transactions (grouped by day, signed colored amounts, category icon, account name), a search field plus filters (type income/expense, category, account, month), and an add/edit modal (amount keypad-style input, category picker, account picker, note, date, income/expense toggle) opened by the FAB "+" and by tapping a row; delete with confirmation. Persists via repositories; store updates optimistically.

**Blocked by:** 03, 07

**Status:** ready-for-agent

- [ ] List shows all transactions newest-first with formatted amounts and category icons
- [ ] Search + filters narrow the list correctly
- [ ] FAB opens add modal; saving persists and updates balances everywhere
- [ ] Tap row → edit; delete with confirmation
- [ ] `tsc --noEmit` and Jest green
