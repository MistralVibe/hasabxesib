# 22: Home hero "Dusk" (sky gradient, greeting, count-up balance, delta chip, budget ring)

**What to build:** rebuild the Home balance card as the Dusk hero per uiux-plan.md §f / prototype-home-variants.html (variant A v2): 3-stop linear-gradient sky (tokens from ticket 21) with rounded 36 bottom, greeting line ("Good evening · 26 November" via new i18n keys home.greetingMorning/Afternoon/Evening/Night + Intl.DateTimeFormat), oversized tabular-nums balance with a ~900ms count-up (built-in Animated, no reanimated), a "+X this month" delta chip (needs a new `netInMonth` domain selector = income − expenses for current month, unit-tested), a compact gradient budget ring beside "Spent this month" (reuse the Reports donut tick technique), and the budget card as a quiet surface card. Recent transactions become grouped rows with hairline separators in one rounded surface. **Blocked by:** 21. **Status:** ready-for-agent

- [ ] Hero renders in light+dark; count-up animates once on mount (opacity/translateY or Animated value only — no loops)
- [ ] netInMonth selector added to domain with jest tests
- [ ] i18n keys added to BOTH en.ts and ru.ts (parity enforced)
- [ ] Gates green + on-device screenshots dark/light + logcat clean; commit to main
