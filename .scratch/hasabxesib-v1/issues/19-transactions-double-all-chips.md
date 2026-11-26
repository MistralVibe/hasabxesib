# Filter chips: double "All" on the Transactions screen

`wayfinder:grilling` — user-reported on device ("in transactions screen, there is 2 all selectors")

## Question

The filter row on `app/(tabs)/transactions.tsx` renders the type filter and the month filter on the same horizontal line, each with its own "All" chip: `[All] [Income] [Expense] [All] [2026-11] …`. Two adjacent "All" chips are ambiguous — which dimension does each reset?

## Options (default proposal marked)

1. **(default)** Give each row a leading label or distinct chip text: type row keeps `All`, month row chip becomes `All months` (i18n key `transactions.allMonths`); keep both rows but move month chips to their own visual group (separator or second row when space allows).
2. Merge into one row with icons: type segmented control (already exists elsewhere) + a month dropdown/picker chip showing `2026-11 ▾` with an "All months" entry inside the picker.
3. Put month filter into the search row as a small icon-button opening a month list modal.

Open question for the user: preference among 1/2/3 (recorded in HANDOFF.md if unanswered; default = 1).
