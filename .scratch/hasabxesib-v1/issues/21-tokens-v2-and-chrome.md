# 21: Design direction "Dusk A v2" — tokens v2 + shared chrome

**What to build:** land the approved "Dusk A v2" design direction's foundation (from uiux-plan.md §c/§f): token changes in the theme tokens file (light `income` → `#047857` for 4.5:1 contrast; light `tabBarInactive` → `#64748B`; new `shadows.button` small shadow; add `accent2` violet `#C084FC` light / `#7C3AED` dark; sky gradient stop tokens), use `shadows.button` on primary `Button` instead of the FAB glow, and replace the default tab bar with a floating rounded dock (custom `tabBar` on the expo-router Tabs, active pill = accentSoft). **Blocked by:** none. **Status:** ready-for-agent

- [ ] Token values updated in both light and dark themes; every borderRadius keeps borderCurve 'continuous'
- [ ] Primary Button uses the lighter shadow; FAB keeps the glow
- [ ] Floating tab dock renders on all 5 tabs, active pill visible, safe-area respected
- [ ] `npx tsc --noEmit && npx eslint . && npx jest` green; `CI=1 npx expo export --platform android` exit 0
- [ ] On-device: screenshot all 5 tabs in dark+light, logcat clean; commit to main (never push)
