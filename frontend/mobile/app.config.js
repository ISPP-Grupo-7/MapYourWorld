module.exports = {
  name: "MapYourWorld-mobile",
  slug: "mapyourworld-mobile",
  version: "1.0.0",
  orientation: "portrait",

  // Cambia la línea del punto de entrada para usar indexForBundle.js en producción
  entryPoint: process.env.NODE_ENV === 'production' 
    ? "./indexForBundle.js" 
    : "./index.js",

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
  developmentClient: process.env.NODE_ENV !== 'production', // false en producción
  packagerOpts: {
    dev: process.env.NODE_ENV !== 'production' // false en producción
  },

  extra: {
    rootDir: __dirname,
    eas: {
      projectId: "620b1165-0238-4807-8766-6b2c3c1b76aa" // ID del proyecto en EAS
    },
    API_URL: "https://mapyourworld.es",
    enableNetworkDebugging: true
  },

  // Habilitar la nueva arquitectura explícitamente
  newArchEnabled: false
};