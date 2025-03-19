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

// Este archivo puede usarse para exponer utilidades, configuraciones y constantes compartidas
// entre las aplicaciones web y móvil

// Configuración de API
exports.API_URL = process.env.API_URL || 'https://mapyourworld.es';

// Configuración de autenticación
exports.AUTH_STORAGE_KEY = 'mapyourworld_auth';
exports.TOKEN_EXPIRY_BUFFER = 60 * 1000; // 1 minuto en milisegundos

// Constantes de la aplicación
exports.APP_NAME = 'MapYourWorld';
exports.APP_VERSION = '1.0.0';

// Configuración de mapas
exports.DEFAULT_MAP_CENTER = { latitude: 40.416775, longitude: -3.703790 }; // Madrid
exports.DEFAULT_ZOOM_LEVEL = 12;

// Exportamos utilidades comunes que pueden ser usadas tanto en web como en móvil
exports.formatDate = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString();
};

exports.formatDistance = (meters) => {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}; 