/**
 * Servicio de Puntos de Interés (POI)
 * Gestiona la creación, consulta, actualización y eliminación de puntos de interés
 */

import { AppDataSource } from '../../../database/appDataSource';
import { PointOfInterest } from '../models/poi.model';
import { Between, Repository, IsNull, Not } from 'typeorm';
import  PointOfInterestRepository  from '../repositories/poi.repostory';
import AuthRepository from '../../../auth-service/src/repositories/auth.repository';
import { Role } from '../../../auth-service/src/models/user.model';
import  SubscriptionRepository  from '../../../payment-service/repositories/subscription.repository';
// Initialize repository
const poiRepository = new PointOfInterestRepository();
const authRepository = new AuthRepository();
const subscriptionRepository = new SubscriptionRepository();
/**
 * Crea un nuevo punto de interés
 * @param poiData Datos del punto de interés a crear
 * @param userId ID del usuario que crea el punto de interés
 */
export const createPOI = async (
  poiData: Omit<PointOfInterest, 'id'>,
  userId: string
): Promise<PointOfInterest> => {
  // TODO: Implementar la creación de un punto de interés
  // 1. Validar los datos del punto de interés
  // 2. Verificar que las coordenadas sean válidas
  // 3. Comprobar si ya existe un POI similar en la ubicación
  // 4. Guardar el POI en la base de datos

  // 1. Validar los datos del punto de interés
  if (!poiData.name || !poiData.location || !poiData.category) {
    throw new Error('Nombre, ubicación y categoría son campos obligatorios');
  }
  
  const existingPOI =await poiRepository.getPoiByNameAndLocation(poiData)

  if (existingPOI) {
    throw new Error('Ya existe un punto de interés similar en esta ubicación');
  }
  
  const subscription = await subscriptionRepository.getActiveSubscriptionByUserId(userId);

  if (subscription?.plan === 'FREE') {
    const userPOIsInDistrict = await poiRepository.getPOIsByUserIdAndDistrict(userId, poiData.district.id);
    if (userPOIsInDistrict.length > 0) {
      throw new Error('El usuario ya tiene un punto de interés en este distrito, para crear más puntos de interés, actualiza tu plan al plan PREMIUM');
    }
  }
  return await poiRepository.createPoi(poiData, userId);
};



export const createPOIInAllMaps = async (
  poiData: Omit<PointOfInterest, 'id'>,
  userId: string
): Promise<void> => {
  const usuarioCreador = await authRepository.findById(userId);
  if (!usuarioCreador) {
    throw new Error('El usuario no existe');
  }

  if(usuarioCreador.role !== Role.ADMIN){
    throw new Error('No tienes permisos para crear puntos de interés en todos los mapas');
  }

  await poiRepository.createPoiInAllMaps(poiData);
};












/**
 * Obtiene un punto de interés por su ID
 * @param poiId ID del punto de interés a obtener
 */
export const getPOIById = async (poiId: string): Promise<PointOfInterest | null> => {
  // TODO: Implementar la obtención de un punto de interés por ID
  // 1. Buscar el POI en la base de datos
  // 2. Retornar null si no se encuentra
  
  // 1. Buscar el POI en la base de datos
  const poi = await poiRepository.getPoiById(poiId)
  // 2. Retornar null si no se encuentra
  if (!poi) {
    return null;
  }

  return poi;
};


export const getAllPOIs = async (): Promise<PointOfInterest[] | null> => {
  // TODO: Implementar la obtención de un punto de interés por ID
  // 1. Buscar el POI en la base de datos
  // 2. Retornar null si no se encuentra
  
  // 1. Buscar el POI en la base de datos
  const poi = await poiRepository.getAllPois()
  // 2. Retornar null si no se encuentra
  if (!poi) {
    return null;
  }

  return poi;
};


/**
 * Actualiza un punto de interés existente
 * @param poiId ID del punto de interés a actualizar
 * @param updateData Datos a actualizar del punto de interés
 * @param userId ID del usuario que realiza la actualización
 */
export const updatePOI = async (
  poiId: string,
  updateData: Partial<Omit<PointOfInterest, 'id'>>,
  userId: string
): Promise<PointOfInterest | null> => {
  // TODO: Implementar la actualización de un punto de interés
  // 1. Verificar que el POI existe
  // 2. Comprobar que el POI pertenece al User
  // 3. Validar los datos de actualización
  // 4. Actualizar el POI en la base de datos
  
  // 1. Verificar que el POI existe
  const existingPOI = await poiRepository.getPoiById(poiId)
  
  if (!existingPOI) {
    throw new Error(`Poi con id ${poiId} no ha sido encontrado`);
  }
  
  // 2. Comprobar que el POI pertenece al User
  if (existingPOI.user.id !== userId) {
    throw new Error('No tienes permisos para actualizar este punto de interés');
  }
  
  // 3. Validar los datos de actualización
  if (updateData.location) {
    const location = updateData.location;
    if (!location.type || 
        location.type !== 'Point' || 
        !location.coordinates || 
        location.coordinates.length !== 2) {
      throw new Error('Las coordenadas de ubicación son inválidas');
    }
  }
  
  return poiRepository.updatePoi(poiId, updateData)
};

/**
 * Elimina un punto de interés
 * @param poiId ID del punto de interés a eliminar
 * @param userId ID del usuario que solicita la eliminación
 */
export const deletePOI = async (poiId: string, userId: string): Promise<void> => {
  // TODO: Implementar la eliminación de un punto de interés
  // 1. Verificar que el POI existe
  // 2. Comprobar que el POI pertenece al User
  // 3. Marcar el POI como inactivo o eliminarlo de la base de datos
  
  // 1. Verificar que el POI existe
  const poi = await poiRepository.getPoiById(poiId)
  if (!poi) {
    throw new Error(`Poi con id ${poiId} no ha sido encontrado`);

  }
  
  // 2. Comprobar que el POI pertenece al User
  if (poi.user.id !== userId) {
    throw new Error('No tienes permisos para eliminar este punto de interés');
  }
  
  // 3. Eliminar el POI de la base de datos
  await poiRepository.deletePOI(poiId);

};

export const getPointsOfInterestByUserId = async (userId: string): Promise<PointOfInterest[]> => {
  const pois = await poiRepository.getPointsOfInterestByUserId(userId)
  return pois;
}

export const getPointsOfInterestByMapId = async (mapId:string): Promise<PointOfInterest[] | null> => {
  const pois = await poiRepository.getPointsOfInterestByMapId(mapId)
  if (!pois) {
    return null;
  }

  return pois;
};


export const getPointsBusinessAndUnique = async (): Promise<PointOfInterest[] | null> => {

  const pois = await poiRepository.getUniquePointsOfInterestBusiness();
  if (!pois) {
    return null;
  }

  return pois;


}

export const createPOIsOnLagMaps = async (mapId:string): Promise<void> => {
  const poisList = await poiRepository.getUniquePointsOfInterestBusiness();
  await poiRepository.createPOIsOnLagMaps(poisList, mapId);  
}


