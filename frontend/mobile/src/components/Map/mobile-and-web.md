# Solución para Problemas de Mapas en Web y Móvil

## Problema Original

La aplicación MapYourWorld presentaba problemas al ejecutarse en entorno web mientras que funcionaba correctamente en dispositivos móviles. Los principales problemas identificados fueron:

1. **Error de React Hooks**: Al cargar la aplicación en web aparecía el error "Invalid hook call" relacionado con los componentes de `react-leaflet`.
2. **Pantalla en blanco**: Los mapas no se renderizaban correctamente en web, mostrando una pantalla en blanco.
3. **Conflicto de versiones**: Existía un conflicto entre las versiones de React utilizadas por `react-leaflet` y la aplicación principal.
4. **Problemas con SSR (Server Side Rendering)**: Los componentes de Leaflet intentaban acceder a objetos del DOM durante el renderizado del servidor, lo que causaba errores.

El error principal era:
```
Error: Invalid hook call. Hooks can only be called inside of the body of a function component.
```

Este error suele ocurrir por tres razones:
1. Versiones incompatibles de React
2. Múltiples copias de React en la misma aplicación
3. Violación de las reglas de los Hooks de React

## Solución Implementada

Se implementó una solución completa que evita por completo el uso de `react-leaflet` y utiliza directamente la API nativa de Leaflet:

### 1. Eliminación de react-leaflet

Se eliminaron todas las importaciones y referencias a los componentes de `react-leaflet` (`MapContainer`, `TileLayer`, `Polygon`, etc.) para evitar los problemas de hooks.

### 2. Carga dinámica de Leaflet

- Se implementó un sistema de carga dinámica asíncrona para el módulo de Leaflet
- Se creó un mecanismo para cargar el CSS de Leaflet manualmente mediante un elemento `<link>` insertado en el DOM
- Se agregaron verificaciones para asegurar que Leaflet solo se cargue en entorno web

```typescript
// Implementación de carga manual de Leaflet
const loadLeaflet = async () => {
  if (typeof window !== 'undefined' && typeof document !== 'undefined' && !leafletLoaded) {
    // Cargar módulo Leaflet
    const leafletModule = await import('leaflet');
    L = leafletModule.default || leafletModule;
    
    // Cargar CSS manualmente
    const linkElement = document.createElement('link');
    linkElement.rel = 'stylesheet';
    linkElement.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    linkElement.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
    linkElement.crossOrigin = '';
    document.head.appendChild(linkElement);
    
    // Configurar iconos
    L.Icon.Default.mergeOptions({...});
    
    leafletLoaded = true;
  }
};
```

### 3. Implementación nativa con useRef y useEffect

Se creó un componente personalizado `LeafletMap` que:
- Utiliza `useRef` para mantener referencias al contenedor del mapa y a la instancia del mapa
- Inicializa el mapa usando la API nativa de Leaflet dentro de un `useEffect`
- Implementa la limpieza correcta al desmontar el componente

```typescript
const LeafletMap = ({ location, distritos }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  
  useEffect(() => {
    if (!mapContainerRef.current || !L) return;
    
    // Crear instancia del mapa
    const map = L.map(mapContainerRef.current).setView(location, 13);
    
    // Agregar capa de mosaicos
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {...}).addTo(map);
    
    // Añadir polígonos para distritos
    distritos.forEach((distrito) => {
      L.polygon(distrito.coordenadas, {...}).addTo(map);
    });
    
    mapInstanceRef.current = map;
    
    // Limpieza
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [location, distritos]);
  
  return (
    <div style={{height: "100vh", width: "100vw"}}>
      <div ref={mapContainerRef} style={{height: "100%", width: "100%"}} />
    </div>
  );
};
```

### 4. Renderizado condicional y mejor manejo de errores

- Se implementó un sistema de renderizado condicional basado en estados (`loading`, `error`, `leafletReady`)
- Se mejoró el manejo de errores con mensajes descriptivos
- Se agregaron logs de depuración para facilitar la identificación de problemas

## Compatibilidad con Móvil

La solución mantiene la compatibilidad con la versión móvil gracias a:

1. El uso de archivos con extensión `.web.tsx` que solo se utilizan en la compilación para web
2. En móvil, se siguen utilizando los componentes nativos de mapas a través de la biblioteca `react-native-maps`
3. La lógica de negocio (obtención de distritos, transformación de coordenadas) es compartida entre ambas plataformas

## Ventajas de la Nueva Implementación

1. **Elimina conflictos de React**: Al no usar react-leaflet, eliminamos los problemas de hooks inválidos
2. **Mejor rendimiento**: La API nativa de Leaflet suele ser más eficiente que los wrappers para React
3. **Control más preciso**: Tenemos control directo sobre cómo se inicializa y actualiza el mapa
4. **Compatibilidad mejorada**: Evitamos los problemas conocidos entre react-leaflet y Expo/React Native
5. **Carga más eficiente**: El CSS se carga mediante CDN, lo que mejora la velocidad y la confiabilidad
6. **Código más mantenible**: La separación clara entre la inicialización de Leaflet y el renderizado del mapa facilita el mantenimiento

## Problemas Resueltos

1. ✅ Los mapas se renderizan correctamente en web
2. ✅ No hay errores de hooks inválidos
3. ✅ La aplicación funciona tanto en dispositivos móviles como en navegadores web
4. ✅ Mejor manejo de errores y estados de carga
5. ✅ Mejor experiencia de usuario con feedback visual durante la carga

## Consideraciones Futuras

1. Considerar el uso de un paquete de tipos para Leaflet para mejorar el tipado en TypeScript
2. Evaluar si se requieren optimizaciones adicionales para mapas con muchos polígonos
3. Implementar pruebas automatizadas para asegurar la compatibilidad continua
4. Mantener actualizadas las dependencias de Leaflet para asegurar la seguridad y rendimiento

---

Para cualquier problema futuro, se recomienda revisar:
- La consola del navegador para errores específicos
- Que Leaflet se cargue correctamente (revisar los logs de "Leaflet configurado correctamente")
- La correcta transformación de las coordenadas desde el formato GeoJSON
- El acceso a la geolocalización (permisos del navegador) 