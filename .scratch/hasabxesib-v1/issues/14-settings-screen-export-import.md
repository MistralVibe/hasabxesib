# 14: Settings screen — theme, language, lock, reminder, export/import

**What to build:** the Settings screen: theme picker (System/Light/Dark), language picker (English/Русский), base currency display, optional app lock (Face ID/fingerprint/PIN via expo-local-authentication) with enable/disable, optional daily reminder time picker, and Data section: export transactions as CSV, export full backup as JSON, import JSON backup (schema-validated, clear error on malformed file, restore replaces data after confirmation). Export uses expo-file-system + expo-sharing share sheet.

**Blocked by:** 02, 07

**Status:** ready-for-agent

- [ ] Theme, language, lock, reminder, currency all persist and take effect immediately
- [ ] CSV export produces a parseable file of all transactions; JSON export is a full backup
- [ ] Import validates the file and restores data; malformed file shows an error, no crash
- [ ] `tsc --noEmit` and Jest green
