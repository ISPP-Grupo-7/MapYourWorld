# 🌍 MapYourWorld

Map Your World es un divertido juego con el que podrás vivir experiencias interactivas orientadas a adictos a los viajes: crea y registra puntos de interés, desbloquea distritos solo o con amigos, completa logros y conecta con nuestra comunidad de viajeros. Map Your World posee un gran componente de gamificación (mediante logros que recompensan la exploración) y social (conecta con amigos y participa con ellos en mapas colaborativos).

<div align="center">
  <h2>🚀 ¡ACTUALIZACIÓN IMPORTANTE! 🚀</h2>
  <p>Hemos simplificado la ejecución de la aplicación</p>
  <code>npm run app</code>
</div>

## 🚨 IMPORTANTE: Cambios Recientes en la Ejecución del Proyecto

Hemos realizado varias mejoras para simplificar la ejecución del proyecto:

1. **Arrancar el proyecto**: 
   ```bash
   node scripts/start-without-microservice.js
   ```
   Este comando arranca la aplicación por completo.

2. **Arrancar solo el backend**:
   ```bash
   node backend/runBackend.ts
   ```
   Este comando arranca solamente el backend de la aplicación, en el puerto 3000

3. **Arrancar solo el frontend**:
   ```bash
   node frontend/runFrontend.ts
   ```
   Este comando arranca solamente el frontend de la aplicación, en el puerto 4444 en el caso de web, y 6969 en el caso de móvil
   

## 📋 Tabla de Contenidos

