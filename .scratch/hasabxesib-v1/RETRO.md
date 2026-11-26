# Retro — HasabXesib v1 build (session ending at 82ef0e5)

Per ask-matt step 4: what would have made this build smoother, as
environment changes (not code changes).

## What worked
- Tracer-bullet tickets worked blockers-first; committing per ticket meant the
  flaky network never cost work — `git log` is the resume point.
- The pure-TS domain seam (ADR-0004) kept 49 Jest tests runnable without native
  modules; money/date/budget/recurring logic was verifiable in seconds.
- Child sessions (deepseek-flash) on disjoint UI tickets + the i18n expansion
  parallelized well; nothing conflicted because tickets touched disjoint files.

## What kept biting → now deterministic
1. `/100` minor-unit bugs appeared in several screens + CSV export (callers
   doing their own conversion instead of `domain/money.ts` helpers).
   → `architecture.test.ts` fails jest on `*100`/`/100` next to amount/minor
   outside `src/domain/money.ts`; standard recorded in AGENTS.md.
2. Chart-library rabbit hole: victory-native 43 needs react-native-skia, whose
   tarball corrupted twice on this network. → ADR-0005 + architecture test
   banning skia/svg/victory imports + "expo export smoke test after dep changes"
   in AGENTS.md.
3. `borderRadius` without `borderCurve: 'continuous'` (iOS corner clipping) was
   fixed in ~10 places by hand in the review round → architecture test scans
   tsx for borderRadius without borderCurve within 4 lines.
4. Bare `yarn` (run once by accident) clobbered node_modules mid-install.
   → AGENTS.md: never yarn; `npm ci --prefer-offline --legacy-peer-deps` only.

## Judgement calls → coding standards (AGENTS.md)
- Custom category names are literal, never translated (`nameKey: null`).
- Validation errors are i18n keys, not raw strings.
- useShallow selectors instead of whole-store subscriptions.
- Hand-rolled View charts until skia installs reliably.

## What a next build starts from
- AGENTS.md at repo root (new), architecture tripwire tests in the suite,
  HANDOFF.md resume protocol. No code was changed by this retro.

## Still open (human steps)
- Run the app on a real device (`npx expo start`) — bundle export is green but
  no on-device pass has happened yet.
- v2 candidates if wanted: per-account currencies, web target, cloud sync —
  all deliberately out of v1 scope.
