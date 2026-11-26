# Fix: uninterpolated `{limit}` placeholder on Budgets rows

`wayfinder:task` — **Status: resolved (closed)**

## Question

Budget rows on the Budgets tab rendered `TMT 0.00 of {limit} · TMT 500.00 left` — the `{limit}` placeholder was not interpolated (seen on device, screenshot /tmp/shots/03-budgets.png).

## Resolution

Root cause: `app/(tabs)/budgets.tsx` called `t('budgets.spentOf', { spent, cap })` but the dictionary template (`src/i18n/en.ts` / `ru.ts`) is `'{spent} of {limit}'` / `'{spent} из {limit}'`. `src/i18n/index.tsx` leaves unknown `{…}` placeholders literal.

Fix: call site now passes `limit: money(p.cap)`. Verified on device after reload. Committed.
