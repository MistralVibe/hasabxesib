# HasabXesib v1 — session handoff (READ THIS FIRST in a new session)

Repo root: /Users/serdaratamuradov/shaxsi/projects/vibe/hasabxesib — everything is at the repo root (the `.agents/skills/` folder is Matt Pocock's skill pack prepared FOR this project, not the project). Branch `main`, never push. Latest commit: `d78f89f` (UI/UX overhaul). Review fixed point: `2c223f7`.

## What HasabXesib is
Cross-platform (iOS+Android, Expo Go-compatible) personal budget tracker. Local-first SQLite, en+ru, TMT/USD/… any ISO currency. Tabs: Home/Transactions/Budgets/Reports/Settings + FAB. Accounts+transfers, transactions (predefined+custom categories, custom never translated), monthly per-category budgets w/ 80%/100% local notifications, recurring rules w/ auto-post + skip queue, reports (donut/bars/trend), search+filters, theme (system/light/dark), app lock, daily reminder, CSV/JSON export+import, onboarding (currency picker + quick budgets).

## Verified state at d78f89f (ALL GREEN)
- `npx tsc --noEmit` clean; `npx eslint .` 0 problems; `npx jest` 11 suites / 53 tests pass; `CI=1 npx expo export --platform android` AND `--platform web` exit 0; `npx expo install --check` clean.
- ON-DEVICE verified via adb (device RZCY91BGC2P, Expo Go, exp://192.168.100.84:8081): onboarding (currency search+pick, budgets, start), accounts create (Cash 1000, Card 250), transfer Cash→Card 100 (balances 900/350 ✓), transaction add/edit/delete w/ confirm, search+filters, tabs, Settings Manage rows — all with 0 JS errors in logcat. Screenshots confirmed: calendar date-picker modal, segmented Expense/Income control, gradient balance card, reports charts.

## Hard-won runtime rules (also in AGENTS.md — keep it updated)
- NEVER use Intl.DisplayNames / Intl.supportedValuesOf at runtime (Hermes lacks them) — currency names come from static `src/domain/currencyData.ts`; Hermes-sim test in currencies.test.ts.
- No reanimated/worklets/gesture-handler (Expo Go worklets version mismatch) — removed; no victory-native/svg/skia (ADR-0005); architecture.test.ts tripwires enforce this + borderRadius⇒borderCurve + money math only in domain/money.ts.
- expo-router: NEVER `<Redirect>` from a gate that unmounts the navigator, and NEVER put `router` in effect deps (new identity per navigation → infinite replace loop). Use ref-guarded effect (StartupGate in app/_layout.tsx).
- expo-notifications: skip setNotificationChannelAsync when `Constants.appOwnership === 'expo'`; all notification calls wrapped in try/catch.
- Duplicate React keys crash visibly in dev: key chips by id, not label.
- Install only via `npm ci/install --prefer-offline --no-audit --no-fund --legacy-peer-deps --fetch-timeout=120000` in a retry loop + `npm cache verify` after failures. NEVER bare `yarn`. expo-linear-gradient installed OK. Web = dev smoke test only (metro.config.js has wasm assetExt).
- Device testing rig: `adb reverse tcp:PORT tcp:PORT`, `adb shell am start -a android.intent.action.VIEW -d exp://127.0.0.1:PORT host.exp.exponent`, `adb logcat -c` before each run, `/tmp/uia.py` (elements/tap/input/swipe/shot/errors) drives the UI; screenshots via `adb exec-out screencap -p`.

## Key files
- `AGENTS.md` (conventions), `GLOSSARY.md`, `docs/adr/0001..0005`, `docs/spec-hasabxesib-v1.md`, `.scratch/hasabxesib-v1/issues/01..16-*.md` (all done), `.scratch/hasabxesib-v1/RETRO.md`.
- `app/_layout.tsx` (StartupGate), `app/(tabs)/*`, `app/{onboarding,transaction,accounts,recurring}.tsx`, `src/domain/*` (pure, tested), `src/db/*`, `src/stores/*`, `src/components/ui/*` (Screen, Card, Button, DateField, SegmentedControl, …), `src/theme/tokens.ts`.

## Open threads / next steps
1. UI overhaul just landed (d78f89f) — user wants to keep pushing design quality; walk every screen on device again after any change and screenshot.
2. Remaining walkthrough gaps not yet exercised on device: recurring rule create + skip occurrence, budget edit/delete + 80%/100% notification firing, reports with data (donut/bars/trend), theme light mode, language=Русский full pass, app lock, reminder, CSV/JSON export+import via DocumentPicker.
3. Known accepted deviations: hand-rolled charts (ADR-0005), form duplication transaction/recurring, `Money = number` unbranded.
4. If output tokens approach ~300k, start a fresh session and hand off via this file (that's what this file is for).
5. v2 candidates (only if user asks): per-account currencies, web target, cloud sync.
