# 12: Reports tab — charts with real aggregations

**What to build:** the Reports screen: a month selector (current month default, past months browsable), a donut chart of spending by category for the selected month, a bar chart of income vs expense per month for the last 12 months, a spending trend line over the same window, and a top-categories / biggest-transactions list. Charts via victory-native; data from the reports domain.

**Blocked by:** 06, 07

**Status:** ready-for-agent

- [ ] Month selector switches the donut + top lists between months
- [ ] Donut, bars and trend render from real repository data (no placeholders)
- [ ] Empty state for months with no data
- [ ] `tsc --noEmit` and Jest green
