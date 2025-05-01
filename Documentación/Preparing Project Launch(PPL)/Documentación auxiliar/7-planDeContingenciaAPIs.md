<p align="center">
  <img src="https://www.ucm.es/al-acmes/file/logo-universidad-sevilla/?ver" alt="Logo Universidad Sevilla" width="200" height="200">
  <img src="https://i.imgur.com/vlzkG4H.png" alt="Imagen Imgur" height="200">
</p>

<h1 align="center">Plan de Contingencia APIs</h1>

<p align="center">
    Grupo 7
</p>
<p align="center">
    ISPP-MapYourWorld
</p>
<p align="center">
    PPL
</p>
<p align="center">
    Alejandro Aragón Sánchez
</p>
<p align="center">
    22/04/2025
</p>

---

## CONTROL DE VERSIONES

| VERSIÓN | FECHA     | COMENTARIOS                  | AUTOR     |
|---------|-----------|------------------------------|-----------|
| V1      | 22/04/2025| Versión inicial | Alejandro Aragón Sánchez |

---

## Índice

- [Resumen Ejecutivo](#resumen-ejecutivo)
- [1. Contingencia para Pagos (Stripe)](#1-contingencia-para-pagos-stripe)
  - [1.1 Propósito](#11-propósito)
  - [1.2 Alcance](#12-alcance)
  - [1.3 Estrategia Adoptada (Implementada)](#13-estrategia-adoptada-implementada)
  - [1.4 Medidas Potenciales (No Implementadas)](#14-medidas-potenciales-no-implementadas)
  - [1.5 Flujo de Error (Implementado)](#15-flujo-de-error-implementado)
  - [1.6 Próximos Pasos](#16-próximos-pasos)
- [2. Contingencia para Mapas y Localización](#2-contingencia-para-mapas-y-localización)
  - [2.1 Propósito](#21-propósito)
  - [2.2 Alcance](#22-alcance)
  - [2.3 Estrategia Adoptada (Implementada)](#23-estrategia-adoptada-implementada)
  - [2.4 Medidas Potenciales (No Implementadas)](#24-medidas-potenciales-no-implementadas)
  - [2.5 Flujo de Error (Implementado)](#25-flujo-de-error-implementado)
  - [2.6 Próximos Pasos](#26-próximos-pasos)

---

## Resumen Ejecutivo

Ambos proveedores externos (Stripe para pagos y los SDK/tile servers para mapas) tienen un **uptime ≥ 99,98 %**.  
Dada la **baja criticidad** del downtime y el **alcance actual de la app**, se implementan solo controles básicos: manejo de errores y mensajería clara.  
Se documentan medidas avanzadas para fases futuras de mayor escala.

---

## 1. Contingencia para Pagos (Stripe)

### 1.1 Propósito

Mantener operativa la experiencia de pago y suscripciones, mostrando mensajes claros y gestionando flujos de error de Stripe.

### 1.2 Alcance

- **Front‑end**: React Native con `@stripe/stripe-react-native`  
- **Back‑end**: Node.js + Express + Stripe SDK (apiVersion 2025-02-24)  
- **Cobertura**: PaymentSheet para pagos únicos, suscripción y upgrade a PREMIUM  
- **Exclusiones**: multi‑gateway, colas persistentes

### 1.3 Estrategia Adoptada (Implementada)

| Componente | Acción                   | Detalle |
|------------|--------------------------|---------|
| Backend    | Respuesta 503 + JSON     | `{error: "stripe_unavailable", code: "stripe_unavailable"}` |
|            | Timeout                  | `AbortController ≤ 5 s` |
|            | Logging                  | Nivel error con `intent_id`, `userId`, timestamp |
| Cliente    | Alertas                  | `Alert.alert("Servicio de pagos no disponible", ...)` |
|            | Abortar reintentos       | Para evitar duplicados y liberar UI |
|            | UX orientativa           | Botón “Reintentar más tarde” y enlace a ayuda |

### 1.4 Medidas Potenciales (No Implementadas)

- Monitorización avanzada: RSS → Slack, Grafana, synthetic checks  
- Retry + colas con backoff exponencial  
- “Modo de gracia”: `pending_payment` con cargo posterior  
- Fallback a Adyen / PayPal vía flag  
- SLA premium con soporte 24×7  
- Simulacros trimestrales (errores 5xx)

### 1.5 Flujo de Error (Implementado)

1. Excepción Stripe → 503 con `stripe_unavailable`  
2. App muestra alerta modal  
3. Usuario reintenta manualmente o sale

### 1.6 Próximos Pasos

- Revisar métricas cada trimestre  
- Reevaluar si > 10.000 transacciones/mes o incidentes > 30 min/trimestre

---

## 2. Contingencia para Mapas y Localización

### 2.1 Propósito

Asegurar que, ante fallos de carga de mapas o de acceso a la ubicación, la experiencia del usuario sea comprensible y segura, evitando bloqueos de la aplicación y orientando sobre los pasos a seguir. Además, documentar alternativas de contingencia que podrían adoptarse en proyectos con mayores exigencias de disponibilidad u operación offline.

### 2.2 Alcance

- **App móvil**: `react-native-maps 1.20.1`, `expo-location 18`  
- **Web**: `leaflet 1.9.4` con `react-leaflet 5`  
- **Exclusiones**: navegación giro-a-giro, descarga masiva offline

### 2.3 Estrategia Adoptada (Implementada)

| Componente           | Acción                         | Código / Ubicación          |
|----------------------|--------------------------------|-----------------------------|
| Permisos GPS         | `Location.requestForegroundPermissionsAsync` → modal si denegado | `CollaborativeMapScreen`, `MapScreen` |
| Tracking             | `watchPositionAsync (High, 1 s / 5 m)` | `startLocationTracking` |
| Carga de datos       | `ActivityIndicator` durante fetch | Carga condicional |
| Errores de red       | `try/catch + AlertModal`        | `fetchDistricts`, `fetchPOIs` |
| Validación POIs      | Rechazar POI fuera de distrito  | `handleMapPress` |
| Recarga manual       | Botón “Recargar datos”          | `initializeMap()` |
| Mensajería unificada | Modal de alerta web-like        | `AlertModal` component |

> **No implementado aún**: detección offline (`NetInfo`), `tileerror/onError`, caché de tiles, logging en servidor, fallback cartográfico.

### 2.4 Medidas Potenciales (No Implementadas)

- Caché offline: tiles en SQLite o Service Worker  
- Proveedor alternativo (Mapbox, MapTiler) con flag  
- TileServer propio con CDN  
- Monitorización (0/0/0.png) + alertas (Datadog)  
- Simulacros (404 en tileerror, tests offline)  
- Fallback GeoIP si accuracy > 1000 m

### 2.5 Flujo de Error (Implementado)

1. Tileerror o timeout de GPS capturado  
2. Mostrar: “Servicio de mapas no disponible” / “Permiso denegado”  
3. Capas ocultas según dependencia de ubicación  
4. Usuario puede usar pull-to-refresh o botón “Reintentar”

### 2.6 Próximos Pasos

- Monitorizar latencia p95 y errores de tiles en cada sprint  
- Prototipo MapLibre GL + vector-tiles  
- Evaluar mapas offline para zonas de baja conectividad (LT 2026)
