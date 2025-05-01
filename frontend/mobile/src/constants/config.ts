/**
 * Configuración global para la aplicación móvil
 * Define variables globales y configuraciones del entorno
 */
import Constants from "expo-constants";
import { Platform } from "react-native";

const getBackendUrl = () => {
  console.log("Obteniendo URL de backend. Plataforma:", Platform.OS);
  
  // Si estamos en web, intenta obtener la IP del servidor actual
  if (Platform.OS === 'web') {
    try {
      console.log("Entorno web detectado, obteniendo URL del host");
      const hostname = window.location.hostname;
      const port = window.location.port;
      const protocol = window.location.protocol;
      
      console.log("Información de ubicación web:", { hostname, port, protocol });
      
      // Si estamos en un servidor real, usa esa IP
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        // Usamos el mismo hostname que la aplicación web
        console.log(`Usando hostname del servidor: ${hostname}`);
        return `http://${hostname}:3000`;
      }
      
      // En desarrollo local web, usa localhost
      console.log("Desarrollo local web detectado, usando localhost:3000");
      return 'http://localhost:3000';
    } catch (error) {
      console.warn("Error al obtener la ubicación del navegador:", error);
      console.log("Usando fallback para web: localhost:3000");
      return 'http://localhost:3000';
    }
  }

  // Para dispositivos móviles, intenta usar Expo
  console.log("Entorno móvil detectado, intentando obtener IP de Expo");
  const expoUrl = Constants.expoConfig?.hostUri || Constants.manifest?.hostUri;
  console.log("URL de Expo obtenida:", expoUrl);

  if (!expoUrl) {
    console.warn("No se pudo obtener la IP de Expo.");
    // Como fallback, usamos una IP estática que el usuario puede cambiar según su red
    console.log("Usando IP estática como fallback: 192.168.1.33:3000");
    return "http://192.168.1.33:3000";
  }

  try {
    // Extraer solo la IP desde "192.168.1.33:8081"
    const ip = expoUrl.split(":")[0];
    
    // Comprobación adicional para asegurarse de que la IP sea válida
    if (!ip || !/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
      console.warn("IP extraída no válida:", ip);
      console.log("Usando IP estática como fallback: 192.168.1.33:3000");
      return "http://192.168.1.33:3000";
    }

    console.log(`Usando IP de Expo: ${ip}:3000`);
    return `http://${ip}:3000`;
  } catch (error) {
    console.error("Error al procesar la URL de Expo:", error);
    console.log("Usando IP estática como fallback: 192.168.1.33:3000");
    return "http://192.168.1.33:3000";
  }
};

// Configuración de API
//export const API_URL = process.env.API_URL || `http://localhost:3000`;
export const API_URL = getBackendUrl();
console.log("API_URL configurada como:", API_URL);
export const API_TIMEOUT = 30000; // 30 segundos

// Configuración de autenticación
export const AUTH_STORAGE_KEY = '@MapYourWorld:auth';
export const TOKEN_EXPIRY_BUFFER = 300; // 5 minutos en segundos

// Configuración de mapas
export const MAP_DEFAULT_ZOOM = 14;
export const MAP_DEFAULT_LOCATION = {
  latitude: 37.3886303,
  longitude: -5.9953403, // Sevilla como ubicación por defecto
};
export const MAP_STYLE = 'streets-v11'; // Estilo de mapa por defecto

// Configuración de caché
export const CACHE_EXPIRY = 86400000; // 24 horas en milisegundos
export const MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB

// Versión de la aplicación
export const APP_VERSION = '1.0.0';

// Configuración de notificaciones
export const NOTIFICATION_CHANNEL_ID = 'mapyourworld-notifications';
export const NOTIFICATION_CHANNEL_NAME = 'MapYourWorld Notificaciones';

// Configuración de analíticas
export const ANALYTICS_ENABLED = true;
export const ANALYTICS_SAMPLE_RATE = 0.5; // 50% de eventos capturados

// Límites de la aplicación
export const MAX_PHOTOS_PER_POI = 10;
export const MAX_COMMENTS_PER_POST = 50; 


