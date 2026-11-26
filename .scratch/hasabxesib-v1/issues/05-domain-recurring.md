# 05: Recurring rules domain — due dates, auto-posting, skip queue

**What to build:** the recurring domain service: recurring rules with frequency (daily/weekly/monthly/yearly) and next-due computation across month/year boundaries; materialization of overdue rules into real transactions (idempotent — never double-posts); skip of a single upcoming occurrence; edit of a rule. Pure + Jest tests with hand-worked date expectations.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] Next due date computed correctly for daily/weekly/monthly/yearly, incl. Jan 31 → Feb handling and leap years
- [ ] `materializeDue(now)` posts each overdue occurrence exactly once and advances the rule
- [ ] Skipping an occurrence prevents that date from posting but keeps the rule alive
- [ ] Posted transactions carry the rule's amount, category, account, note
- [ ] Jest suite green; `tsc --noEmit` green
