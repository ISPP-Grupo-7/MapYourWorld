// Este es un archivo de servicio para mapas colaborativos creado para hacer que los tests funcionen

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Member {
  userId: string;
  color: string;
  user?: User; // Para incluir datos del usuario
}

export interface CollaborativePOI {
  id: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  category: string;
  createdBy: string;
  createdAt: Date;
}

export interface CollaborativeMap {
  id: string;
  name: string;
  description: string | null;
  is_collaborative: boolean;
  pois: CollaborativePOI[];
  members: Member[];
  createdBy: string;
  createdAt: Date;
}

// Datos de ejemplo para simular la base de datos
const mapDatabase: CollaborativeMap[] = [
  {
    id: 'map1',
    name: 'Mapa Turístico de Sevilla',
    description: 'Lugares emblemáticos para visitar en Sevilla',
    is_collaborative: true,
    createdAt: new Date('2023-02-15T09:00:00Z'),
    createdBy: 'user1',
    members: [
      { userId: 'user1', color: '#FF0000' },
      { userId: 'user2', color: '#00FF00' }
    ],
    pois: [
      {
        id: 'poi1',
        name: 'Catedral de Sevilla',
        description: 'La Catedral de Santa María de la Sede',
        latitude: 37.3857,
        longitude: -5.9938,
        category: 'MONUMENTOS',
        createdBy: 'user1',
        createdAt: new Date('2023-02-16T10:30:00Z')
      },
      {
        id: 'poi2',
        name: 'Real Alcázar',
        description: 'Palacio real construido por los reyes castellanos',
        latitude: 37.3831,
        longitude: -5.9902,
        category: 'MONUMENTOS',
        createdBy: 'user2',
        createdAt: new Date('2023-02-17T14:15:00Z')
      }
    ]
  },
  {
    id: 'map2',
    name: 'Tapas en Triana',
    description: 'Ruta de tapas por el barrio de Triana',
    is_collaborative: true,
    createdAt: new Date('2023-03-05T18:30:00Z'),
    createdBy: 'user2',
    members: [
      { userId: 'user2', color: '#0000FF' },
      { userId: 'user3', color: '#FFFF00' }
    ],
    pois: [
      {
        id: 'poi3',
        name: 'Bar El Rejoneo',
        description: 'Tapas tradicionales sevillanas',
        latitude: 37.3833,
        longitude: -6.0017,
        category: 'OTROS',
        createdBy: 'user2',
        createdAt: new Date('2023-03-06T13:00:00Z')
      }
    ]
  }
];

// Datos de ejemplo de usuarios para relacionar con mapas
const userDatabase: User[] = [
  { id: 'user1', name: 'Ana López', email: 'ana@example.com' },
  { id: 'user2', name: 'Pedro Martínez', email: 'pedro@example.com' },
  { id: 'user3', name: 'Carmen Rodríguez', email: 'carmen@example.com' }
];

/**
 * Obtiene todos los mapas colaborativos
 */
export const getCollaborativeMaps = async (): Promise<CollaborativeMap[]> => {
  // Simular retardo de red
  await new Promise(resolve => setTimeout(resolve, 300));
  return [...mapDatabase];
};

/**
 * Obtiene un mapa colaborativo por su ID
 */
export const getCollaborativeMapById = async (id: string): Promise<CollaborativeMap | null> => {
  // Simular retardo de red
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const map = mapDatabase.find(m => m.id === id);
  return map || null;
};

/**
 * Crea un nuevo mapa colaborativo
 */
export const createCollaborativeMap = async (
  mapData: Omit<CollaborativeMap, 'id' | 'createdAt' | 'members' | 'pois'>,
  userId: string
): Promise<CollaborativeMap> => {
  // Validar datos básicos
  if (!mapData.name) {
    throw new Error('El nombre es un campo obligatorio');
  }
  
  // Crear nuevo mapa
  const newMap: CollaborativeMap = {
    ...mapData,
    id: Math.random().toString(36).substring(2, 11),
    createdAt: new Date(),
    is_collaborative: true,
    createdBy: userId,
    members: [{ userId, color: '#FF0000' }], // El creador es el primer miembro
    pois: []
  };
  
  // Añadir a la "base de datos"
  mapDatabase.push(newMap);
  
  // Simular retardo de red
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return newMap;
};

/**
 * Obtiene los mapas colaborativos en los que participa un usuario
 */
export const getCollaborativeMapsForUser = async (userId: string): Promise<CollaborativeMap[]> => {
  // Simular retardo de red
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Filtrar mapas donde el usuario es miembro
  const userMaps = mapDatabase.filter(map => 
    map.members.some(member => member.userId === userId)
  );
  
  return userMaps;
};

/**
 * Añade un usuario a un mapa colaborativo
 */
export const joinCollaborativeMap = async (mapId: string, userId: string): Promise<boolean> => {
  // Buscar el mapa
  const mapIndex = mapDatabase.findIndex(m => m.id === mapId);
  if (mapIndex === -1) {
    return false;
  }
  
  const map = mapDatabase[mapIndex];
  
  // Verificar si el usuario ya es miembro
  if (map.members.some(member => member.userId === userId)) {
    return true; // Ya es miembro
  }
  
  // Asignar un color aleatorio al nuevo miembro
  const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
  const usedColors = map.members.map(member => member.color);
  const availableColors = colors.filter(color => !usedColors.includes(color));
  const color = availableColors.length > 0 
    ? availableColors[0] 
    : `#${Math.floor(Math.random()*16777215).toString(16)}`;
  
  // Añadir al usuario como miembro
  map.members.push({ userId, color });
  
  // Actualizar en la "base de datos"
  mapDatabase[mapIndex] = map;
  
  // Simular retardo de red
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return true;
};

