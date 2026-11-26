# HasabXesib v1 — UI/UX improvement plan

Written by the planning sub-session (ui-ux-pro-max skill + full codebase read, branch `main`, commit `d78f89f`+). Companion to `.scratch/hasabxesib-v1/issues/17-wayfinder-map-ui-ux.md`. **Plan only — nothing here is implemented.** Parent session commits this file at the next phase boundary.

Sources: every file under `app/` (all 5 tabs + `transaction`, `accounts`, `recurring`, `onboarding`, `_layout`, `+not-found`), all of `src/components/ui/*`, `src/theme/tokens.ts`, `src/theme/ThemeProvider.tsx`, `src/hooks/*`, `src/i18n/en.ts` (+ `ru.ts` parity greps), plus on-device screenshots in `/tmp/shots` (01–67, before/after home padding).

---

## (a) Design direction

**ui-ux-pro-max `--design-system` output** ("personal finance budget tracker mobile app, modern, minimal, trustworthy, dark+light themes") recommended Glassmorphism + a dark trust-blue palette (primary `#1E40AF`, accent `#059669`, "trust blue + profit green"), with typography pairings (Caveat/Quicksand, Inter). Adapted to this codebase's hard constraints:

- **Rejected: Glassmorphism.** Backdrop blur (10–20px) is the style's key effect, and the app has a strict no-new-native-deps rule (ADR-0005, AGENTS.md) with Expo Go as the test target. Blur layers on every card would also add overdraw on low-end Android. We keep the *feeling* (layered depth, gradient hero card) via the existing `expo-linear-gradient` hero card on Home only.
- **Adopted: Minimalism & Swiss style** (the actual `--domain style` match: clean, spacious, high contrast, essential elements, no decorative shadow noise, low accessibility risk, light+dark supported, perf cost: low). This is a *continuation* of what the codebase already does — `Card` + hairline borders + one accent — not a redesign.
- **Adopted from the finance palette**: the current accent (indigo `#6366F1`), income green and expense rose families match the "trust blue/green, red for outflow" convention. Keep hue families; fix the **light-theme income contrast** (see §c) — the database's `#059669`-on-white text is a known 3.1:1 trap.
- **Rejected: custom fonts.** The typography DB matches (Caveat/Quicksand, Calistoga/Inter) are web-landing-page pairings; loading Google Fonts adds a dependency + load-time risk for no gain. Stay on the system stack (SF Pro / Roboto) and build hierarchy with **weight (400/600/700/800) + size**, which the code already does. Add `fontVariant: ['tabular-nums']` for money columns instead (rule: `number-tabular`).
- **Icons**: `--domain icons` search returned **0 verified matches** (two retries) — per the skill's no-fabrication rule this is fallback guidance from `pro-rules.md`: the app already uses a single consistent family (`@expo/vector-icons` Ionicons, outline variants for empty states) — keep that discipline, add missing `accessibilityLabel`s and hit-area expansion.
- **One primary CTA per screen** (rule: `primary-action`): FAB on Home/Transactions, Save on forms. Everything else stays visually subordinate.

**Working rules applied throughout** (from `references/quick-reference.md` + `pro-rules.md`): 44pt/48dp touch targets, 8dp spacing rhythm, press feedback on every `Pressable`, 4.5:1 text contrast checked per theme separately, empty states that offer the next action, errors near the field, safe-area + fixed-element insets so scroll content is never hidden behind the FAB/tab bar.

---

## (b) Per-screen improvement list

Ranked by user impact within each screen. Each item names the real component and the ui-ux-pro-max rule it satisfies.

### Global / cross-cutting (all screens)

