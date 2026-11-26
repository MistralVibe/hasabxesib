# 11: Recurring tab — scheduled queue, rule CRUD, startup auto-post service

**What to build:** the Recurring screen: list of recurring rules with next due date and a queue of upcoming scheduled postings; create/edit/delete rule (amount, category, account, note, frequency, start date); skip or edit a single upcoming occurrence. A startup service runs `materializeDue(now)` on app launch so overdue rules post automatically and idempotently.

**Blocked by:** 05, 07

**Status:** ready-for-agent

- [ ] Rules listed with next due date; upcoming occurrences visible as a queue
- [ ] Rule CRUD persists; skip marks one occurrence skipped
- [ ] On app start, overdue occurrences post exactly once as real transactions
- [ ] `tsc --noEmit` and Jest green
