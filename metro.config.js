const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Firebase JS SDK v10+ package.json "exports" field breaks Metro's
// module resolution for firebase/auth in React Native — Metro picks
// a build that never registers the "auth" component with the app.
// Disabling package exports forces Metro back to the "main" field,
// which resolves the correct RN-compatible build.
config.resolver.unstable_enablePackageExports = false;

module.exports = withNativeWind(config, { input: "./global.css" });