# 26: Component pass — chip touch targets, pressed feedback, accessibility roles

**What to build:** across all screens: chips/rows get min 44pt hit targets (visual ~36px + hitSlop), pressed feedback (`opacity 0.85 / scale 0.98` via style callback — pure RN), accessibilityRole/Label/State on chips, rows, SectionTitle action, SegmentedControl segments (accessibilityState selected), accounts close button, recurring header button (bump 36→44). **Blocked by:** 21. **Status:** ready-for-agent

- [ ] Every interactive element ≥44pt hit area, has pressed state and a11y role/label/state
- [ ] Device pass over all screens; gates green; commit
