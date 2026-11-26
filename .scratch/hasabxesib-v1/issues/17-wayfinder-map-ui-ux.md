# Wayfinder map: UI/UX modernization of HasabXesib v1

`wayfinder:map`

## Destination

A consistently modern, polished UI across every HasabXesib v1 screen (tabs + modals), with no confusing controls, no untranslated/raw interpolation artifacts, and every flow verified on-device (adb rig) with screenshots and clean logcat. "Modern" means: clear visual hierarchy, consistent spacing/radii/shadows from `src/theme/tokens.ts`, unambiguous filter controls, and empty states that guide the next action.

## Notes

- Local-markdown tracker: this directory (`.scratch/hasabxesib-v1/issues/`). Map = this file; tickets = child files linked below.
- Skills for sessions working this map: `react-native-architecture`, `vercel-react-native-skills` (RN/Expo best practices), `domain-modeling` (terminology), `codebase-design` (module seams). Repo rules: AGENTS.md + HANDOFF.md (read first, always).
- Execution IS authorized for this effort: HANDOFF priorities 1-3 (device walkthrough → fixes → screen-by-screen polish, verify each change on device, commit per step, never push). Wayfinder here charts the *decisions*; the walkthrough/polish tickets may be executed in the same session per the priority list.
- Hard runtime rules (Hermes Intl limits, expo-router redirect loop, Expo Go notification NPE, no reanimated/svg/skia, borderRadius⇒borderCurve, money math only in domain/money.ts, i18n parity en/ru) are in AGENTS.md — non-negotiable.
- Device rig: `adb reverse tcp:PORT tcp:PORT`, `am start -d exp://127.0.0.1:PORT`, `/tmp/uia.py` + `/tmp/addtx.py`, `adb logcat -c` before runs, screenshots to /tmp/shots.
- Verification gate before claiming done: `npx tsc --noEmit && npx eslint . && npx jest` + `CI=1 npx expo export --platform android`.

## Decisions so far

- [Fix: uninterpolated `{limit}` on Budgets rows](18-fix-budget-spentof-placeholder.md): `t('budgets.spentOf', …)` was called with `cap` but the template uses `{limit}` → raw `{limit}` shown on device. Fixed in `app/(tabs)/budgets.tsx` (param renamed to `limit`). Closed.

## Not yet specified

- Full list of UI/UX issues per screen — being discovered by the on-device walkthrough (HANDOFF priority 1). Each confirmed issue graduates into a ticket below.
- Visual language upgrades per screen (home card, lists, chips, modals, reports charts) — to be ticketed as the walkthrough proceeds.

## Out of scope

- v2 features (per-account currencies, web target, cloud sync) — only if the user asks (see HANDOFF).
- New native dependencies (ADR-0005); no reanimated/worklets/gesture-handler in Expo Go.

## Open tickets (the frontier)

- [Filter chips: double "All" on Transactions](19-transactions-double-all-chips.md) — `wayfinder:grilling` (user-reported; default proposal recorded in ticket)
- [Recurring/budget/reports/settings polish backlog](20-walkthrough-findings-backlog.md) — `wayfinder:research` — collects on-device walkthrough findings as they surface
