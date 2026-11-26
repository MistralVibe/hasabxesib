# HasabXesib v1 — session handoff

## Goal
Build HasabXesib, a cross-platform (iOS+Android) personal budget tracker, directly at this repo root, following the ask-matt flow (grill → spec → tickets → implement w/ TDD → code-review).

## Settled decisions (do not re-ask)
- Stack: Expo SDK 58 + React Native 0.88.1 + React 19.3.0 + TS strict, expo-router tabs (Home/Transactions/Budgets/Reports/Settings) + FAB; iOS+Android only, no web v1. ADR-0001.
- Data: local-first SQLite (expo-sqlite), no accounts/cloud/sync in v1; CSV+JSON export, JSON import. ADR-0002.
- Money: integer minor units, conversion only at UI boundary (minorToInputString/fromMinor use currency exponent). ADR-0003.
- Raw SQL thin repositories + pure TS domain services; Jest tests at the domain seam. ADR-0004.
- Charts hand-rolled from Views (donut tick ring, scaled bars, rotated trend segments) — victory-native/react-native-svg/react-native-skia REMOVED (skia peer tarball corrupt on flaky network). ADR-0005.
- Features: multiple accounts + transfers (reassign-on-delete); transactions w/ predefined + custom categories (custom: nameKey=null → literal name, NEVER translated); monthly per-category budgets w/ persisted local notifications at 80%/100% (settings.notifiedAlerts, AppState foreground re-check); recurring rules auto-post on due date (materializeRecurring in app/_layout) w/ skippable upcoming queue; reports screen (month picker, donut, 12-month bars, trend, biggest); Home dashboard (total balance, month spent vs budget, recent 5, next recurring = min nextDueDate); search/filters; system theme default w/ override (device-locale default language: ru if device locale ru); optional biometric/PIN lock; optional daily reminder; onboarding (full ISO currency picker via Intl.supportedValuesOf + skippable quick budgets).
- Custom categories: names stored literally, not translated — settled with user. i18n dictionaries only cover the 15 predefined categories.
- Free, no monetization. Name: HasabXesib. Languages: English + Russian.

## Key files
- `GLOSSARY.md` — domain terms.
- `docs/adr/0001..0005` — stack, local-first, minor units, raw-SQL/pure-domain, hand-rolled charts.
- `docs/spec-hasabxesib-v1.md` — full spec.
- `.scratch/hasabxesib-v1/issues/01..16-*.md` — tracer-bullet tickets (all 16 implemented).
- Fixed point for code-review: commit `2c223f7` (original main tip).

## State at last update (post-device-fix round — see git log after e4320d4)
ON-DEVICE FIXES APPLIED (Expo Go Android run): static currencyData.ts (Hermes
has no Intl.DisplayNames/supportedValuesOf) + Hermes-sim test; reanimated/
worklets/gesture-handler REMOVED (worklets version mismatch in Expo Go);
notifications guarded (Expo Go channel NPE) + best-effort try/catch;
metro.config.js adds wasm assetExt for web smoke tests; flash-list aligned to
2.3.2 (`npx expo install --check` clean). VERIFIED GREEN: tsc, eslint 0,
jest 11 suites / 53 tests, expo export android AND web exit 0, web dev bundle
HTTP 200 with no DisplayNames/reanimated refs in app code.

## State at last update (commit ea509c4)
ALL 16 TICKETS DONE + code-review fix round applied. VERIFIED GREEN at ea509c4:
- `npx tsc --noEmit` — clean (exit 0)
- `npx eslint .` — 0 problems (exit 0)
- `npx jest` — 10 suites / 49 tests pass
- `CI=1 npx expo export --platform android` — exit 0, dist bundle exported
Code-review fixes applied: useCategoryLabel hook (custom categories literal); ValidationErrorKey i18n error keys (+ new en/ru keys); minor-unit /100 bugs fixed in all previews + CSV export; persisted notifiedAlerts budget alerts w/ translated names; reassignAndDeleteAccount; transfer date input; home nextRecurring=min nextDueDate + reanimated fade-in FAB; borderCurve:'continuous' next to all borderRadius; boxShadow instead of elevation shadows; FlashList getItemType on transactions; useShallow selectors; advanceDate shared; materializeDue 2-arg; budgetStatus helpers; localized ErrorBoundary + +not-found; device-locale language default; Placeholder.tsx deleted; ADR-0005 written.

## Accepted deviations (documented, do NOT "fix")
- Hand-rolled View charts instead of victory-native (ADR-0005).
- Form duplication between transaction/recurring editor forms.
- ScrollView-wrapped short lists in editor forms.
- `Money = number` alias not branded.

## Next steps
1. Optionally one more code-review pass on diff 2c223f7...ea509c4 (skill: code-review) and fix any new findings.
2. Final verification: tsc + eslint + jest + expo export android.
3. Final commit on main (never push) + summary to user.
4. If user wants more: multi-currency per account, web target, cloud sync — all out of v1 scope.

## Resilience (user's internet is slow/flaky)
- Commit to git after every meaningful step; latest commit is the resume point. Never push.
- This HANDOFF.md updated at each phase boundary; a fresh session should read it first, then `git log`.
- Install: `npm ci --prefer-offline --no-audit --no-fund --legacy-peer-deps --fetch-timeout=120000` in a retry loop; after failures run `npm cache verify`. NEVER run bare `yarn` — it clobbers node_modules on this flaky network.
- Delegate disjoint tasks to child sessions with model `deepseek-v4-1-flash-1017` (start_session tool); at ~300k output tokens start a fresh session and hand off via this file.

## Environment
- Node v24.15.0, npm 11.12.1. Deps installed at repo root, package-lock.json committed.
- Skills loadable via `skill` tool: grilling, domain-modeling, tdd, code-review, prototype, research, codebase-design, vercel-react-native-skills, react-native-architecture, node-project-commands, diagnosing-bugs. ask-matt flow skills (to-spec/to-tickets/implement/...) are NOT loadable as skills; SKILL.md files live under `.agents/skills/ask-matt/` and were read manually.
