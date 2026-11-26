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
- Grilling done, spec + tickets written and committed.
- Ticket 01 (scaffold) in progress: `npx create-expo-app@latest /tmp/hx-scaffold --template expo-template-blank-typescript` running in background (log `/tmp/scaffold.log`); afterwards copy template files into repo root, extend package.json with deps (expo-router, expo-sqlite, zustand, victory-native+react-native-svg, @shopify/flash-list, expo-notifications, expo-local-authentication, expo-file-system, expo-sharing, expo-localization, react-native-safe-area-context, react-native-screens, react-native-gesture-handler, react-native-reanimated; dev: jest-expo, typescript, eslint, eslint-config-expo, @types/jest), then `npm install` at repo root.

## Next steps
1. Finish scaffold → repo root; verify `tsc --noEmit` + jest smoke + `npx expo export` or bundle check if feasible.
2. Work tickets 02→16 in order, committing per ticket on `main` (implement skill: commit to current branch; no push).
3. TDD on domain services (03–06) with plain Jest unit tests, hand-worked literals.
4. Delegate disjoint UI tickets to child sessions (model deepseek-v4-1-flash-1017) when safe; otherwise implement sequentially here.
5. End: full `tsc` + jest + eslint green, then code-review skill vs `2c223f7`, fix findings, final commit + summary.

## Environment
- Node v24.15.0, npm 11.12.1, network OK (npm registry reachable). Latest versions seen: expo 58.0.26, expo-router 58.0.32, zustand 5.1.0, victory-native 43.1.0, jest-expo 58.0.15.
- Skills available to load via `skill` tool: grilling, domain-modeling, tdd, code-review, prototype, research, codebase-design, vercel-react-native-skills, react-native-architecture, node-project-commands, diagnosing-bugs. The ask-matt flow skills (to-spec/to-tickets/implement/...) are NOT loadable; their SKILL.md files live under `.agents/skills/` and were read manually.
