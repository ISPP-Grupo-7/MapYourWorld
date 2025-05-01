// Mock para el servicio de Puntos de Interés basado en el backend real

export enum Category {
  MONUMENTOS = 'MONUMENTOS',
  ESTACIONES = 'ESTACIONES',
  MERCADOS = 'MERCADOS',
  PLAZAS = 'PLAZAS',
  OTROS = 'OTROS'
}

export interface Point {
  type: 'Point';
  coordinates: [number, number]; // [longitud, latitud]
}

export interface POI {
  id: string;
  name: string;
  description: string | null;
  location: Point;
  category: Category;
  images: string | null;
  createdAt: Date;
  userId: string;
  districtId: string | null;
}

// Datos de ejemplo para simular la base de datos
const poiDatabase: POI[] = [
  {
    id: '1',
    name: 'Torre del Oro',
    description: 'Torre dodecagonal del siglo XIII en Sevilla',
    location: {
      type: 'Point',
      coordinates: [-5.9962, 37.3825]
    },
    category: Category.MONUMENTOS,
    images: null,
    createdAt: new Date('2023-03-01T10:00:00Z'),
    userId: 'user1',
    districtId: 'district1'
  },
  {
    id: '2',
    name: 'Plaza de España',
    description: 'Monumental plaza construida para la Exposición Iberoamericana de 1929',
    location: {
      type: 'Point',
      coordinates: [-5.9875, 37.3774]
    },
    category: Category.PLAZAS,
    images: null,
    createdAt: new Date('2023-03-02T15:30:00Z'),
    userId: 'user1',
    districtId: 'district1'
  }
];

/**
 * Obtiene todos los puntos de interés
 */
export const getPOIs = async (): Promise<POI[]> => {
  // Simular retardo de red
  await new Promise(resolve => setTimeout(resolve, 300));
  return [...poiDatabase];
};

/**
 * Crea un nuevo punto de interés
 */
export const createPOI = async (poiData: Omit<POI, 'id' | 'createdAt'>, userId: string): Promise<POI> => {
  // Validar datos básicos
  if (!poiData.name || !poiData.location || !poiData.category) {
    throw new Error('Nombre, ubicación y categoría son campos obligatorios');
  }
  
  // Verificar coordenadas
  const location = poiData.location;
  if (!location.type || location.type !== 'Point' || !location.coordinates || location.coordinates.length !== 2) {
    throw new Error('Las coordenadas de ubicación son inválidas');
  }
  
  // Verificar duplicados
  const [longitude, latitude] = location.coordinates;
  const existingPOI = poiDatabase.find(
    poi => poi.name === poiData.name && 
    poi.location.coordinates[0] === longitude && 
    poi.location.coordinates[1] === latitude
  );
  
  if (existingPOI) {
    throw new Error('Ya existe un punto de interés similar en esta ubicación');
  }
  
  // Crear nuevo POI
  const newPOI: POI = {
    ...poiData,
    id: Math.random().toString(36).substring(2, 11),
    createdAt: new Date(),
    userId
  };
  
  // Añadir a la "base de datos"
  poiDatabase.push(newPOI);
  
  // Simular retardo de red
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return newPOI;
};

/**
 * Obtiene un punto de interés por su ID
 */
export const getPOIById = async (poiId: string): Promise<POI | null> => {
  // Simular retardo de red
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const poi = poiDatabase.find(p => p.id === poiId);
  return poi || null;
};

/**
 * Actualiza un punto de interés existente
 */
export const updatePOI = async (
  poiId: string,
  updateData: Partial<Omit<POI, 'id' | 'createdAt' | 'userId'>>,
  userId: string
): Promise<POI | null> => {
  // Buscar el POI
  const poiIndex = poiDatabase.findIndex(p => p.id === poiId);
  if (poiIndex === -1) {
    return null;
  }
  
  const poi = poiDatabase[poiIndex];
  
  // Verificar permisos
  if (poi.userId !== userId) {
    throw new Error('No tienes permisos para actualizar este punto de interés');
  }
  
  // Actualizar datos
  const updatedPoi = {
    ...poi,
    ...updateData
  };
  
  // Guardar en la "base de datos"
  poiDatabase[poiIndex] = updatedPoi;
  
  // Simular retardo de red
  await new Promise(resolve => setTimeout(resolve, 400));
  
  return updatedPoi;
};

/**
 * Elimina un punto de interés
 */
export const deletePOI = async (poiId: string, userId: string): Promise<boolean> => {
  // Buscar el POI
  const poiIndex = poiDatabase.findIndex(p => p.id === poiId);
  if (poiIndex === -1) {
    return false;
  }
  
  const poi = poiDatabase[poiIndex];
  
  // Verificar permisos
  if (poi.userId !== userId) {
    throw new Error('No tienes permisos para eliminar este punto de interés');
  }
  
  // Eliminar de la "base de datos"
  poiDatabase.splice(poiIndex, 1);
  
  // Simular retardo de red
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return true;
};

/**
 * Busca puntos de interés cercanos a una ubicación
 */
export const findNearbyPOIs = async (
  latitude: number,
  longitude: number,
  radiusInKm: number,
  filters?: {
    category?: Category;
  }
): Promise<POI[]> => {
  // Simular retardo de red
  await new Promise(resolve => setTimeout(resolve, 400));
  
  // Función para calcular distancia en km entre dos puntos (fórmula de Haversine)
  const getDistanceInKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };
  
  // Filtrar por distancia y categoría
  const nearbyPOIs = poiDatabase.filter(poi => {
    const [poiLon, poiLat] = poi.location.coordinates;
    const distance = getDistanceInKm(latitude, longitude, poiLat, poiLon);
    
    if (distance > radiusInKm) {
      return false;
    }
    
    if (filters?.category && poi.category !== filters.category) {
      return false;
    }
    
    return true;
  });
  
  return nearbyPOIs;
}; 