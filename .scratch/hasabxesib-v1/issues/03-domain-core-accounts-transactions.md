# 03: Pure domain core — money, accounts, transfers, transactions, categories

**What to build:** the pure TypeScript domain services per ADR-0004, operating on plain rows (no native imports): money minor-unit helpers and display formatting, account balance computation (transactions + transfers), transfer validation and balance effects, transaction validation (amount > 0, account exists, category exists, date sane), and category accessors. Unit-tested with Jest at this seam, TDD style.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Balance of an account = sum of its transactions (income − expense) plus transfers in/out; never stored
- [ ] Transfer moves money between two accounts and is excluded from income/expense aggregations
- [ ] Transaction validation rejects non-positive amounts, unknown account/category
- [ ] Money formatting (minor units → "1 234,56 ₼") unit-tested with hand-worked literals
- [ ] Jest suite green; `tsc --noEmit` green
