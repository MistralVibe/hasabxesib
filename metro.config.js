// Expo Metro config. `wasm` is added to assetExts so expo-sqlite's web build
// (wa-sqlite.wasm) resolves when bundling for web — used only as a dev
// smoke-test target; v1 ships iOS + Android only (ADR-0001).
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

if (!config.resolver.assetExts.includes('wasm')) {
  config.resolver.assetExts.push('wasm');
}

module.exports = config;
