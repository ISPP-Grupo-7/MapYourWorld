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
import { AuthRepository } from '../../../auth-service/src/repositories/auth.repository';
import { Color, UserDistrict } from '../models/user-district.model';
import RegionRepository from '../repositories/region.repository';

const filePath = 'database/map.geojson';
const rawData = fs.readFileSync(filePath, 'utf-8');
const geojsonData = JSON.parse(rawData);

const repo = new DistrictRepository();
const mapRepo = new MapRepository();
const userRepo = new AuthRepository();
const regionRepo = new RegionRepository();


/**
 * Crea un nuevo distrito
 * @param districtData Datos del distrito a crear
 * @param userId ID del usuario administrador que crea el distrito
 */



// export const createDistrict = async (
//   userId?: string,
//   regionId?: string,

// ): Promise<void> => {
//   var user: any = null;
//   var region: any = null;
//   try {
//     if (userId && regionId) {
//       user = await userRepo.findById(userId);
//       region = await regionRepo.getRegionById(regionId)
//       if (!region || !user) {
//         throw new Error("No se encontró la región o el usuario");
//       }
//     }
//     const districtData = geojsonData.features.map((feature: any, index: number) => ({
//       name: `Distrito ${index + 1}`, // Asigna un nombre genérico si no hay "properties"
//       description: 'Descripción genérica del distrito.', // Se puede personalizar
//       boundaries: {
//         type: feature.geometry.type,
//         coordinates: feature.geometry.coordinates
//       } as Geometry,
//       isUnlocked: false,
//       user: user,
//       region_assignee: region
//     }));


//     for (const district of districtData) {
//       await repo.createDistrict(district);
//     }


//   } catch (error) {
//     console.log(error)
//   }
// };

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
      const regionName = `Región ${i + 1}`;
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
  regionId: string
): Promise<{
  success: boolean;
  message?: string;
}> => {
  // TODO: Implementar el desbloqueo de un distrito
  // 1. Verificar si el usuario puede desbloquear el distrito
  const unlockedDistrict = await repo.unlockDistrict(districtId, userId, regionId);
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
  const districts = await repo.getDistrictsUnlocked();
  return districts;

};

/**
 * Encuentra el distrito que contiene una ubicación geográfica
 * @param latitude Latitud de la ubicación
 * @param longitude Longitud de la ubicación
 */
export const findDistrictContainingLocation = async (
  latitude: number,
  longitude: number
): Promise<District | null> => {
  const situation = await repo.findDistrictContainingLocation(latitude, longitude);
  return situation;
};

/**
 * Obtiene los distritos asociados a un mapa específico
 * @param mapId ID del mapa
 */
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
 * Desbloquea un distrito en un mapa colaborativo para un usuario específico
 * @param districtId ID del distrito a desbloquear
 * @param userId ID del usuario que desbloquea el distrito
 * @param mapId ID del mapa colaborativo
 * @param regionId ID de la región donde pertenecen los distritos
 */
export const unlockCollaborativeDistrict = async (
  districtId: string,
  userId: string,
  mapId: string,
  regionId: string
): Promise<{ success: boolean; message: string; district?: any }> => {
  try {
    // 1. Verificar que el distrito existe y pertenece al mapa indicado
    const district = await repo.getDistrictById(districtId);
    if (!district) {
      return { success: false, message: `Distrito con ID ${districtId} no encontrado` };
    }

    // 2. Verificar que el distrito pertenece a la región indicada
    if (district.region_assignee?.id !== regionId) {
      return { success: false, message: `El distrito no pertenece al mapa indicado` };
    }

    // 3. Verificar si el distrito ya está desbloqueado
    if (district.isUnlocked) {
      return { success: false, message: `El distrito ya está desbloqueado por otro usuario` };
    }

    // 4. Verificar que el usuario existe
    const user = await userRepo.findById(userId);
    if (!user) {
      return { success: false, message: `Usuario con ID ${userId} no encontrado` };
    }

    // 5. Verificar que el usuario pertenece al mapa colaborativo
    const map = await mapRepo.getMapById(mapId);
    const userBelongsToMap = map.users_joined.some((u: any) => u.id === userId);
    if (!userBelongsToMap) {
      return { success: false, message: `El usuario no pertenece al mapa colaborativo` };
    }

    // 6. Desbloquear el distrito y asignar el usuario
    district.isUnlocked = true;

    // Crear un objeto UserDistrict que cumpla con el modelo actualizado
    const userdistrict = {
      color: Color.AZUL,
      user: user,
      district: district
    };

    // Guardar el UserDistrict y asociarlo al distrito
    const savedUserDistrict = await AppDataSource.getRepository(UserDistrict).save(userdistrict);

    await repo.updateDistrict(districtId, district);

    console.log(`Distrito ${districtId} desbloqueado por usuario ${userId} en mapa ${mapId}`);

    return {
      success: true,
      message: `Distrito desbloqueado correctamente por el usuario ${userId}`,
      district
    };
  } catch (error) {
    console.error(`Error al desbloquear distrito ${districtId} en mapa colaborativo:`, error);
    return { success: false, message: `Error al desbloquear distrito: ${error instanceof Error ? error.message : 'Error desconocido'}` };
  }
};

