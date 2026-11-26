# 01: Scaffold Expo app shell at repo root

**What to build:** a runnable Expo (React Native + TypeScript, strict) project rooted at the repository root, with file-based navigation (expo-router) rendering five placeholder tabs (Home, Transactions, Budgets, Reports, Settings), a design-token theme module with light/dark palettes, an i18n skeleton with English and Russian dictionaries, jest-expo wired with one smoke test, and ESLint. GLOSSARY.md and ADRs already exist. App name "HasabXesib" in app config.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] `npx expo start` bundles without errors; five tabs render placeholder screens
- [ ] `tsc --noEmit` passes; `jest` passes (smoke test); ESLint passes
- [ ] Theme tokens (colors/spacing/radii/typography) defined once and consumed by placeholder screens
- [ ] `t()` i18n function works for en and ru
