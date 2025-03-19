/**
 * Punto de entrada para desarrollo del frontend de MapYourWorld
 * Este archivo facilita la ejecución de configuraciones compartidas
 */

console.log(`
🌎 MapYourWorld Frontend

Este es un punto de entrada para desarrollo. Para iniciar las aplicaciones:

- Aplicación Web:     cd web && npm start       (http://localhost:3000)
- Aplicación Móvil:   cd mobile && npm start    (Expo)

Para más información, consulta la documentación en la carpeta /docs.
`);

// Interfaces para tipos
export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

// Configuración de API
export const API_URL = process.env.API_URL || 'https://mapyourworld.es';

// Configuración de autenticación
export const AUTH_STORAGE_KEY = 'mapyourworld_auth';
export const TOKEN_EXPIRY_BUFFER = 60 * 1000; // 1 minuto en milisegundos

// Constantes de la aplicación
export const APP_NAME = 'MapYourWorld';
export const APP_VERSION = '1.0.0';

// Configuración de mapas
export const DEFAULT_MAP_CENTER: GeoCoordinates = { latitude: 40.416775, longitude: -3.703790 }; // Madrid
export const DEFAULT_ZOOM_LEVEL = 12;

// Exportamos utilidades comunes que pueden ser usadas tanto en web como en móvil
export const formatDate = (date: Date | string | number): string => {
  const d = new Date(date);
  return d.toLocaleDateString();
};

export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}; 