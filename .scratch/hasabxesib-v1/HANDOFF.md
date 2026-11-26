# HasabXesib v1 — session handoff

## Goal
Build HasabXesib, a cross-platform (iOS+Android) personal budget tracker, directly at this repo root, following the ask-matt flow (grill → spec → tickets → implement w/ TDD → code-review).

## Settled decisions (do not re-ask)
- Stack: Expo + React Native + TypeScript (strict), expo-router tabs; iOS+Android only, no web target in v1. ADR-0001.
- Data: local-first SQLite (expo-sqlite), no accounts/cloud/sync in v1; CSV+JSON export, JSON import. ADR-0002.
- Money: integer minor units, conversion only at UI boundary. ADR-0003.
- Raw SQL thin repositories + pure TS domain services; Jest tests at the domain seam. ADR-0004.
- Features: multiple accounts + transfers; transactions w/ categories (predefined + custom); monthly per-category budgets w/ local notifications at 80%/100%; recurring rules that auto-post on due date w/ skippable queue; reports (donut by category, monthly income/expense bars, trend line, top categories); Home dashboard (total balance, month spent vs budget, recent 5, next recurring); tabs Home/Transactions/Budgets/Reports/Settings + FAB "+"; search in transactions; system theme default w/ Light/Dark/System override; English + Russian; optional biometric/PIN lock; optional daily reminder; onboarding = currency picker (full ISO list) + skippable quick budget seeding.
- Free, no monetization. Name: HasabXesib.

## Key files
- `GLOSSARY.md` — domain terms (Account, Transaction, Transfer, Category, Budget, Recurring rule, Balance, Base currency, Money, Report, Period).
- `docs/adr/0001..0004` — stack, local-first, minor units, raw-SQL/pure-domain.
- `docs/spec-hasabxesib-v1.md` — full spec (to-spec template).
- `.scratch/hasabxesib-v1/issues/01..16-*.md` — tracer-bullet tickets, blockers-first. Local tracker (no external tracker configured).
- Fixed point for code-review: commit `2c223f7` (original main tip). Paper-trail commit: `33f2029`.

## State at last update
- npm deps installed and verified at repo root (Expo SDK 58.0.26, RN 0.88.1, React 19.3.0; exact pinned versions in package.json; install with `--prefer-offline --legacy-peer-deps` — flaky network corrupts tarballs, run `npm cache verify` after failures). package-lock.json now exists.
- VERIFIED GREEN: `npx tsc --noEmit` clean; `npx jest` 10 suites / 49 tests pass (domain: money, dates, accounts, transactions, budgets, recurring, reports, export, currencies, i18n smoke).
- Written so far: app shell (root layout w/ StartupGate: load stores, materializeRecurring, notifications perms, onboarding redirect, app-lock gate; tabs layout w/ 5 tabs), onboarding screen (currency + quick budgets), home screen, src/domain/* (types, money, dates, accounts, transactions, budgets, recurring, reports, export, currencies + tests), src/db/* (schema, database, repositories, seed), src/stores/* (useDataStore, useSettingsStore), src/services/* (notifications, lock, backup w/ SDK-58 File API), src/hooks/useFormatters, src/components/ui/* (Screen, Placeholder, Button, Card, ProgressBar, CategoryIcon, EmptyState, SectionTitle), i18n en/ru full dictionaries (234 keys each, en has `as const` + exported `Dictionary` widen type; ru: Dictionary).
- i18n was expanded by a deepseek-flash child session; I added `common.unlock` to both dicts.
- Remaining tickets: 09 transaction modal, 10 budgets screen, 11 recurring screen (queue + skip; auto-post already in store), 12 reports screen (victory-native), 13 accounts+transfers modal, 14 settings screen (theme/lang/lock/reminder/export/import), 15 notifications wiring (budget alerts + reminder scheduling), 16 polish (error boundary, empty states, lint), then full tsc+jest+eslint, code-review vs 2c223f7, final commit.

## Next steps
1. Finish scaffold → repo root; verify `tsc --noEmit` + jest smoke + `npx expo export` or bundle check if feasible.
2. Work tickets 02→16 in order, committing per ticket on `main` (implement skill: commit to current branch; no push).
3. TDD on domain services (03–06) with plain Jest unit tests, hand-worked literals.
4. Delegate disjoint UI tickets to child sessions (model deepseek-v4-1-flash-1017) when safe; otherwise implement sequentially here.
5. End: full `tsc` + jest + eslint green, then code-review skill vs `2c223f7`, fix findings, final commit + summary.

## Resilience (user's internet is slow/flaky)
- Commit to git after every meaningful step (done per ticket; latest commit is the resume point).
- This HANDOFF.md is updated at each phase boundary; a fresh session should read it first, then `git log`.
- npm registry is slow (fetches 25-50s each); run installs as background processes and poll with tools.process.output.
- IMPORTANT: use `npm ci --prefer-offline --legacy-peer-deps` (package-lock.json committed). Do NOT run bare `yarn` — it ignores the lockfile and clobbers node_modules on this flaky network.

## Environment
- Node v24.15.0, npm 11.12.1, network OK (npm registry reachable). Latest versions seen: expo 58.0.26, expo-router 58.0.32, zustand 5.1.0, victory-native 43.1.0, jest-expo 58.0.15.
- Skills available to load via `skill` tool: grilling, domain-modeling, tdd, code-review, prototype, research, codebase-design, vercel-react-native-skills, react-native-architecture, node-project-commands, diagnosing-bugs. The ask-matt flow skills (to-spec/to-tickets/implement/...) are NOT loadable; their SKILL.md files live under `.agents/skills/` and were read manually.
