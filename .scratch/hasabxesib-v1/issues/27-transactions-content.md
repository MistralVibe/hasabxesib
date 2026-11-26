# 27: Transactions content polish — localized date headers, filters disclosure, empty-filter state

**What to build:** date group headers use Intl.DateTimeFormat + existing unused `dates.today`/`dates.yesterday` keys instead of raw ISO; collapse category+account chip rows into a "Filters" disclosure (existing unused `transactions.filters` key); wire the unused `noResultsBody` into the filtered-empty state with a reset action. **Blocked by:** 25, 26. **Status:** ready-for-agent

- [ ] Headers read "Today"/"Yesterday"/localized date; filters collapsed behind a disclosure; empty-filter state explains recovery
- [ ] Device screenshots; gates green; commit
