module.exports = {
  name: "MapYourWorld-mobile",
  slug: "mapyourworld-mobile",
  version: "1.0.0",
  orientation: "portrait",
  //entryPoint: "./index.js", // Punto de entrada principal
  
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
    }
  },
  
  web: {
    // favicon: "./assets/favicon.png",
    bundler: "metro"
  },
  
  // Desactivamos el auto-update check para evitar problemas
  updates: {
    enabled: false
  },
  
  extra: {
    rootDir: __dirname,
    eas: {
      projectId: "620b1165-0238-4807-8766-6b2c3c1b76aa" // ID del proyecto en EAS
    }
  },
  
  // Habilitar la nueva arquitectura explícitamente
  newArchEnabled: true,
  
  // Configuración del Metro bundler para mejorar la resolución de módulos
  experimentalFeatures: {
    enableImprovedModuleResolution: true
  }
};