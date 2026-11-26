# HasabXesib — agent conventions

Coding standards distilled from the v1 build's code-review + retro. Enforced
where possible by `src/domain/__tests__/architecture.test.ts` (run `npx jest`);
the rest is convention — follow it in every edit.

## Money (ADR-0003)
- All amounts are integer minor units (`Money = number`). Conversion to/from
  display units happens ONLY via `src/domain/money.ts` helpers
  (`toMinor`, `fromMinor`, `minorToInputString`, `parseAmountInput`,
  `currencyExponent`). Never write `* 100` / `/ 100` next to an amount
  anywhere else — the architecture test fails on it.

## Dependencies
- Exact pinned versions in package.json; `package-lock.json` is committed.
- Install: `npm ci --prefer-offline --no-audit --no-fund --legacy-peer-deps --fetch-timeout=120000`
  in a retry loop; after failures run `npm cache verify`.
- NEVER run bare `yarn` — it ignores the lockfile and clobbers node_modules on
  a flaky network.
- No victory-native / react-native-svg / react-native-skia (ADR-0005: skia
  peer tarball corrupts on this network). Charts are hand-built Views.
- After any dependency change, smoke-test with `CI=1 npx expo export --platform android`.

## i18n
- `src/i18n/en.ts` is the source of truth (`as const` + exported `Dictionary`
  widen type); `src/i18n/ru.ts` must satisfy `Dictionary` — parity is
  compiler-enforced and checked by `i18n.smoke.test.ts`.
- All user-facing strings go through the dictionaries. Validation errors are
  keys (`ValidationErrorKey`), rendered as `t(`errors.${key}`)`.
- Custom categories are NEVER translated: `nameKey: null` → literal name.
  Use `useCategoryLabel()` for any category name.

## Hermes / Expo Go runtime gotchas (found by on-device testing)
- Hermes has Intl.NumberFormat/DateTimeFormat but NOT Intl.DisplayNames or
  Intl.supportedValuesOf — never call those at runtime. Currency names come
  from the static `src/domain/currencyData.ts` table (generated from ICU);
  `currencies.test.ts` has a Hermes-simulation test that deletes both APIs.
- expo-notifications: `setNotificationChannelAsync` NPEs in Expo Go (SDK 53+)
  — `androidChannelSetup()` skips it when `Constants.appOwnership === 'expo'`,
  and all notification calls are wrapped so they can never crash the app.
- react-native-reanimated / react-native-worklets / react-native-gesture-handler
  are REMOVED: worklets JS/native version mismatch crashes in Expo Go, and the
  app uses no gestures/animations that need them. Do not re-add without a
  dev-build plan.
- Web is a dev smoke-test target only (v1 ships iOS+Android, ADR-0001);
  `metro.config.js` adds `wasm` to assetExts so expo-sqlite's web build
  resolves. Verify with `CI=1 npx expo export --platform web`.

## UI conventions
- Every `borderRadius` sets `borderCurve: 'continuous'` next to it (iOS).
- Shadows: `boxShadow`, not `elevation`-only FAB shadows (Android).
- Screens select from zustand stores with `useShallow`, never whole-store
  `useDataStore()` in render.
- StyleSheet for static styles; dynamic colors inline only.

## Process
- Work tickets blockers-first from `.scratch/hasabxesib-v1/issues/`; commit to
  `main` after every ticket/step (resilience against flaky internet). Never push.
- Update `.scratch/hasabxesib-v1/HANDOFF.md` at phase boundaries; a fresh
  session reads it first, then `git log`.
- Verify before claiming done: `npx tsc --noEmit && npx eslint . && npx jest`
  and `CI=1 npx expo export --platform android`.
- Fixed point for code-review diffs: commit `2c223f7`.
