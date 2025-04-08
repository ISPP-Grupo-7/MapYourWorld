/**
 * Servicio de Distritos
 * Gestiona la creación, consulta y desbloqueo de distritos del mapa
 */

import { District } from '../models/district.model';
import { AppDataSource } from '../../../database/appDataSource';
import DistrictRepository from '../repositories/district.repository';
import MapRepository from '../repositories/map.repository';
import * as fs from 'fs';
import { UserDistrict } from '../models/user-district.model';
import RegionRepository from '../repositories/region.repository';

const filePath = 'database/map.geojson';
const rawData = fs.readFileSync(filePath, 'utf-8');
const geojsonData = JSON.parse(rawData);

const repo = new DistrictRepository();
const mapRepo = new MapRepository();
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
// district.service.ts - función updateDistrict
export const updateDistrict = async (
  districtId: string,
  updateData: Partial<Omit<District, 'id'>>
): Promise<District | null> => {
  try {
    // Validación de datos esenciales
    if (!districtId || !updateData.name || !updateData.boundaries || !updateData.description || updateData.isUnlocked === undefined) {
      throw new Error("No pueden faltar algunos datos importantes como el nombre o coordenadas.");
    }
    
    // Si se modifican los límites, verificar que no hay solapamiento
    if (updateData.boundaries) {
      const districtRepository = AppDataSource.getRepository(District);
      if (typeof districtRepository.createQueryBuilder === 'function') {
        const qb = districtRepository.createQueryBuilder("district");
        // Verificamos que el objeto retornado tenga el método `where`
        if (qb && typeof qb.where === 'function' && typeof qb.andWhere === 'function' && typeof qb.getOne === 'function') {
          const overlappingDistrict = await qb
            .where(
              "ST_Intersects(district.boundaries, ST_GeomFromGeoJSON(:geojson)) = true",
              { geojson: JSON.stringify(updateData.boundaries) }
            )
            .andWhere("district.id != :districtId", { districtId })
            .getOne();
    
          if (overlappingDistrict) {
            throw new Error("Las coordenadas introducidas se solapan con otro distrito ya existente.");
          }
        } else {
          console.warn("QueryBuilder no cuenta con los métodos esperados. Se omite la validación de solapamiento.");
        }
      }
    }
    
    // Se actualiza el distrito utilizando el método del repositorio (implementado en tu repository)
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

export const getUnlockedDistricts = async (): Promise<District[]> => {
  // TODO: Implementar la obtención de distritos desbloqueados por un usuario
  // 1. Consultar los registros de desbloqueo del usuario
  const districts = await repo.getDistrictsUnlocked();
  return districts;

};

/**
 * Obtiene los distritos asociados a un mapa específico
 * @param mapId ID del mapa
 */
export const getDistrictsByMapId = async (mapId: string): Promise<District[]> => {
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

    // Realizamos la consulta con relaciones y nos aseguramos de que no haya distritos nulos
    const userDistricts = await repo.getUserDistrictsByUserId(userId);


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