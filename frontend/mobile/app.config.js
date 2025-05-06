module.exports = {
  name: "MapYourWorld-mobile",
  slug: "mapyourworld-mobile",
  version: "1.0.0",
  orientation: "portrait",
  // Deshabilitamos temporalmente las referencias a los recursos
  // icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
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
    adaptiveIcon: {
      // foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff"
    }
  },
  web: {
    favicon: "./assets/favicon.svg",
    bundler: "metro"
  },
  // Desactivamos el auto-update check para evitar problemas
  updates: {
    enabled: false
  },
  extra: {
    rootDir: __dirname
  },
  // Habilitar la nueva arquitectura explícitamente
  newArchEnabled: true,
  // Configuración del Metro bundler para mejorar la resolución de módulos
  experimentalFeatures: {
    enableImprovedModuleResolution: true
  }
}; 
