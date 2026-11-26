# 07: Onboarding flow and settings persistence

**What to build:** first-launch onboarding (full currency list picker → optional quick budget seeding for a few categories → Home, all skippable) gated by a persisted "onboarded" flag; settings storage (base currency, theme mode, language, app-lock enabled, reminder time) via the settings repository, with defaults from device locale where sensible. Root layout redirects to onboarding until completed.

**Blocked by:** 01, 02

**Status:** ready-for-agent

- [ ] First launch shows onboarding; completing (or skipping) sets the flag and lands on Home tabs
- [ ] Base currency selectable from the full ISO 4217 list; persisted
- [ ] Quick budget seeding offers a few categories with editable caps; skippable
- [ ] Theme mode, language (en/ru), lock and reminder settings persist across restarts
- [ ] `tsc --noEmit` and Jest green
