/**
 * Servicio de mapas
 * Gestiona la creación, consulta y desbloqueo de mapas del mapa
 */

//import { publishEvent } from '@shared/libs/rabbitmq';
import db from '../../../database/db';
import { Map } from '../models/map.model';
import { AppDataSource } from '../../../database/appDataSource';
import MapRepository from '../repositories/map.repository';
import { User } from '../../../auth-service/src/models/user.model';
import UserDistrictRepository  from '../repositories/user-district.repository';
import AuthRepository  from '../../../auth-service/src/repositories/auth.repository';
import { UserDistrict } from '../models/user-district.model';
import { createDistricts } from '../../../map-service/src/services/district.service';


const repo = new MapRepository();
const userDistrictRepo = new UserDistrictRepository();
const userRepo = new AuthRepository();




/**
 * Crea un nuevo mapa
 * @param MapData Datos del mapa a crear
 */

export const createMap = async (
  userId: string
): Promise<Map> => {

  try {
    
    const user = await userRepo.findById(userId);

    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }

    
    const newMap = new Map();

    newMap.name = "Mapa personal";
    newMap.description = "Mapa para el usuario";
    newMap.createdAt = new Date();
    newMap.is_colaborative = false;

    newMap.user_created = user;


    const createdMap = await repo.createMap(newMap);

    console.log("mapa creado correctamente:", newMap);
    return createdMap;

  } catch (error) {
    throw error;
  }

};




export const createColaborativeMap = async (
  MapData: Omit<Map, 'id'>,
  userId: string,  
): Promise<Map> => {
  
  const mapa_colaborativo = await repo.createMapColaborativo(MapData, userId);

  await createDistricts(mapa_colaborativo.id);

  const creador = await userRepo.findById(userId)
  if (!creador){
    throw new Error(`No se encuentra un usuario con el id ${userId}`)
  }

  // Crear un objeto UserDistrict que cumpla con el modelo actualizado
  const userDistrictData = {
    color: "pepe",
    user: creador
    // No incluimos district ya que es obligatorio pero no lo tenemos aún
  }
  
  const userDistrict = await userDistrictRepo.createUserDistrict(userDistrictData as Omit<UserDistrict, 'id'>)

  return mapa_colaborativo
};



 

/**
 * Obtiene un mapa por su ID
 * @param MapId ID del mapa a obtener
 */
export const getMapById = async (MapId: string): Promise<Map | null> => {
  // TODO: Implementar la obtención de un mapa por ID
  // 1. Buscar el mapa en la base de datos
  const Map = await repo.getMapById(MapId);


  // 2. Retornar null si no se encuentra
  if (Map === null) {
    throw new Error(`mapa con ID ${MapId} no encontrado`);
  }
  else {
    return Map;
  }

};



export const getMapUsersById = async (MapId: string): Promise<User[]> => {
  // TODO: Implementar la obtención de un mapa por ID
  // 1. Buscar el mapa en la base de datos
  const users = await repo.getUsersOnMapById(MapId);
  // 2. Retornar null si no se encuentra
  if (users === null) {
    throw new Error(`mapa con ID ${MapId} sin usuarios asociados`);
  }
  else {
    return users;
  }
};

/**
 * Actualiza un mapa existente
 * @param MapId ID del mapa a actualizar
 * @param updateData Datos a actualizar del mapa
 */
export const updateMap = async (
  MapId: string,
  updateData: Partial<Omit<Map, 'id'>>
  // userId: string
): Promise<Map | null> => {
  // TODO: Implementar la actualización de un mapa
  try {

    // 3. Validar los datos de actualización
    if (!updateData.name || !updateData.description) {
      throw new Error("No pueden faltar algunos datos importantes como el nombre o coordenadas.");
    }

    // 4. Si se modifican los límites, verificar que no hay solapamiento
  

    // 5. Actualizar el mapa en la base de datos
    const savedMap = await repo.updateMap(MapId, updateData);

    return savedMap;

  } catch (error) {
    console.error("Error al actualizar el mapa:", error);
    throw error;
  }

};

/**
 * Elimina un mapa existente
 * @param MapId ID del mapa a eliminar
 */
export const deleteMap = async (MapId: string, userId: string): Promise<{ success: boolean; message?: string }> => {
  try {
    // 1. Verificar que el mapa existe
    const map = await repo.getMapById(MapId);
    if (!map) {
      return { success: false, message: `Mapa con ID ${MapId} no encontrado` };
    }

    // 2. Comprobar que el usuario tiene permisos para eliminar el mapa (opcional, según tu lógica de negocio)

    // 3. Eliminar el mapa de la base de datos
    await repo.deleteMap(MapId, userId);

    // 4. Publicar evento de mapa eliminado (opcional, según tu lógica de negocio)

    // 5. Retornar éxito
    return { success: true, message: 'Mapa eliminado correctamente' };
  } catch (error) {
    console.error("Error al eliminar el mapa:", error);
    return { success: false, message: 'Error al eliminar el mapa' };
  }
};

/**
 * Obtiene el mapa principal del usuario
 * @param userId ID del usuario
 */
export const getPrincipalMapForUser = async (userId: string): Promise<Map> => {
  try {
    // Buscar mapas donde el usuario participa (está en users_joined)
    const map = await repo.getPrincipalMapForUser(userId);
    
    if (!map ) {
      console.log(`No se encontro el mapa principal del usuario ${userId}`);
      throw new Error("No se encontro el mapa principal del usuario")
    }
    
    return map;
  } catch (error) {
    console.error(`Error al obtener el mapa principal para el usuario ${userId}:`, error);
    throw error;
  }
};

/**
 * Obtiene todos los mapas colaborativos en los que participa un usuario
 * @param userId ID del usuario
 */
export const getCollaborativeMapsForUser = async (userId: string): Promise<Map[]> => {
  try {
    // Buscar mapas donde el usuario participa (está en users_joined)
    const maps = await repo.getCollaborativeMapsForUser(userId);
    
    if (!maps || maps.length === 0) {
      console.log(`No se encontraron mapas colaborativos para el usuario ${userId}`);
      return [];
    }
    
    return maps;
  } catch (error) {
    console.error(`Error al obtener mapas colaborativos para el usuario ${userId}:`, error);
    throw error;
  }
};
