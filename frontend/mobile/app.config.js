module.exports = {
  name: "MapYourWorld-mobile",
  slug: "mapyourworld-mobile",
  version: "1.0.0",
  orientation: "portrait",

  entryPoint: "./index.js", // Punto de entrada principal explícito

  // Deshabilitamos temporalmente las referencias a los recursos
  // icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  owner: "francodellaguila2", // Propietario del proyecto en Expo

  splash: {
    // image: "./assets/splash.png",
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
    package: "com.mapyourworld.app", // Nombre del paquete para Android
    adaptiveIcon: {
      // foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff"
    },
    // Forzar la inclusión del bundle
    bundleAssetName: "index.android.bundle",
  },

  web: {
    // favicon: "./assets/favicon.png",
    bundler: "metro"
  },

  // Desactivamos el auto-update check para evitar problemas
  updates: {
    enabled: false
  },

  // Configuración javascript engine
  jsEngine: "hermes",

  // Bundle en producción
  developmentClient: false,
  packagerOpts: {
    dev: false
  },

  extra: {
    rootDir: __dirname,
    eas: {
      projectId: "757d70e0-f889-46f3-a4bb-8066e43fe863" // ID del proyecto en EAS
    },
    API_URL: "https://mapyourworld.es"
  },

  // Habilitar la nueva arquitectura explícitamente
  newArchEnabled: true
};