- [Estructura del Proyecto](#estructura-del-proyecto)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Desarrollo](#desarrollo)
- [Pruebas](#pruebas)
- [Despliegue](#despliegue)
- [Solución de Problemas Comunes](#solución-de-problemas-comunes)
- [Contribuir](#contribuir)

## Estructura del Proyecto

```
mapyourworld/
├── backend/                 # Servicios de backend
│   ├── api-gateway/         # API Gateway
│   ├── auth-service/        # Servicio de autenticación
│   ├── user-service/        # Servicio de usuarios
│   ├── map-service/         # Servicio de mapas
│   ├── social-service/      # Servicio social
│   └── notification-service/# Servicio de notificaciones
├── frontend/                # Aplicaciones cliente
│   ├── web/                 # Aplicación web React
│   └── mobile/              # Aplicación móvil React Native
├── shared/                  # Código compartido
│   ├── config/              # Configuraciones comunes
│   ├── libs/                # Librerías compartidas
│   ├── security/            # Utilidades de seguridad
│   └── websocket/           # Implementación de WebSockets
├── infrastructure/          # Configuración de infraestructura
│   ├── compose/             # Archivos Docker Compose
│   └── docker/              # Dockerfiles
└── scripts/                 # Scripts de utilidad
```

## Requisitos

- **Node.js**: v18.0.0 o superior
- **npm**: v8.0.0 o superior
- **Git**
- **postgreSQL** y su extensión **postGis**

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/mapyourworld.git
cd mapyourworld
```

### 2. Gestión de dependencias con script automatizado

Para facilitar la gestión de dependencias del proyecto, puedes utilizar el script `actualizar-dependencias.js`:

```bash
node actualizar-dependencias.js
```

Este script ofrece las siguientes opciones:

1. **Borrar todos los node_modules del proyecto**: Elimina de forma recursiva todos los directorios `node_modules` en el proyecto.
2. **Instalar todas las dependencias del proyecto**: Reinstala todas las dependencias definidas en todos los archivos `package.json`.
3. **Fijar versiones exactas desde node_modules instalados**: Actualiza los archivos `package.json` para utilizar las versiones exactas de las dependencias instaladas.

Es especialmente útil cuando:
- Necesitas realizar una instalación limpia del proyecto
- Hay conflictos de dependencias o errores de compatibilidad
- Quieres asegurarte de que todos los miembros del equipo utilizan las mismas versiones de dependencias
  
### 3. Verificar la instalación

Para asegurarte de que la instalación se realizó correctamente, ejecuta:

```bash
npx tsc --noEmit
```

Si ves algunos errores relacionados con `ts-expect-error` o imports faltantes, no te preocupes, son normales en esta etapa del desarrollo y se resolverán más adelante.

### 4. Configurar variables de entorno (aún no listo) 

Copia los archivos de ejemplo de variables de entorno y personalízalos según sea necesario:

```bash
# Para el backend
cp backend/.env.example backend/.env

# Para el frontend web
cp frontend/web/.env.example frontend/web/.env

# Para el frontend móvil
cp frontend/mobile/.env.example frontend/mobile/.env
```

## Desarrollo

### Ejecutar todo el proyecto en modo desarrollo-debug

Este comando iniciará tanto el backend como el frontend web:

```bash
npm run dev
```

### Verificar tipos y linting

Para verificar los tipos en todo el proyecto:

```bash
npm run type-check
```

Para ejecutar el linter y encontrar problemas de estilo:

```bash
npm run lint
```

Para arreglar automáticamente problemas de linting:

```bash
npm run lint:fix
```

### Iniciar servicios externos con Docker

Para iniciar servicios como PostgreSQL, Redis y RabbitMQ:

```bash
npm run docker:backend-only
```

## 🧪 Pruebas

### Ejecutar todas las pruebas

```bash
npm test
```

### Ejecutar pruebas del backend

```bash
npm run test:backend
```

### Ejecutar pruebas de la aplicación web

```bash
npm run test:web
```

### Ejecutar pruebas de la aplicación móvil

```bash
npm run test:mobile
```

## Despliegue

### Usando el script de despliegue

El script de despliegue te guiará a través del proceso:

```bash
npm run deploy
```

Actualmente la aplicación se puede visitar en [el siguiente enlace](https://app3.mapyourworld.es/)

## Solución de Problemas Comunes

### Problemas con la ejecución de scripts npm

Si encuentras problemas al ejecutar los scripts npm:

1. Asegúrate de estar en la raíz del proyecto
2. Usa el nombre completo del script (por ejemplo, `npm run app`)
3. Si los comandos muestran scripts no esperados, es debido a la estructura de workspaces de npm

### Error de dependencias faltantes

Si encuentras errores como "Cannot find module..." después de la instalación:

```bash
# Intenta reinstalar las dependencias
rm -rf node_modules
npm install

# Si el problema persiste, instala la dependencia específica
npm install nombre-del-paquete
```

### Problemas con TypeScript

Si encuentras errores de TypeScript:

1. Verifica que todas las referencias a los tipos sean correctas
2. Ejecuta `npm run type-check` para ver todos los errores
3. Actualiza las importaciones según sea necesario

### Errores de WebSocket

Si los WebSockets no funcionan correctamente:

1. Verifica que el servidor de WebSocket esté en ejecución
2. Asegúrate de que los puertos no estén bloqueados
3. Revisa la consola del navegador para ver errores específicos

### Errores de autenticación

Si tienes problemas con la autenticación:

1. Verifica que el servicio de autenticación esté en ejecución
2. Comprueba que las variables de entorno relacionadas con JWT estén configuradas correctamente

## Contribuir

1. Crear una rama para tu característica: `git checkout -b feature/[backend/frontend]_nombre_caracteristica`
2. Realizar cambios y commits: `git commit -am 'Añadir nueva característica'`
3. Subir a tu rama: `git push origin feature/[backend/frontend]_nombre_caracteristica`
4. Crear un Pull Request

### Convenciones de código

- Usar TypeScript para todo el código
- Seguir el estilo definido en ESLint y Prettier
- Documentar funciones y componentes con JSDoc
- Escribir pruebas para todas las características nuevas

## Licencia

Este proyecto está licenciado bajo la licencia ISC - ver el archivo LICENSE para más detalles.

## Instrucciones de instalación actualizadas (Node.js 22.14.0 LTS)

Se ha actualizado el proyecto para ser compatible con Node.js 22.14.0 LTS. Sigue estos pasos para configurar tu entorno:

### Requisitos

- Node.js 22.14.0 LTS o superior
- npm 10.x o superior (viene con Node.js 22)

### Instalación limpia

1. Verifica tu entorno:
   ```
   npm run verificar:entorno
   ```

2. Instala todas las dependencias con un solo comando:
   ```
   npm run install:clean
   ```

### Desarrollo

- Frontend web: `npm run dev:web`
- Frontend móvil: `npm run dev:mobile`
- Backend: `npm run dev:backend`
- Todo junto: `npm run dev`

### Notas importantes

- Se ha actualizado Expo a la versión SDK 52, que es compatible con React Native 0.73.2
- Se ha optimizado la configuración de npm para evitar conflictos de dependencias
- Para el desarrollo móvil, usar los comandos `npx expo` en lugar de `expo`
