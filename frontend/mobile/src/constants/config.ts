/**
 * Configuración global para la aplicación móvil
 * Define variables globales y configuraciones del entorno
 */
import Constants from "expo-constants";
import { Platform } from "react-native";

const getBackendUrl = () => {
  console.log("Obteniendo URL de backend. Plataforma:", Platform.OS);
  
  // Si estamos en una versión de producción (APK instalada), usamos la URL de Azure
  if (!__DEV__) {
    console.log("Entorno de producción detectado, usando URL de Azure");
    return "https://mapyourworld.es"; // Cambia esto a tu URL real de Azure
  }
  
  // Si estamos en web, intenta obtener la IP del servidor actual
  if (Platform.OS === 'web') {
    try {
      console.log("Entorno web detectado, obteniendo URL del host");
      const hostname = window.location.hostname;
      const port = window.location.port;
      const protocol = window.location.protocol;
      
      console.log("Información de ubicación web:", { hostname, port, protocol });
      
      // Si estamos en un servidor real, se podría usar el hostname actual;
      // pero para forzar el uso del dominio de producción, se retorna siempre el mismo.
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        console.log(`Entorno web no local detectado, usando https://mapyourworld.es/`);
        return "https://mapyourworld.es/";
      }
      
      // En desarrollo local web, igualmente se fuerza el dominio de producción
      console.log("Desarrollo local web detectado, usando https://mapyourworld.es/");
      return "https://mapyourworld.es/";
    } catch (error) {
      console.warn("Error al obtener la ubicación del navegador:", error);
      console.log("Usando fallback para web: https://mapyourworld.es/");
      return "https://mapyourworld.es/";
    }
  }

  // Para dispositivos móviles (APK), se usa siempre el dominio de producción
  console.log("Entorno móvil detectado, usando siempre el dominio de producción: https://mapyourworld.es/");
  return "https://mapyourworld.es/";
};

// Configuración de API
export const API_URL = "https://mapyourworld.es/";
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