1. **FAB overlaps the last list row** (Home `ScrollView`, Transactions `FlashList`). Screenshot `66-tx-list.png` shows the last row under the FAB. Fix: `paddingBottom` inset (~96 incl. tab bar) on the scroll content containers, not a scroll listener. → *rules: `fixed-element-offset`, "Scroll content is not hidden behind fixed bars" (pro-rules Layout)*. **Highest impact — this hides real data today.**
2. **Touch targets below minimum.** Filter/selection chips everywhere (`transactions.tsx` `chip()` at `paddingVertical: 5`, `budgets.tsx`, `transaction.tsx`, `recurring.tsx`, `accounts.tsx`, `settings.tsx` `optionRow`) render ~26–30px tall — under the 44pt/48dp minimum. Raise visual height to ~36–40 and add `hitSlop` to reach 44+. The recurring "Skip" link is a bare 13px `Text` with `hitSlop: 8` — still under. → *rules: `touch-target-size`, `touch-spacing`.*
3. **No pressed feedback on most Pressables.** Only `Button`, `SegmentedControl` (via bg) and reports month buttons have pressed states. Card rows, all chips, settings rows have none — taps feel dead on Android. Add `style={({pressed}) => [pressed && {opacity: 0.85, transform:[{scale:0.98}]}]}` consistently (pure RN, no reanimated; respects the transform-only animation rule). → *rules: `press-feedback`, `scale-feedback`.*
4. **Accessibility semantics mostly missing.** Whole-app grep: 5 `accessibilityLabel`s, 13 `accessibilityRole`s. Missing: Transactions FAB (Home's has one), every chip, tx/budget/account rows, `SectionTitle` action (a `Text` with `onPress`, no role), settings Manage rows, accounts close button, `SegmentedControl` segments (no `accessibilityState={{selected}}`), `DateField` day cells and the field itself. → *rules: `aria-labels`, react-native stack guideline "Add accessibility labels — Severity: High".*
5. **Money amounts don't use tabular figures** — columns jitter when values change (Home, Transactions, Budgets, Reports rows). Add `fontVariant: ['tabular-nums']` on amount Texts (or one shared `AmountText` component — also a seam to remove the 6 duplicated row layouts). → *rule: `number-tabular`.*
6. **Delete/discoverability of destructive actions**: budget delete is **long-press only** (no visible affordance, no hint), account delete likewise. → *rules: `gesture-alternative`, "provide visible controls for critical actions"* — see Budgets item below for the concrete fix.
7. **`Alert.alert` used for success feedback** (`accounts.transferSaved`, `common.done` on import). Not a bug, but a native modal for "it worked" is heavy; acceptable in v1 (no toast dep allowed) — keep, but make sure every one has a **title**, not just a body (Android renders body-only alerts title-less). → *rule: `success-feedback` (partial).*

### Home (`app/(tabs)/home.tsx`)

1. FAB overlap fix (global #1) — the "Upcoming recurring" card is the last element and gets covered.
2. **Balance card**: gradient + padding landed (`c1f2201`); remaining polish: the month-spent line mixes two facts in one caption ("Spent this month: X of Y budget · No budget set"). Split into caption + right-aligned amount when a budget exists; keep `noBudget` as its own quieter line. → *rules: `visual-hierarchy`, `whitespace-balance`.*
3. Progress bar on the card fills white regardless of status until warning/exceeded — fine, but `summary.totalBudget === 0` hides the bar entirely; show the track at zero width so the card doesn't change height when the first budget is created. → *rule: `content-jumping`.*
4. Recent list rows: amount gets `tabular-nums` (global #5); row caption shows raw ISO date (`item.date`) — reuse the localized date-header formatting proposed for Transactions so Home and Transactions agree.
5. Empty state currently appears only when `transactions.length === 0`; it has no CTA (see EmptyState component item below).

### Transactions (`app/(tabs)/transactions.tsx`)

1. **Double "All" chips** (wayfinder ticket 19, user-reported; screenshots `43-tx-ru.png`, `66-tx-list.png`): the type row and the month row each start with `t('common.all')`. Default option 1 from the ticket: month row's reset chip becomes `t('transactions.allMonths')` (**key already exists in both `en.ts` and `ru.ts`, currently unused**) and the month group gets a visual separator/second row. No schema/store change — pure render + one key swap. → *rules: `compact-label-overflow` semantics — a chip's label must say which dimension it resets.*
2. FAB overlap fix (global #1) + FAB `accessibilityLabel`.
3. **Date headers show raw ISO** (`2026-11-26`). `dates.today`/`dates.yesterday` keys exist unused in both dictionaries. Format headers with `Intl.DateTimeFormat` (Hermes-safe, already used in `useFormatters`/`reports`) + Today/Yesterday substitution. → *rules: `number-formatting`/locale-aware dates.*
4. **Three stacked chip rows consume the whole first screen** before any transaction is visible. Collapse category/account rows into a single "Filters" disclosure (`transactions.filters` key exists, unused) that expands a compact sheet — keeps the top of the screen about data. → *rules: `progressive-disclosure`, `content-priority`.*
5. `noResultsBody` key exists but the list empty-state never renders it — wire it up so a filtered-empty list explains how to recover (reset action). → *rules: `empty-states`, `error-recovery`.*
6. Chips: pressed state + touch height + `accessibilityState={{selected}}` (global #2/#3/#4).

### Budgets (`app/(tabs)/budgets.tsx`)

1. **Delete is long-press-only** — no visible hint anywhere. Fix inside the existing inline editor `Card`: when `editing` a category that already has a budget, show a `variant="danger"` Delete button (reuse the confirm dialog `confirmDelete` already builds). → *rules: `gesture-alternative`, `destructive-emphasis`.*
2. The screen renders `t('budgets.title')` ("Budgets") as both the page title **and** the `SectionTitle` of the list — duplicated heading. Rename the section (new i18n key, e.g. `budgets.yourBudgets`).
3. The "New budget" area (`styles.label` + chips) sits *below* all budget rows — the primary "add" path is buried under content and unreachable without scrolling when there are many budgets. Move it directly under the summary `Card` (or make it a `SectionTitle` action), and mark already-budgeted categories visually in the chip row. → *rules: `primary-action`, `content-priority`.*
4. Summary card percent + spent/limit line: add `tabular-nums`; status label (`On track`/`Close to limit`/`Over budget`) is color-only-differentiated from the number — it does have text (good), keep, but ensure `budgetStatusColor` result also gets `fontWeight: 700` in both themes (already does). → *rule: `color-not-only` (satisfied, keep).*
5. Inline editor appears at the very bottom when opened from a top row — scroll the `Screen` ScrollView to the editor on `openEdit` (simple `scrollToEnd` ref, no deps). → *rule: `focus-not-obscured` analog for touch.*

### Reports (`app/(tabs)/reports.tsx`)

1. **Donut has no legend on the chart itself** — the category→color mapping only appears in the separate "Top categories" card. Chart-domain guidance: legend near the chart, direct labeling, donut accessible only with labels. Add compact legend (dot + name + %) directly under the `Donut`, cap at the existing 5 slices (`no-pie-overuse` already respected by `byCategory.slice(0,5)`). → *rules: `legend-visible`, `direct-labeling`, chart domain "donut: label slices with %".*
2. **Trend chart has no axis values** — the reader can't tell if a line at 3/4 height is TMT 500 or 5,000. Add min/max amount labels at the chart's left edge (two `Text`s, hand-built, no deps). → *rules: `axis-labels`, "label axes with units".*
3. Income/Expense bar chart: bars are 5px wide with 12 months; acceptable, but add thin baseline gridlines and keep the existing legend (already good). Suggest `gap` increase to 3 and bar width 6 for tap-distinguishability if a tap-tooltip is ever added (out of scope for v1 polish; note only).
4. Month nav buttons (`chevron-back/forward` in the month `Card`) — good pressed/disabled states already; add `accessibilityLabel` (keys `reports.prevMonth`/`nextMonth` exist and are used — verify they don't read as raw keys on device) and `disabled` uses opacity 0.3 (fine, also add `accessibilityState={{disabled}}`).
5. Each chart `Card` should carry an `accessibilityLabel` summary (e.g. "Spending by category, total TMT X, top: Food 42%") so the hand-built charts are screen-reader-summarizable (charts are pure Views today — invisible to TalkBack). → *rule: `screen-reader-summary`.*

### Settings (`app/(tabs)/settings.tsx`)

1. **Reminder time is a free-text `TextInput` expecting "HH:MM"** (`keyboardType="numbers-and-punctuation"`). Fragile and easy to enter wrong; validation silently reschedules only on valid parse. Replace with a small set of time chips (18:00/20:00/21:00 + custom) or two spinners — no new dep needed. → *rules: `input-helper-text`, forgiving input, `input-type-keyboard`.*
2. Manage rows (`Accounts & transfers`, `Recurring payments`) have a chevron but no pressed feedback, no `accessibilityRole="button"`/`accessibilityLabel` (row text is the label — add role + `hitSlop`). Same for the theme/language chips (global pass).
3. App lock card body text explains Face ID/fingerprint — good. After the pm-clear incident, consider adding a one-line "Make sure you know your device PIN" helper under the switch when enabling. → *rule: `input-helper-text` analog.*
4. Data section: import is destructive-replace and correctly confirms; keep. Export buttons show `'…'` while busy — add `disabled` + keep width stable (text swap already avoids layout shift — good).
5. About card is fine post-`{version}` fix.

### Transaction modal (`app/transaction.tsx`)

1. **Keyboard covers the Note field / bottom buttons** on small screens (walkthrough finding, ticket 20). The `ScrollView` has `keyboardShouldPersistTaps` but no keyboard-avoidance. Add `automaticallyAdjustKeyboardInsets` (iOS) + `android:windowSoftInputMode` is already default-adjust-resize in Expo; simplest robust fix: `contentContainerStyle={{ paddingBottom }}` driven by `Keyboard.addListener` frames, or RN's built-in `keyboardVerticalOffset` if a `KeyboardAvoidingView` is used. No deps. → *rules: `focus-not-obscured` (WCAG 2.2 AA), react-native stack guidance.*
2. **Single generic error line at the bottom** — validation failures (no account, no category, bad amount) render far from the offending field, and only one at a time. Move to per-field inline errors: highlight the Amount input border in `danger` when invalid, put "Select category" directly under the category chips, etc. `ValidationErrorKey` + `errors.*` keys already exist for all cases. → *rules: `error-placement`, `error-clarity`, `no-premature-validation` (validate on submit only — current behavior, keep).*
3. Amount field: the `≈ money(...)` preview below is good; add `tabular-nums` and keep `autoFocus` for new transactions (fast entry) — verified pattern on device.
4. Type switch resets `categoryId` — correct (category type mismatch), but give no feedback; subtle. Optional: keep if a matching category exists. Low priority, note only.
5. Buttons at the bottom (Save → Delete → Cancel stacked) match `primary-action` ordering; keep. Delete shows only in edit mode with a destructive confirm — good (`confirmation-dialogs`, `destructive-emphasis` satisfied).

### Recurring modal (`app/recurring.tsx`)

1. Same form issues as transaction (inline errors, keyboard, chips pass-through) — `RuleForm` duplicates the transaction form by accepted design (HANDOFF deviation #6); whatever is built for transaction.tsx should be mirrored here in the same ticket, not refactored now.
2. "Skip" action: tiny text target (see global #2); also add `accessibilityLabel` "Skip occurrence on {date}".
3. The queue section (`styles.queue`) is good progressive disclosure; add "Post now" affordance only if domain already supports it (`recurring.postNow` key exists but is unused — **check whether the store supports manual posting before ticketing**; if not, it's a v1.5 feature, exclude).
4. Header add/close button 36px — just under 44 target; bump to 44 or hitSlop.

### Accounts modal (`app/accounts.tsx`)

1. Mode switching (list/editor/transfer) replaces content with no transition — acceptable (no reanimated); ensure each mode has a clear title and a Cancel/back path (it does).
2. Account delete long-press-only (same as budgets): show Delete in the editor mode (it does appear there when `editing` — good; the long-press on the row is the extra hidden path; keep but document in the row with a subtle affordance or leave as power-user shortcut + add `accessibilityHint`).
3. Transfer flow: From/To as chip rows is clear; the saved `Alert` lacks a title (global #7); "≈" preview good. Color dots (`styles.colorDot` 28px) — add hitSlop + `accessibilityLabel` (color name or position; colors are decorative-ish but selection is state → `accessibilityState={{selected}}`).
4. Close (X) header button: 24px icon, no label, no hitSlop. Fix (global #4).

### Onboarding (`app/onboarding.tsx`)

1. **No step indicator** — two steps (currency → budgets) with no sense of progress or back. `onboarding.step` key ("Step {current} of {total}") exists in both dictionaries, unused. Render it above the title; add a Back text-button on step 2 (simple `setStep('currency')`). → *rules: `multi-step-progress`, "Multi-step flows show step indicator; allow back navigation".*
2. `onboarding.welcomeBody` exists but the welcome step renders only the title — show the body ("Track spending, budgets and accounts — privately, on your device.") to set expectations. Same for `currencyBody` (used) — consistent.
3. Currency radio rows: pressed feedback + `accessibilityState={{selected}}`; search field good (FlashList + keyboardShouldPersistTaps verified on device).
4. Budgets step: "Skip" and "Start tracking" both call `finish()` — identical behavior; fine, but label clarity ("Skip" implies something different happens). Either make Skip clear that caps entered so far are still saved, or drop one button. Decide in the ticket.

### Shared components (`src/components/ui/*`)

- **EmptyState**: add optional `action?: {label, onPress}` + render a `Button variant="secondary"` — "Tap + to add your first transaction" as *text* is weaker than a button that opens the flow (Home, Transactions, Budgets, Recurring all pass `title`/`body` only today). → *rule: `empty-states` — "helpful message **and action**".*
- **SectionTitle**: `action` is `Text` with `onPress` — add `accessibilityRole="button"` + pressed opacity.
- **SegmentedControl**: active text hardcodes `#FFFFFF` — fails 4.5:1 on the light-theme income green (`#059669` ≈ 3.1:1). Fix via token (§c: `income` light→`#047857`) or per-variant on-color. Add `accessibilityState={{selected: active}}`.
- **DateField**: solid hand-built calendar; prev/next `accessibilityLabel`s are hardcoded English `"prev"`/`"next"` — switch to existing keys (`reports.prevMonth` or dedicated `dates.prevMonth`). Day cells need labels ("12 November 2026"); the field button itself needs a label. → *rules: `aria-labels`, i18n parity.*
- **Card**: shadow + hairline border + radius from tokens — consistent; no change needed beyond the §c shadow token tweak.
- **Button**: primary uses `theme.shadows.fab` (a 14px glow) on *every* primary button — reads as a FAB shadow on inline buttons. Add a lighter `shadows.button` token or drop the shadow on non-FAB primaries. `disabled` opacity 0.5 fine; add `accessibilityState={{disabled}}`.
- **Screen**: `edges={['top']}` + tabs handle bottom — correct; the FAB-inset fix (global #1) belongs in the screens' content containers, not here.

---

## (c) Design-token changes (`src/theme/tokens.ts`)

All are value tweaks in the existing token shape — no new token *categories* except `shadows.button` and an optional `hit` inset constant. Per AGENTS.md, any `borderRadius` usage keeps `borderCurve: 'continuous'` (already true everywhere).

| Token | Light | Dark | Why (verified) |
|---|---|---|---|
| `colors.income` | `#059669` → **`#047857`** | keep `#34D399` | `#059669` on `#FFFFFF` ≈ 3.1:1 — under 4.5:1 for the 16px amount text on Home/Transactions/Reports; emerald-700 ≈ 5.2:1. Dark already passes (~8:1). (*`color-accessible-pairs`, check per-theme.)* |
| `colors.expense` | keep `#E11D48` | keep `#FB7185` | rose-600 on white ≈ 4.5:1 — at the line; acceptable, note in review. |
| `colors.tabBarInactive` | `#94A3B8` → **`#64748B`** | keep `#64748B` | light inactive on white ≈ 2.6:1 — under 3:1 for meaningful (selected vs unselected) UI. (*non-text contrast, `nav-state-active`.)* |
| `shadows.button` (new) | small: `{height: 2, opacity: 0.12, radius: 6}` | same, black | primary `Button` currently reuses the FAB glow (`shadows.fab` 14px/0.35) — too heavy for inline CTAs. (*`elevation-consistent`.)* |
| `type` | keep | keep | 16px body, 13px caption — within limits; no custom fonts (see §a). |
| `radii`, `spacing` | keep | keep | 4/8/16/24/36 rhythm already matches the 8dp system. |

No changes to `background`/`surface`/`border` — measured fine in both themes (textSecondary `#64748B` on `#FFFFFF` ≈ 4.8:1 ✓; dark `#94A3B8` on `#121828` ≈ 7:1 ✓).

---

## (d) Proposed ticket breakdown (vertical slices for a `/to-tickets` pass)

Each slice is demoable on-device (screenshot + logcat clean) and passes the full gate (`npx tsc --noEmit && npx eslint . && npx jest` + `CI=1 npx expo export --platform android`). i18n: every new string lands in `en.ts` **and** `ru.ts` in the same ticket. Tickets 01–04 are pure prefactors/enablers; 05+ are screen polish.

| # | Ticket | Blocked by | Delivers (user-visible) |
|---|---|---|---|
| 01 | **Token contrast + button shadow** — `income` light, `tabBarInactive` light, new `shadows.button`; amounts in Home/Transactions/Budgets/Reports get `tabular-nums` | none | Amounts stop jittering; light-theme income amounts legible; tab bar labels legible |
| 02 | **FAB insets + FAB a11y** — `paddingBottom` ~96 on Home `ScrollView` + Transactions `FlashList` content, `accessibilityLabel` on Transactions FAB | none | Last rows never hidden behind the FAB (closes the Home/Transactions overlap finding) |
| 03 | **Transactions filters fix (ticket 19, option 1)** — month reset chip `transactions.allMonths` (key exists), visual grouping of type vs month rows | 01 | Double-"All" ambiguity gone; each chip says what it resets |
| 04 | **Chips/press/a11y component pass** — min 44pt hit targets (visual ~36 + hitSlop), pressed feedback, `accessibilityRole/Label/State` on all chips, rows, `SectionTitle` action, `SegmentedControl` selected state, accounts close btn, recurring header btn | 01 | Every tap has visible feedback; TalkBack can name and select every control |
| 05 | **Transactions content polish** — localized date headers (Today/Yesterday/Intl), filters disclosure for category/account rows, `noResultsBody` wired into empty state | 03, 04 | Screen leads with data; empty-filter state explains recovery |
| 06 | **Budgets UX** — Delete button in inline editor, section title de-duplication (new key), "New budget" chips moved up, auto-scroll to editor | 04 | Destructive path is visible; add-budget is reachable without scrolling |
| 07 | **Forms: inline errors + keyboard** — per-field errors on `transaction.tsx` + `recurring.tsx` RuleForm (+ accounts editor), keyboard inset so Note/Save are never covered | 04 | Errors appear next to the field; keyboard never covers inputs (closes ticket-20 finding) |
| 08 | **Reports chart clarity** — donut legend w/ % under chart, trend min/max axis labels, per-card `accessibilityLabel` summaries | 01 | Charts readable without the companion card; screen-reader summary |
| 09 | **Settings polish** — reminder time chips/steppers, Manage rows roles+feedback, titled success alerts | 04 | Reminder time can't be mistyped; nav rows feel tappable |
| 10 | **Onboarding flow** — "Step 1 of 2" indicator (key exists), welcome body text, Back on step 2, skip/start clarity | none | Progress + back navigation in the first-run flow |
| 11 | **Empty states with action** — `EmptyState` optional CTA button wired on Home, Transactions, Budgets, Recurring (opens the relevant add flow) | 04 | Every empty screen leads the user to the next action |

Blocking rationale: 01 first because 03/05/08 consume its tokens; 04 gates everything that touches chips/rows so the a11y pattern is fixed once; 05 depends on 03's filter layout; 06/07/09/10/11 only need the shared components to be ready.

**Explicitly deferred (check-first items):** `recurring.postNow` manual-post button (verify store support exists before ticketing); custom-font loading; any chart tap-tooltip.

---

## (e) Non-goals / out of scope

- **No new native dependencies** — no blur/glassmorphism, no reanimated/worklets/gesture-handler, no victory-native/svg/skia (ADR-0005), no haptics, no custom fonts, no toast/snackbar libraries. Success feedback stays `Alert`-based.
- **No navigation redesign** — 5-tab bottom nav, modal stacks, and route structure stay as-is (`bottom-nav-limit` already satisfied).
- **No data-model/schema changes** — this plan is presentation + interaction only; `Money = number`, stores, repositories, and domain logic untouched.
- **No v2 features** — per-account currencies, web target, cloud sync, chart interactivity (tap-to-drill), custom-category management UI.
- **No web-polish work** — web remains a dev smoke-test target (ADR-0001).
- **No redesign of the visual language** — minimal/layered direction confirmed, not replaced; the gradient hero card, chip vocabulary, and Card-based rows stay.
- No commits/pushes from the planning session; this file lands as an untracked file for the main session to commit at the next phase boundary.

---

## (f) "Wow" direction — visual upgrade prototype (NEW)

The sections above make the current design *correct*. This section is about making it *memorable*, per the user's ask ("okay but not wow"). Following the `prototype` skill (UI branch) and `frontend-design` skill, a **3-variant visual prototype of the Home screen** was built as a single throwaway HTML file:

- **File**: `.scratch/hasabxesib-v1/prototype-home-variants.html`
- **View it**: `http://127.0.0.1:4317/prototype-home-variants.html` (a `python3 -m http.server 4317` is serving it from that folder; or just double-click the file, or open it on a phone — under 480px it fills the screen edge-to-edge, no desktop frame).
- **Controls**: floating bar below the phone, or `←`/`→` keys. Every variant has a light and dark theme (☀/☾). URL param `?variant=vA|vB|vC` makes a choice shareable.
- **Honesty constraint**: no backdrop blur anywhere (would need `expo-blur` = new native dep, banned); everything shown is reproducible with `expo-linear-gradient` + flat RN styles + shadows. System fonts only.

### The three variants (structurally different, not recolors)

**A · "Dusk" — gradient-led, dark-first fintech.** Keeps the app's indigo/violet family but spends the boldness in one place: a deep gradient sky flowing into a budget **ring** beside the balance, plus one gradient budget card floating above flat grouped-list rows (not per-row cards). Floating rounded **tab dock** instead of the system tab bar. RN cost: `expo-linear-gradient` header (already used), SVG-free ring via the existing tick-donut technique from Reports, `borderRadius` + `boxShadow` dock. This is "current design, turned up".

**B · "Ledger" — Swiss editorial money book.** Rejects cards entirely: paper background, oversized tabular balance as the hero, a single stacked month-spending bar with a real legend, transactions as a dense hairline-ruled *table* with a date column. One green accent, underlined active tab, square bordered FAB. Light-first with a serious dark mode. RN cost: pure token + layout work, zero gradients; cheapest to build, most distinctive vs. every other finance app. Also the natural home of the `tabular-nums` and raw-ISO-date fixes from §b.

**C · "Vault" — dark emerald, stat-chip dashboard.** Near-black-green surfaces, a balance card with a soft radial accent glow (a `LinearGradient` radial trick — no blur needed), a quick-stats row (Today / This week / This month), and **budget mini-bars pulled onto Home**. Pill tab dock with active-tint chip. Feels most like a modern neobank. RN cost: gradients + the existing `ProgressBar` reused in a compact home widget.

### VERDICT (user decision): Variant A · "Dusk" — kept and elevated (A v2)

The user picked A ("when I said 'Wow' it was about emotions when I see the UI — keep the same design, make it even better"). B and C are rejected as directions; the prototype retains them only as reference. A was then elevated in the prototype to **A v2** with these concrete moves, each mapped to its RN implementation (Expo Go-safe, no new deps):

| A v2 element (in prototype) | RN implementation | Notes |
|---|---|---|
| Dusk-sky hero: 3-stop `linear-gradient(165deg, #181343, #2B2770, #4A2B8F)`, rounded 36px bottom | `expo-linear-gradient` (already installed) in a hero `View` with `borderRadius: 36` + `borderCurve: 'continuous'`; light theme: `#DAE0FF → #E9E8FF → #F6ECFF` | Replaces the current small gradient `balanceCard`; the sky **owns** the boldness |
| Aurora glows (two soft radial washes) | Two low-opacity `LinearGradient` layers (rotated) inside the hero — approximation, NOT `expo-blur` | Pure decoration behind text; keep opacity ≤ .35 |
| Greeting line "Good evening · 26 November" | Plain `Text` + time-of-day helper + `Intl.DateTimeFormat` (Hermes-safe); new i18n keys `home.greetingMorning/Afternoon/Evening/Night` | Emotion anchor; replaces bare "Home" title |
| Oversized tabular balance, count-up on show | `fontVariant: ['tabular-nums']`, `letterSpacing: -2`, size ~46–52; count-up via built-in `Animated.timing` + `interpolate` on a text `setState` — **reanimated NOT needed** | ~900ms cubic ease-out |
| "▲ +X this month" delta chip | `income`-colored pill; needs a new `netInMonth` selector (income minus expenses for current month) in `src/domain` + store | Small domain addition, unit-testable |
| Budget ring (gradient stroke, rounded cap) | Reuse the **tick-donut technique** from `reports.tsx` (`Donut`) in a compact ring variant; gradient stroke approximated by two-tone ticks | No svg/skia (ADR-0005 holds) |
| "Spent this month" block with ring beside it | Reuses existing `monthBudgetSummary` domain call — data layer unchanged | |
| Budget card = quiet surface card (NOT gradient) | `Card` with `big` amount, `em` accent span, existing `ProgressBar`-like bar with accent gradient fill | Gradient moved to sky; one-bold-thing rule |
| Grouped list rows (tx list with hairline separators in one rounded surface) | `Card` + `tx` rows with `borderBottomWidth: hairline` | Same pattern as today, grouped instead of per-row cards |
| Staggered rise-in entrance | `Animated` with per-element `delay` (60ms steps), `opacity` + `translateY` only; ~500ms total; no state deps so no loop risk | One orchestrated moment on mount |
| Floating rounded tab dock w/ active pill | expo-router `Tabs` with custom `tabBar` prop (supported, no deps); active pill = `accentSoft` bg | This is the biggest structural change: replaces the default tab bar on all 5 tabs |
| FAB with gradient + accent glow | Existing FAB + `LinearGradient` + `boxShadow` in accent color | |

**Effect on §d ticket breakdown:** a new **ticket-00 "Design direction: Dusk A v2 (tokens v2 + Home hero)"** is prepended as the blocker for everything visual: it lands the hero sky, greeting, count-up, delta chip, ring, dock, and the token changes in §c plus the Dusk palette additions (`accent2` violet `#C084FC` light / `#7C3AED`, sky gradient stops as tokens). §d tickets 02–11 then inherit the direction mechanically (Budgets/Reports/Settings get the surface + hairline language; Transactions gets the grouped-list rows; modals get the same quiet-card treatment).

### Full-screen prototype set (built by 8 parallel subagents, Dusk A v2)

The direction was extended to every remaining screen; all mockups live in `.scratch/hasabxesib-v1/` and share one dataset (TMT, Nov 2026, Cash 900.00 / Card 2,055.00, total 2,955.00) so they read as one app. **Hub: `prototype-index.html`** (also served at `http://127.0.0.1:4317/prototype-index.html` while the planning session's static server runs).

| File | Screen | Key design moves to carry into RN |
|---|---|---|
| `prototype-home-variants.html` | Home (A v2) | Winner — see table above |
| `prototype-transactions.html` | Transactions | Compact dusk band (radius 28) + month chip; search pill; **separated type/month filter groups** (double-"All" fix visualized); localized date headers; one grouped surface w/ hairlines; working filter demo maps 1:1 to the existing `useMemo` filter |
| `prototype-budgets.html` | Budgets | Summary card w/ gradient bar + % badge; grouped budget rows w/ status colors (amber Entertainment); "New budget" chips with selected state; no FAB (matches real screen) |
| `prototype-reports.html` | Reports | Month selector card straddling the dusk band edge; SVG donut + on-chart legend (fixes §b Reports #1); bar chart w/ dominant current month; trend chart w/ min/max labels (fixes §b Reports #2); grouped biggest-tx list |
| `prototype-settings.html` | Settings | Caption titles outside cards; **live theme segmented control**; import visually separated + warning caption (destructive-replace); accent toggles |
| `prototype-transaction-modal.html` | Transaction modal | Amount as borderless centered hero w/ caret + "of X available"; type-colored segments; selected chips use category color border + tint (already the app's pattern); gradient Save owns the modal's only gradient |
| `prototype-recurring-modal.html` | Recurring | Rule card w/ Upcoming queue + 44px Skip rows; quiet sheet (no sky); frequency chips |
| `prototype-accounts-modal.html` | Accounts | Sheet over dimmed Home (scrim, no blur); grouped account rows w/ colored badges; From/To chips pre-filtered like the real code |
| `prototype-onboarding.html` | Onboarding | Full sky hero on step 1 (welcome copy finally used); "Step 2 of 2" progress pills (fixes §b Onboarding #1); Skip + Start tracking pairing |

Per-screen notes worth recording for the RN build: modals are **quiet** (sky lives only on tab screens + onboarding); the Settings mock proves the theme segmented control can switch live; the Transactions mock is a working filter demo — its empty state ("Nothing found / Try another search or reset the filters") uses the already-present but currently-unused `noResultsBody` key. Two children assigned Entertainment a violet (`#C084FC`/`#F472B6`) category color since the shared set had none — **decide the real Entertainment color when implementing**.

### How this is meant to be used (per the prototype skill)

1. The user flips between A/B/C (and light/dark) and reacts — the usual winning answer is a mix ("the ring from A, the table rows from B").
2. The verdict gets recorded here as the design decision; the chosen direction becomes a **ticket-00 "Design direction: tokens v2"** prepended to the breakdown in §d — it changes `tokens.ts` (§c) plus `Card`, the Home hero, and the tab bar chrome, and everything in §d rides on top of it.
3. The prototype file itself stays **out of the app**; the main session may capture it on a `prototype/home-variants` branch per the skill, or keep it untracked in `.scratch/`. It is throwaway — the winner gets rebuilt properly in RN, not pasted.
4. What the prototype deliberately does NOT decide: the other four tabs follow the Home direction mechanically; no v2 features sneak in through the visuals.
