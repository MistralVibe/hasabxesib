# 16: Polish and integration pass

**What to build:** the final cross-cutting pass: consistent empty states on every tab, a root error boundary so bad input never crashes the app, currency formatting (symbol, separators, signed income/expense colors) applied uniformly, dark-theme verification of every screen, subtle Reanimated micro-animations on tab transitions and the FAB, safe-area handling on all scroll screens, and removal of any placeholder/dead code from ticket 01.

**Blocked by:** 08, 09, 10, 11, 12, 13, 14, 15

**Status:** ready-for-agent

- [ ] Every screen has a designed empty state and handles loading
- [ ] Error boundary catches render errors with a recovery action
- [ ] Full verification green: `tsc --noEmit`, entire Jest suite, ESLint
- [ ] Code review (Standards + Spec axes) against the pre-build commit is clean or all findings fixed
