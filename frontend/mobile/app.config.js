module.exports = {
  name: "MapYourWorld-mobile",
  slug: "mapyourworld-mobile",
  version: "1.0.0",
  orientation: "portrait",
  entryPoint: "./index.js",
  userInterfaceStyle: "automatic",
  owner: "francodellaguila2",
  splash: {
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  assetBundlePatterns: [
    "**/*"
  ],
  ios: {
    supportsTablet: true
  },
  android: {
    package: "com.mapyourworld.app",
    adaptiveIcon: {
      backgroundColor: "#ffffff"
    }
  },
  web: {
    bundler: "metro"
  },
  updates: {
    enabled: false
  },
  extra: {
    eas: {
        "projectId": "620b1165-0238-4807-8766-6b2c3c1b76aa"
    }
  }
};