/**
 * Simula que un usuario ha pasado por un distrito y le asigna un color
 * @param userId ID del usuario
 * @param districtId ID del distrito por el que ha pasado
 * @param color Color a asignar al distrito para este usuario
 * @param mapId ID del mapa colaborativo (opcional)
 */
export const simulateUserPassingByDistrict = async (
  userId: string,
  districtId: string,
  color: Color = Color.AZUL, // Valor por defecto
  mapId?: string // Opcional: ID del mapa colaborativo
): Promise<{
  success: boolean;
  message: string;
  userDistrict?: UserDistrict;
}> => {
  try {
    console.log(`Simulando paso de usuario ${userId} por distrito ${districtId} con color ${color}`);

    // 1. Verificar que el distrito existe
    const district = await repo.getDistrictById(districtId);
    if (!district) {
      console.log(`Distrito con ID ${districtId} no encontrado`);
      return { success: false, message: `Distrito con ID ${districtId} no encontrado` };
    }

    // 2. Verificar que el usuario existe
    const user = await userRepo.findById(userId);
    if (!user) {
      console.log(`Usuario con ID ${userId} no encontrado`);
      return { success: false, message: `Usuario con ID ${userId} no encontrado` };
    }

    const userDistrictRepository = AppDataSource.getRepository(UserDistrict);

    // 3. Verificar si el distrito ya está coloreado por otro usuario
    const existingDistrictColor = await userDistrictRepository
      .createQueryBuilder("userDistrict")
      .leftJoinAndSelect("userDistrict.district", "district")
      .leftJoinAndSelect("userDistrict.user", "user")
      .where("district.id = :districtId", { districtId })
      .andWhere("user.id != :userId", { userId })
      .getOne();

    if (existingDistrictColor) {
      console.log(`El distrito ${districtId} ya está coloreado por otro usuario`);
      return {
        success: false,
        message: `El distrito ya está coloreado por otro usuario y no puede ser modificado`
      };
    }

    // 4. Verificar si el usuario ya tiene un color asignado en este mapa colaborativo
    if (mapId) {
      // Buscar si el usuario ya tiene color en algún distrito del mapa
      const existingUserColor = await userDistrictRepository
        .createQueryBuilder("userDistrict")
        .leftJoinAndSelect("userDistrict.district", "district")
        .leftJoinAndSelect("userDistrict.user", "user")
        .where("user.id = :userId", { userId })
        .andWhere("district.map.id = :mapId", { mapId })
        .getOne();

      if (existingUserColor && existingUserColor.color !== color) {
        console.log(`El usuario ${userId} ya tiene un color asignado (${existingUserColor.color}) en este mapa colaborativo`);
        // El usuario ya tiene un color, usamos ese color en lugar del nuevo
        color = existingUserColor.color;
        console.log(`Se usará el color existente: ${color}`);
      }
    }

    // 5. Desbloquear el distrito si no lo está
    if (!district.isUnlocked) {
      console.log(`Desbloqueando distrito ${districtId}`);
      district.isUnlocked = true;
      await repo.updateDistrict(districtId, district);
    }

    // 6. Buscar si ya existe una relación usuario-distrito
    console.log(`Buscando si ya existe una relación usuario-distrito`);
    const existingUserDistrict = await userDistrictRepository
      .createQueryBuilder("userDistrict")
      .leftJoinAndSelect("userDistrict.district", "district")
      .leftJoinAndSelect("userDistrict.user", "user")
      .where("user.id = :userId", { userId })
      .andWhere("district.id = :districtId", { districtId })
      .getOne();

    let userDistrict;
    // Si no existe, crear una nueva
    if (!existingUserDistrict) {
      console.log(`Creando nueva relación usuario-distrito con color: ${color}`);
      // Crear nuevo objeto UserDistrict
      userDistrict = userDistrictRepository.create({
        color,
        user,
        district
      });
    } else {
      // Si existe, mantener el color actual
      console.log(`Se mantiene la relación existente con color: ${existingUserDistrict.color}`);
      userDistrict = existingUserDistrict;
    }

    // Guardar la relación
    console.log(`Guardando la relación en la base de datos`);
    const savedUserDistrict = await userDistrictRepository.save(userDistrict);

    console.log(`Usuario ${userId} ha pasado por el distrito ${districtId} con color ${savedUserDistrict.color}`);

    return {
      success: true,
      message: `Distrito desbloqueado y asignado al usuario correctamente`,
      userDistrict: savedUserDistrict
    };
  } catch (error) {
    console.error(`Error al simular paso de usuario por distrito:`, error);
    return {
      success: false,
      message: `Error al simular paso de usuario: ${error instanceof Error ? error.message : 'Error desconocido'}`
    };
  }
};

/**
 * Obtiene los distritos desbloqueados por un usuario con sus colores asignados
 * @param userId ID del usuario
 */
export const getUserDistrictsWithColors = async (userId: string): Promise<UserDistrict[]> => {
  try {
    console.log(`Buscando distritos con colores para el usuario ${userId}`);
    const userDistrictRepository = AppDataSource.getRepository(UserDistrict);

    // Realizamos la consulta con relaciones y nos aseguramos de que no haya distritos nulos
    const userDistricts = await userDistrictRepository
      .createQueryBuilder("userDistrict")
      .leftJoinAndSelect("userDistrict.district", "district")
      .leftJoinAndSelect("userDistrict.user", "user")
      .where("user.id = :userId", { userId })
      .getMany();

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