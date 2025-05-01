# Documentación: Sistema de Colores en Mapa Colaborativo

## Visión General

El mapa colaborativo de MapYourWorld permite a varios usuarios (hasta 6) explorar y descubrir distritos en un mapa compartido. Cada usuario tiene asignado un color único, y cuando visita un distrito por primera vez, ese distrito queda "marcado" o "coloreado" con su color, estableciendo que fue ese usuario quien lo descubrió primero.

## Características Principales

- Cada usuario tiene un color único asignado
- Los distritos son coloreados según el primer usuario que los visita
- Un distrito ya coloreado no puede ser "reclamado" por otro usuario
- La información de colores persiste entre sesiones
- Interfaz visual con leyenda para identificar qué usuario descubrió cada distrito

## Archivos Principales

### 1. CollaborativeMapScreen.tsx
**Ruta**: `frontend/mobile/src/components/Map/CollaborativeMapScreen.tsx`

Este es el componente principal que maneja toda la lógica del mapa colaborativo, incluyendo:
- Definición de la paleta de colores
- Asignación de colores a usuarios
- Detección de ubicación del usuario
- Desbloqueo de distritos
- Renderizado de polígonos con colores específicos

### 2. MapService (Backend)
**Ruta**: `backend/map-service/src/services/map.service.ts`

Este servicio gestiona:
- Almacenamiento de información de mapas colaborativos
- Asociación entre usuarios y mapas

### 3. District Controller (Backend)
**Ruta**: `backend/map-service/src/controllers/district.controller.ts`

Este controlador maneja:
- Endpoint para desbloquear distritos en modo colaborativo
- Persistencia de información sobre qué usuario desbloqueó cada distrito

## Implementación en Detalle

### Definición de Colores
```typescript
// En CollaborativeMapScreen.tsx
const USER_COLORS = [
  "rgba(76, 175, 80, 0.5)",  // Verde
  "rgba(255, 152, 0, 0.5)",  // Naranja
  "rgba(255, 235, 59, 0.5)", // Amarillo
  "rgba(33, 150, 243, 0.5)", // Azul
  "rgba(156, 39, 176, 0.5)", // Púrpura
  "rgba(244, 67, 54, 0.5)"   // Rojo
];
```

### Asignación de Colores a Usuarios
Cuando se carga el mapa colaborativo, se asigna un color a cada usuario:

```typescript
// En fetchMapUsers() de CollaborativeMapScreen.tsx
const usersWithColors = data.users.map((user: { id: string; username: string }, index: number) => ({
  id: user.id,
  username: user.username || `Usuario ${index + 1}`,
  colorIndex: index % USER_COLORS.length
}));
```

### Desbloqueo de Distritos
Cuando un usuario entra en un distrito no descubierto, se marca como desbloqueado y se asigna su color:

```typescript
// En desbloquearDistrito() de CollaborativeMapScreen.tsx
setDistritosBackend((prev) =>
  prev.map((d) => 
    d.id === districtId 
      ? { 
          ...d, 
          isUnlocked: true, 
          unlockedByUserId: userId,
          colorIndex: userColorIndex 
        } 
      : d
  )
);
```

### Renderizado de Distritos Coloreados
Los distritos se renderizan con el color del usuario que los desbloqueó:

```typescript
// En el return de CollaborativeMapScreen.tsx
<Polygon
  key={index}
  coordinates={distrito.coordenadas}
  strokeColor={"#808080"}
  fillColor={
    distrito.isUnlocked && distrito.colorIndex !== undefined
      ? USER_COLORS[distrito.colorIndex]
      : "rgba(128, 128, 128, 0.7)"
  }
  strokeWidth={2}
/>
```

### Persistencia en el Backend
Cuando un usuario desbloquea un distrito, se envía una petición al backend:

```typescript
// En desbloquearDistrito() de CollaborativeMapScreen.tsx
const response = await fetch(`${API_URL}/api/districts/unlock/collaborative/${districtId}/${userId}/${mapId}`, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
});
```

El backend almacena esta información para mantener la persistencia incluso cuando los usuarios cierran la aplicación.

### Leyenda de Usuarios
Se muestra una leyenda en el mapa para identificar qué color corresponde a cada usuario:

```typescript
// En renderUserColorLegend() de CollaborativeMapScreen.tsx
<View style={styles.legendContainer}>
  <Text style={styles.legendTitle}>Usuarios</Text>
  <ScrollView style={{ maxHeight: 150 }}>
    {mapUsers.map((user, index) => (
      <View key={index} style={styles.legendItem}>
        <View 
          style={[
            styles.colorSquare, 
            { backgroundColor: USER_COLORS[user.colorIndex] }
          ]} 
        />
        <Text style={styles.legendText}>
          {user.username} {user.id === userId ? "(Tú)" : ""}
        </Text>
      </View>
    ))}
  </ScrollView>
</View>
```

## Flujo de Funcionamiento

1. Se asigna un color único a cada usuario del mapa colaborativo
2. Cuando un usuario visita un distrito por primera vez, ese distrito se marca con su color
3. La información se guarda en el backend para mantener la persistencia
4. Cuando otro usuario se une al mapa, ve los distritos ya coloreados por los usuarios anteriores
5. Un usuario no puede "reclamar" un distrito ya descubierto por otro

## Limitaciones

- Máximo 6 usuarios por mapa colaborativo (limitado por la paleta de colores)
- Un distrito solo puede ser descubierto/coloreado por un único usuario
- Se requiere conexión a internet para sincronizar los datos entre usuarios

## Resumen

Los usuarios pueden ver claramente qué partes del mapa han sido descubiertas por cada jugador. La persistencia de los datos garantiza que los logros de cada usuario se mantengan entre sesiones, creando un mapa compartido donde queda registrada la contribución de cada participante. 