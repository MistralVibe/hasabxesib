# Walkthrough findings backlog (on-device, adb rig)

`wayfinder:research` — collects confirmed UI/UX + functional findings from the on-device walkthrough (HANDOFF priority 1). Each finding graduates into its own decision/execution ticket when sharp.

## How to use

Append findings here as they're confirmed on device (screenshot ref + logcat state). Promote to a numbered ticket when the fix/decision is clear.

## Findings so far

- 2026-11-26: Budgets rows showed raw `{limit}` placeholder → fixed (see ticket 18).
- 2026-11-26: Transactions filter row has two "All" chips (type + month) on one line → ticket 19.
- 2026-11-26: On the New transaction screen the numeric keyboard covers the Note field; adb taps behind the keyboard land on keys (test-rig note, not necessarily a product bug — but worth checking that the form scrolls when the keyboard opens on small screens).
