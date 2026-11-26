# 02: SQLite schema, migrations and repository layer

**What to build:** the on-device storage layer per ADR-0002/0004: versioned migrations creating tables for accounts, categories, transactions, transfers, budgets, recurring_rules and a key-value settings table; predefined category seeding (income + expense, icon + color each); thin typed async repositories (CRUD) over expo-sqlite with hand-written SQL. Money columns are integer minor units (ADR-0003).

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Fresh install creates schema at the current version; migrations are idempotent and versioned
- [ ] Repositories expose typed CRUD for every table, including settings get/set
- [ ] Predefined categories seeded on first run; custom categories insertable
- [ ] `tsc --noEmit` and existing tests still green
