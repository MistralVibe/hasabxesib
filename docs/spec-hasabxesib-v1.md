# Spec: HasabXesib v1 — cross-platform personal budget tracker

## Problem Statement

The user wants a personal finance app to track budget and spending on iOS and Android with a modern UI. Spreadsheets are cumbersome on a phone and generic trackers either force accounts/cloud or lack budgets, recurring transactions and reports. HasabXesib should make "where did my money go this month?" answerable in seconds, privately, offline, with no sign-up.

## Solution

HasabXesib is a free, local-first Expo (React Native + TypeScript) app for iOS and Android. The user picks a base currency at onboarding, optionally seeds a few budgets, then uses five tabs — Home, Transactions, Budgets, Reports, Settings — with a floating "+" to add a transaction in one tap. All data lives in on-device SQLite (ADR-0002); money is integer minor units (ADR-0003); business logic sits in pure domain services tested with Jest (ADR-0004). Languages: English and Russian. Theme follows the system with a manual override. Optional biometric/PIN lock and an optional daily expense reminder via local notifications. Export CSV + JSON, import JSON backup.

## User Stories

1. As a new user, I want to pick my base currency during onboarding, so that every amount is shown in the currency I actually use.
2. As a new user, I want to optionally set a few category budgets during onboarding (skippable), so that my Home screen is meaningful from the first launch.
3. As a user, I want to see my total balance across all accounts, this month's spending vs. total budget, my last 5 transactions and the next upcoming recurring item on Home, so that I get the whole picture at a glance.
4. As a user, I want to add an expense in one tap via the floating "+", choosing amount, category, account, note and date, so that logging spending takes seconds.
5. As a user, I want to add income the same way, so that my balance reflects money coming in.
6. As a user, I want to edit or delete any transaction, so that mistakes are fixable.
7. As a user, I want to search and filter my transactions (by text, category, account, type, month), so that I can find any past spending quickly.
8. As a user, I want multiple accounts (cash, card, bank) each with its own balance, so that I see where my money physically is.
9. As a user, I want to transfer money between accounts, so that moving cash to a card is recorded without counting as income or expense.
10. As a user, I want predefined categories with icons/colors plus my own custom categories, so that transactions are classified consistently and personally.
11. As a user, I want to set a monthly budget per category, so that I can cap spending where it matters.
12. As a user, I want to see progress bars per budget (spent vs. cap) on the Budgets tab and a month summary on Home, so that I always know how much is left.
13. As a user, I want a local notification at 80% and at 100% of any category budget, so that I'm warned before and when I overspend.
14. As a user, I want recurring rules (e.g. salary monthly, rent monthly, gym weekly) that auto-post a transaction on each due date, so that regular flows happen without manual entry.
15. As a user, I want a scheduled queue of upcoming recurring postings where I can edit or skip one, so that I stay in control of what auto-posts.
16. As a user, I want Reports showing a donut of spending by category for the selected month, monthly income-vs-expense bars for the last 12 months, a spending trend line, and top categories, so that I can analyze my habits.
17. As a user, I want to switch the report month, so that I can review past months.
18. As a user, I want the app to follow my system theme by default, with a manual Light/Dark/System choice in Settings, so that it feels native at any time of day.
19. As a user, I want the app in English or Russian (switchable in Settings), so that I use it in my preferred language.
20. As a user, I want an optional Face ID / fingerprint / PIN lock on launch, so that my financial data is protected on a shared device.
21. As a user, I want an optional daily reminder notification at a time I choose, so that I remember to log my spending.
22. As a user, I want to export my transactions as CSV and my full data as JSON via the share sheet, so that I can analyze or back up outside the app.
23. As a user, I want to import a previously exported JSON backup, so that I can restore after reinstalling or on a new phone.
24. As a user, I want empty states and clear formatting (currency symbol, thousands separators, signed amounts, colored income/expense), so that the app feels polished and unambiguous.
25. As a user, I want the app to never crash on bad input (e.g. malformed import file), showing an error instead, so that I trust it with my data.

## Implementation Decisions

- Stack: Expo SDK (React Native) + TypeScript, strict mode; expo-router file-based navigation with a native bottom tab bar: Home / Transactions / Budgets / Reports / Settings; FAB "+" opens the add-transaction screen as a modal. (ADR-0001)
- Data: on-device SQLite via expo-sqlite; hand-written SQL in a thin repository layer; no ORM, no backend, no accounts in v1. (ADR-0002, ADR-0004)
- Money: integer minor units everywhere in storage and domain; decimal conversion only at the UI boundary. (ADR-0003)
- Domain services (pure TS, operate on plain rows): `accounts` (balances, transfers), `transactions` (CRUD, validation), `budgets` (monthly spent, progress, 80%/100% status), `recurring` (due-date computation, materialization, skip), `reports` (donut, monthly bars, trend, top categories aggregations).
- Schema tables: accounts, categories, transactions, transfers, budgets, recurring_rules, settings (key-value). Migrations versioned in-app.
- Categories: seeded predefined set (income + expense) with icon + color; users can add custom ones.
- Notifications: expo-notifications, local only — budget 80%/100% alerts, daily reminder, recurring due handling; a startup service materializes overdue recurring postings.
- Charts: victory-native (react-native-svg based) for donut, bars and line.
- State: Zustand stores fed by the repositories; screens subscribe narrowly (minimize re-renders per react-state rules).
- Lists: FlashList for transaction lists; memoized items; Pressable (not TouchableOpacity); StyleSheet.create, no inline styles; expo-image for any imagery.
- i18n: dictionary-based (en, ru) with a `t()` function; locale from settings, default from device.
- Theme: design tokens (colors, spacing, radii, typography) in one module; light/dark palettes; system default with manual override persisted in settings.
- Lock: expo-local-authentication (biometric/PIN), optional, off by default.
- Export/import: expo-file-system + expo-sharing; CSV for transactions, JSON for full backup/restore with schema validation and a clear error on malformed files.
- Onboarding: currency picker from full ISO list → optional quick budget seeding → Home; persisted "onboarded" flag; skippable.

## Testing Decisions

- Seam under test: the pure domain services (budgets, recurring, reports, accounts/transfers logic) — the highest seam with real business logic. Tests are plain Jest unit tests over plain data; no native module mocking. Each test reads like a spec sentence from the user stories above; expected values are hand-worked literals, never recomputed by the code under test.
- Repository/DB layer is thin CRUD and is not unit-tested in v1 (would require mocking expo-sqlite native); it is covered by running the app and by export/import round-trip logic where pure.
- Money formatting (minor units → display string) is pure and unit-tested.
- Recurring due-date computation across month/year boundaries, budget month boundaries, transfer balance effects and report aggregations are the priority test areas (most bug-prone).
- TDD loop per slice: one failing test → minimal implementation → green; vertical slices, not bulk tests.
- Full verification at the end: `tsc --noEmit`, full Jest suite, ESLint.

## Out of Scope

- Web/desktop targets; cloud sync and user accounts; multi-currency (single base currency only); home-screen widgets; receipt photos; split transactions; investments/stocks; shared/family budgets; bank SMS auto-import; monetization/paywalls (free v1); Apple Watch / Wear OS.

## Further Notes

- App name: HasabXesib. Free, no ads, no analytics in v1.
- All UI copy goes through i18n keys in both English and Russian.
- Local ticket tracker: `.scratch/hasabxesib-v1/issues/` (no external tracker configured).
