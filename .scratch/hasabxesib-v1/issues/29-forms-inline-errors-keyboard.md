# 29: Forms — per-field inline errors + keyboard never covers inputs (transaction, recurring, accounts)

**What to build:** on the transaction/recurring/account forms, validation errors appear next to the offending field (amount border danger, "Select category" under chips) using existing errors.* keys, validate-on-submit kept; add keyboard inset handling so Note/Save are never covered by the keyboard on small screens (KeyboardAvoidingView / Keyboard listener padding — no deps). **Blocked by:** 26. **Status:** ready-for-agent

- [ ] Inline per-field errors; keyboard never obscures Note/Save (device proof on the transaction modal)
- [ ] Gates green; commit