/**
 * Elimina un usuario de un mapa colaborativo
 */
export const leaveCollaborativeMap = async (mapId: string, userId: string): Promise<boolean> => {
  // Buscar el mapa
  const mapIndex = mapDatabase.findIndex(m => m.id === mapId);
  if (mapIndex === -1) {
    return false;
  }
  
  const map = mapDatabase[mapIndex];
  
  // Verificar si el usuario es miembro
  const memberIndex = map.members.findIndex(member => member.userId === userId);
  if (memberIndex === -1) {
    return false; // No es miembro
  }
  
  // Si es el creador, no puede abandonar el mapa
  if (map.createdBy === userId) {
    throw new Error('El creador no puede abandonar el mapa');
  }
  
  // Eliminar al usuario como miembro
  map.members.splice(memberIndex, 1);
  
  // Actualizar en la "base de datos"
  mapDatabase[mapIndex] = map;
  
  // Simular retardo de red
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return true;
};

/**
 * Elimina un mapa colaborativo
 */
export const deleteCollaborativeMap = async (mapId: string, userId: string): Promise<boolean> => {
  // Buscar el mapa
  const mapIndex = mapDatabase.findIndex(m => m.id === mapId);
  if (mapIndex === -1) {
    return false;
  }
  
  const map = mapDatabase[mapIndex];
  
  // Verificar permisos
  if (map.createdBy !== userId) {
    throw new Error('Solo el creador puede eliminar el mapa');
  }
  
  // Eliminar de la "base de datos"
  mapDatabase.splice(mapIndex, 1);
  
  // Simular retardo de red
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return true;
};

/**
 * Añade un POI a un mapa colaborativo
 */
export const addPOIToCollaborativeMap = async (
  mapId: string, 
  poi: Omit<CollaborativePOI, 'id' | 'createdAt'>,
  userId: string
): Promise<boolean> => {
  // Buscar el mapa
  const mapIndex = mapDatabase.findIndex(m => m.id === mapId);
  if (mapIndex === -1) {
    return false;
  }
  
  const map = mapDatabase[mapIndex];
  
  // Verificar si el usuario es miembro
  if (!map.members.some(member => member.userId === userId)) {
    throw new Error('Solo los miembros pueden añadir POIs al mapa');
  }
  
  // Crear nuevo POI
  const newPOI: CollaborativePOI = {
    ...poi,
    id: Math.random().toString(36).substring(2, 11),
    createdAt: new Date(),
    createdBy: userId
  };
  
  // Añadir POI al mapa
  map.pois.push(newPOI);
  
  // Actualizar en la "base de datos"
  mapDatabase[mapIndex] = map;
  
  // Simular retardo de red
  await new Promise(resolve => setTimeout(resolve, 400));
  
  return true;
};

/**
 * Actualiza un POI en un mapa colaborativo
 */
export const updatePOIInCollaborativeMap = async (
  mapId: string,
  poiId: string,
  poiData: Partial<Omit<CollaborativePOI, 'id' | 'createdAt' | 'createdBy'>>,
  userId: string
): Promise<boolean> => {
  // Buscar el mapa
  const mapIndex = mapDatabase.findIndex(m => m.id === mapId);
  if (mapIndex === -1) {
    return false;
  }
  
  const map = mapDatabase[mapIndex];
  
  // Buscar el POI
  const poiIndex = map.pois.findIndex(p => p.id === poiId);
  if (poiIndex === -1) {
    return false;
  }
  
  const poi = map.pois[poiIndex];
  
  // Verificar permisos
  if (poi.createdBy !== userId) {
    throw new Error('Solo el creador del POI puede actualizarlo');
  }
  
  // Actualizar POI
  map.pois[poiIndex] = {
    ...poi,
    ...poiData
  };
  
  // Actualizar en la "base de datos"
  mapDatabase[mapIndex] = map;
  
  // Simular retardo de red
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return true;
};

/**
 * Elimina un POI de un mapa colaborativo
 */
export const deletePOIFromCollaborativeMap = async (
  mapId: string,
  poiId: string,
  userId: string
): Promise<boolean> => {
  // Buscar el mapa
  const mapIndex = mapDatabase.findIndex(m => m.id === mapId);
  if (mapIndex === -1) {
    return false;
  }
  
  const map = mapDatabase[mapIndex];
  
  // Buscar el POI
  const poiIndex = map.pois.findIndex(p => p.id === poiId);
  if (poiIndex === -1) {
    return false;
  }
  
  const poi = map.pois[poiIndex];
  
  // Verificar permisos
  if (poi.createdBy !== userId && map.createdBy !== userId) {
    throw new Error('Solo el creador del POI o del mapa puede eliminarlo');
  }
  
  // Eliminar POI
  map.pois.splice(poiIndex, 1);
  
  // Actualizar en la "base de datos"
  mapDatabase[mapIndex] = map;
  
  // Simular retardo de red
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return true;
};

/**
 * Obtiene los miembros de un mapa colaborativo con datos completos
 */
export const getMapMembers = async (mapId: string): Promise<(Member & { user: User })[]> => {
  // Buscar el mapa
  const map = mapDatabase.find(m => m.id === mapId);
  if (!map) {
    throw new Error(`Mapa con ID ${mapId} no encontrado`);
  }
  
  // Obtener datos completos de los miembros
  const membersWithData = map.members.map(member => {
    const user = userDatabase.find(u => u.id === member.userId);
    return {
      ...member,
      user: user || { id: member.userId, name: 'Usuario desconocido', email: '' }
    };
  });
  
  // Simular retardo de red
  await new Promise(resolve => setTimeout(resolve, 200));
  
  return membersWithData;
}; 