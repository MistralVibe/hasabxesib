# Expo + React Native + TypeScript for iOS and Android, no web target in v1

We build HasabXesib as a single Expo (React Native) codebase in TypeScript shipping to the iOS App Store and Google Play. Web/desktop targets were considered and deliberately left out of v1: the product is a personal on-the-go tracker, and Expo Web would add a third surface to test for no v1 user benefit. The decision is hard to reverse later (a rewrite would be needed for desktop), so it is recorded here.

Considered options: Expo + RN + TS (chosen), Flutter/Dart, bare React Native CLI, web-only PWA. Expo wins on tooling, OTA updates, and the breadth of Expo SDK modules this app needs (SQLite, notifications, local authentication, sharing, file system).
