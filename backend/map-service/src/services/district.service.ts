/**
 * Servicio de Distritos
 * Gestiona la creación, consulta y desbloqueo de distritos del mapa
 */

//import { publishEvent } from '@shared/libs/rabbitmq';
import db from '../../../database/db';
import { District } from '../models/district.model';
import { AppDataSource } from '../../../database/appDataSource';
import DistrictRepository from '../repositories/district.repository';
import MapRepository from '../repositories/map.repository';
import * as fs from 'fs';
import { Geometry } from 'geojson';
import AuthRepository  from '../../../auth-service/src/repositories/auth.repository';
import { UserDistrict } from '../models/user-district.model';
import RegionRepository from '../repositories/region.repository';

const filePath = 'database/map.geojson';
const rawData = fs.readFileSync(filePath, 'utf-8');
const geojsonData = JSON.parse(rawData);

const repo = new DistrictRepository();
const mapRepo = new MapRepository();
const userRepo = new AuthRepository();
const regionRepo = new RegionRepository();


export const createDistricts = async (
  mapaId: string
): Promise<void> => {
  try {
    const districtsPerRegion = 5;
    const totalDistricts = geojsonData.features.length;
    const numberOfRegions = Math.ceil(totalDistricts / districtsPerRegion);

    const map = await mapRepo.getMapById(mapaId);

    if (!map) {
      throw new Error('Mapa no encontrado.');
    }


    for (let i = 0; i < numberOfRegions; i++) {
      const regionName = geojsonData.region_name;
      const regionData = {
        name: regionName,
        description: `Región generada para ${regionName}`,
        map_assignee: map
      };

      // Crea la región y obtén el objeto que la representa
      const region = await regionRepo.createRegion(regionData, mapaId);

      if (!region) {
        throw new Error('Región no creada correctamente.');
      }

      // Selecciona el grupo de distritos para esta región
      const start = i * districtsPerRegion;
      const end = start + districtsPerRegion;
      const districtGroup = geojsonData.features.slice(start, end);

      for (const [index, feature] of districtGroup.entries()) {
        const districtData = {
          name: `Distrito ${start + index + 1} de ${regionName}`,
          description: `Descripción para Distrito ${start + index + 1}`,
          boundaries: {
            type: feature.geometry.type,
            coordinates: feature.geometry.coordinates
          },
          isUnlocked: false,
          region_assignee: region, // Asigna la región creada
          userDistrict: []
        };

        // Crea el distrito con la información anterior
        await repo.createDistrict(districtData);
      }
    }
  } catch (error) {
    console.error("Error al crear distritos y regiones:", error);
    throw error;
  }
};





/**
 * Obtiene un distrito por su ID
 * @param districtId ID del distrito a obtener
 */
export const getDistrictById = async (districtId: string): Promise<District | null> => {
  // TODO: Implementar la obtención de un distrito por ID
  // 1. Buscar el distrito en la base de datos
  const district = await repo.getDistrictById(districtId);


  // 2. Retornar null si no se encuentra
  if (district === null) {
    throw new Error(`Distrito con ID ${districtId} no encontrado`);
  }
  else {
    return district;
  }

};

/**
 * Obtiene todos los distritos
 * @param includeInactive Indica si se deben incluir distritos inactivos
 */
export const getAllDistricts = async (): Promise<District[]> => {
  // TODO: Implementar la obtención de todos los distritos
  // 1. Consultar todos los distritos en la base de datos
  const districts = await repo.getDistricts();
  return districts;
};

/**
 * Actualiza un distrito existente
 * @param districtId ID del distrito a actualizar
 * @param updateData Datos a actualizar del distrito
 * @param userId ID del usuario administrador que realiza la actualización
 */
export const updateDistrict = async (
  districtId: string,
  updateData: Partial<Omit<District, 'id'>>
  // userId: string
): Promise<District | null> => {
  // TODO: Implementar la actualización de un distrito
  try {

    // 3. Validar los datos de actualización
    if (!updateData.name || !updateData.boundaries || !updateData.description || updateData.isUnlocked === undefined) {
      throw new Error("No pueden faltar algunos datos importantes como el nombre o coordenadas.");
    }

    // 4. Si se modifican los límites, verificar que no hay solapamiento
    if (updateData.boundaries) {
      const existingDistrict = await AppDataSource.query(`
      SELECT 1 
      FROM district 
      WHERE ST_Intersects(boundaries, ST_GeomFromGeoJSON($1))
    `, [JSON.stringify(updateData.boundaries)]);
      if (existingDistrict.length > 0) {
        throw new Error("Las coordenadas introducidas se solapan con otro distrito ya existente.");
      }
    }

    // 5. Actualizar el distrito en la base de datos
    const savedDistrict = await repo.updateDistrict(districtId, updateData);

    return savedDistrict;

  } catch (error) {
    console.error("Error al actualizar el distrito:", error);
    throw error;
  }

};

/**
 * Desbloquea un distrito para un usuario
 * @param districtId ID del distrito a desbloquear
 * @param userId ID del usuario
 */
export const unlockDistrict = async (
  districtId: string,
  userId: string,
  regionId: string,
  color: string
): Promise<{
  success: boolean;
  message?: string;
}> => {
  // TODO: Implementar el desbloqueo de un distrito
  // 1. Verificar si el usuario puede desbloquear el distrito
  const unlockedDistrict = await repo.unlockDistrict(districtId, userId, regionId, color);
  // 3. Publicar evento de distrito desbloqueado
  if (unlockedDistrict.isUnlocked === true) {
    return { success: true, message: 'Distrito desbloqueado correctamente' };
  } else {
    throw new Error('Error al desbloquear el distrito');
  }

};
/**
 * Obtiene los distritos desbloqueados por un usuario
 * @param userId ID del usuario
 */
export const getUserUnlockedDistricts = async (userId: string): Promise<District[]> => {
  // TODO: Implementar la obtención de distritos desbloqueados por un usuario
  // 1. Consultar los registros de desbloqueo del usuario
  const districts = await repo.getDistrictsUnlocked(userId);
  return districts;

};



export const getDistrictsByMapId = async (mapId: string): Promise<any[]> => {
  try {
    console.log(`Buscando distritos para el mapa ${mapId}`);
    const districts = await repo.getDistrictsByMapId(mapId);
    console.log(`Se encontraron ${districts.length} distritos para el mapa ${mapId}`);
    return districts;
  } catch (error) {
    console.error(`Error al obtener distritos para el mapa ${mapId}:`, error);
    throw new Error(`Error al obtener distritos para el mapa ${mapId}`);
  }
};



/**
 * Obtiene los distritos desbloqueados por un usuario con sus colores asignados
 * @param userId ID del usuario
 */
export const getUserDistrictsWithColors = async (userId: string): Promise<UserDistrict[]> => {
  try {
    console.log(`Buscando distritos con colores para el usuario ${userId}`);

    // Realizamos la consulta con relaciones y nos aseguramos de que no haya distritos nulos
    const userDistricts = await repo.getUserDistrictsByUserId(userId);
    console.log(`Se encontraron ${userDistricts.length} distritos para el usuario ${userId}`);

    // Filtramos los que puedan tener distrito nulo
    const validUserDistricts = userDistricts.filter(ud => ud.district !== null);

    if (validUserDistricts.length < userDistricts.length) {
      console.log(`Se filtraron ${userDistricts.length - validUserDistricts.length} distritos nulos`);
    }

    return validUserDistricts;
  } catch (error) {
    console.error(`Error al obtener distritos con colores:`, error);
    throw new Error(`No se pudieron obtener los distritos con colores: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}; 