import type { CapacitorConfig } from "@capacitor/cli";

// Wrap the published web app for iOS / Android via Capacitor.
// To package for stores:
//   1) bun add -D @capacitor/cli && bun add @capacitor/core @capacitor/ios @capacitor/android
//   2) npx cap add ios && npx cap add android
//   3) npm run build && npx cap sync
//   4) npx cap open ios   (or:  npx cap open android)
const config: CapacitorConfig = {
  appId: "app.tasker.client",
  appName: "Tasker",
  webDir: "dist",
  backgroundColor: "#0a0a1a",
  ios: { contentInset: "always" },
  android: { allowMixedContent: false },
};

export default config;
