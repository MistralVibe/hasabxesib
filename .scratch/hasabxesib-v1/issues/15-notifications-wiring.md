# 15: Local notifications — budget alerts, daily reminder, permissions

**What to build:** expo-notifications wiring: request permissions gracefully; schedule/reschedule budget alerts so that crossing 80% or 100% of a category budget in the current month triggers a local notification (evaluated on transaction add/edit/delete and on budget change, plus a daily check); schedule the optional daily expense reminder at the chosen time; cancel appropriately on delete/disable. Budget/recurring status logic stays in the pure domain (04/05).

**Blocked by:** 04, 05, 07

**Status:** ready-for-agent

- [ ] Permission request is non-blocking; denial degrades gracefully (in-app badges still work)
- [ ] Adding a transaction that crosses 80%/100% schedules a notification
- [ ] Daily reminder fires at the chosen time when enabled
- [ ] Deleted budgets/transactions or disabled settings cancel their notifications
- [ ] `tsc --noEmit` and Jest green
