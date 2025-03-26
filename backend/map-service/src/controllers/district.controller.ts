import { Request, Response } from 'express';
import * as DistrictService from '../services/district.service';
import { AppDataSource } from '../../../database/appDataSource';
import { UserDistrict } from '../models/user-district.model';

/**
 * Crea un nuevo distrito
 */


export const createDistrict = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mapId } = req.body;

    if (!mapId) {
      res.status(400).json({ success: false, message: 'Faltan datos necesarios' });
      return;
    }

    await DistrictService.createDistricts(mapId);
    res.status(201).json({ success: true, message: 'Distritos creados correctamente' });
  } catch (error) {
    console.error('Error al crear distrito:', error);
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Error al crear distrito' });
  }
};


/**
 * Obtiene un distrito por su ID
 */
export const getDistrictById = async (req: Request, res: Response): Promise<void> => {
  try {
    const districtId = req.params.districtId;
    const district = await DistrictService.getDistrictById(districtId);

    if (!district) {
      res.status(404).json({ success: false, message: 'Distrito no encontrado' });
      return;
    }

    res.status(200).json({ success: true, district });
  } catch (error) {
    console.error('Error al obtener distrito:', error);
    res.status(500).json({ success: false, message: 'Error al obtener distrito' });
  }
};

/**
 * Obtiene todos los distritos
 */
export const getAllDistricts = async (req: Request, res: Response): Promise<void> => {
  try {
    const districts = await DistrictService.getAllDistricts();

    res.status(200).json({ success: true, districts });
  } catch (error) {
    console.error('Error al obtener distritos:', error);
    res.status(500).json({ success: false, message: 'Error al obtener distritos' });
  }
};

/**
 * Actualiza un distrito
 */
export const updateDistrict = async (req: Request, res: Response): Promise<void> => {
  try {
    const districtId  = req.params.districtId;
    const { updateData, userId } = req.body;

    if (!updateData || !userId) {
      res.status(400).json({ success: false, message: 'Faltan datos para actualizar' });
      return;
    }

    const updatedDistrict = await DistrictService.updateDistrict(districtId, updateData);
    if (!updatedDistrict) {
      res.status(404).json({ success: false, message: 'Distrito no encontrado' });
      return;
    }

    res.status(200).json({ success: true, message: 'Distrito actualizado correctamente', district: updatedDistrict });
  } catch (error) {
    console.error('Error al actualizar distrito:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar distrito' });
  }
};


/**
 * Desbloquea un distrito para un usuario
 */
export const unlockDistrict = async (req: Request, res: Response): Promise<void> => {
  try {
    const districtId  = req.params.districtId;
    const userId  = req.params.userId;
    const regionId = req.params.regionId;
    const { color } = req.body;

    if (!districtId || !userId) {
      res.status(400).json({ success: false, message: 'Faltan datos para desbloquear el distrito' });
      return;
    }

    const result = await DistrictService.unlockDistrict(districtId, userId, regionId, color);
    if (!result.success) {
      res.status(400).json({ success: false, message: result.message });
      return;
    }

    res.status(200).json({ success: true, message: 'Distrito desbloqueado correctamente' });
  } catch (error) {
    console.error('Error al desbloquear distrito:', error);
    res.status(500).json({ success: false, message: 'Error al desbloquear distrito' });
  }
};

/**
 * Obtiene los distritos desbloqueados por un usuario
 */
export const getUserUnlockedDistricts = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId  = req.params.userId;
    const districts = await DistrictService.getUserUnlockedDistricts(userId);

    res.status(200).json({ success: true, districts });
  } catch (error) {
    console.error('Error al obtener distritos desbloqueados:', error);
    res.status(500).json({ success: false, message: 'Error al obtener distritos desbloqueados' });
  }
};

/**
 * Encuentra el distrito que contiene una ubicación geográfica
 */
export const findDistrictContainingLocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const latitude  = req.params.latitude;
    const longitude  = req.params.longitude;

    if (!latitude || !longitude) {
      res.status(400).json({ success: false, message: 'Latitud y longitud son requeridos' });
      return;
    }

    const district = await DistrictService.findDistrictContainingLocation(
      parseFloat(latitude as string),
      parseFloat(longitude as string)
    );

    if (!district) {
      res.status(404).json({ success: false, message: 'No se encontró un distrito para la ubicación' });
      return;
    }

    res.status(200).json({ success: true, district });
  } catch (error) {
    console.error('Error al buscar distrito por ubicación:', error);
    res.status(500).json({ success: false, message: 'Error al buscar distrito por ubicación' });
  }
};

/**
 * Obtiene los distritos asociados a un mapa específico
 */
export const getDistrictsByMapId = async (req: Request, res: Response): Promise<void> => {
  try {
    const mapId = req.params.mapId;
    console.log(`Controlador: Obteniendo distritos para el mapa ${mapId}`);

    if (!mapId) {
      res.status(400).json({ success: false, message: 'Falta el ID del mapa' });
      return;
    }

    try {
      // Intentamos obtener los distritos del mapa
      const districts = await DistrictService.getDistrictsByMapId(mapId);
      console.log(`Controlador: Se encontraron ${districts.length} distritos para el mapa ${mapId}`);
      
      if (districts && districts.length > 0) {
        res.status(200).json({ success: true, districts });
      } else {
        // Si no hay distritos, creamos distritos para el mapa
        console.log(`Controlador: No se encontraron distritos, creando distritos para el mapa ${mapId}`);
        
        // Usamos el mismo userId de ejemplo que en el mapa
        
        // Creamos distritos para el mapa
        try {
          await DistrictService.createDistricts(mapId);
          
          // Obtenemos los distritos recién creados
          const newDistricts = await DistrictService.getDistrictsByMapId(mapId);
          console.log(`Controlador: Se crearon ${newDistricts.length} distritos para el mapa ${mapId}`);
          
          res.status(200).json({ success: true, districts: newDistricts });
        } catch (createError) {
          console.error(`Controlador: Error al crear distritos para el mapa ${mapId}:`, createError);
          
          // En caso de error, obtenemos todos los distritos genéricos como fallback
          console.log(`Controlador: Intentando obtener todos los distritos como fallback`);
          try {
            const allDistricts = await DistrictService.getAllDistricts();
            console.log(`Controlador: Se encontraron ${allDistricts.length} distritos genéricos como fallback`);
            res.status(200).json({ success: true, districts: allDistricts });
          } catch (fallbackError) {
            console.error(`Controlador: Error al obtener distritos de fallback:`, fallbackError);
            // En caso de error total, devolvemos un array vacío pero con éxito
            res.status(200).json({ success: true, districts: [] });
          }
        }
      }
    } catch (error) {
      console.error(`Controlador: Error al obtener/crear distritos para el mapa ${mapId}:`, error);
      
      // En caso de error, obtenemos todos los distritos genéricos como fallback
      console.log(`Controlador: Intentando obtener todos los distritos como fallback`);
      try {
        const allDistricts = await DistrictService.getAllDistricts();
        console.log(`Controlador: Se encontraron ${allDistricts.length} distritos genéricos como fallback`);
        res.status(200).json({ success: true, districts: allDistricts });
      } catch (fallbackError) {
        console.error(`Controlador: Error al obtener distritos de fallback:`, fallbackError);
        // En caso de error total, devolvemos un array vacío pero con éxito
        res.status(200).json({ success: true, districts: [] });
      }
    }
  } catch (error) {
    console.error('Error en el controlador getDistrictsByMapId:', error);
    // Incluso en caso de error crítico, devolvemos un éxito con array vacío
    res.status(200).json({ success: true, districts: [] });
  }
};

/**
 * Desbloquea un distrito en un mapa colaborativo para un usuario específico
 */
export const unlockCollaborativeDistrict = async (req: Request, res: Response): Promise<void> => {
  try {
    const districtId = req.params.districtId;
    const userId = req.params.userId;
    const mapId = req.params.mapId;
    const regionId = req.params.regionId
    
    if (!districtId || !userId || !mapId) {
      res.status(400).json({ success: false, message: 'Faltan datos para desbloquear el distrito' });
      return;
    }

    console.log(`Intentando desbloquear distrito ${districtId} por usuario ${userId} en mapa ${mapId}`);
    
    const result = await DistrictService.unlockCollaborativeDistrict(districtId, userId, mapId, regionId);
    
    if (!result.success) {
      res.status(400).json({ success: false, message: result.message });
      return;
    }
    
    res.status(200).json({ success: true, message: result.message, district: result.district });
  } catch (error) {
    console.error('Error al desbloquear distrito colaborativo:', error);
    res.status(500).json({ success: false, message: 'Error al desbloquear distrito' });
  }
};

/**
 * Simula que un usuario ha pasado por un distrito y le asigna un color
 */
export const simulateUserPassingByDistrict = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, districtId } = req.params;
    const { color, mapId } = req.body;
    
    if (!userId || !districtId) {
      res.status(400).json({ success: false, message: 'Faltan datos necesarios (userId, districtId)' });
      return;
    }
    
    const colorToUse = color || "pepe"; // Si no se proporciona color, se usa "pepe" por defecto
    
    const result = await DistrictService.simulateUserPassingByDistrict(userId, districtId, colorToUse, mapId);
    
    if (!result.success) {
      res.status(400).json({ success: false, message: result.message });
      return;
    }
    
    res.status(200).json({ 
      success: true, 
      message: result.message,
      userDistrict: result.userDistrict
    });
  } catch (error) {
    console.error('Error al simular paso de usuario por distrito:', error);
    res.status(500).json({ success: false, message: 'Error al simular paso de usuario por distrito' });
  }
};

/**
 * Obtiene los distritos con colores para un usuario
 */
export const getUserDistrictsWithColors = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      res.status(400).json({ success: false, message: 'Falta el ID del usuario' });
      return;
    }
    
    const userDistricts = await DistrictService.getUserDistrictsWithColors(userId);
    
    res.status(200).json({ 
      success: true, 
      userDistricts: userDistricts.map(ud => {
        // Verificamos que el district existe antes de acceder a sus propiedades
        if (!ud || !ud.district) {
          console.log("Advertencia: Se encontró un registro sin distrito asociado", ud);
          return {
            id: ud?.id || 'unknown',
            color: ud?.color || 'unknown',
            districtId: null,
            districtName: 'Distrito no disponible',
            isUnlocked: false
          };
        }
        
        return {
          id: ud.id,
          districtId: ud.district.id,
          districtName: ud.district.name,
          color: ud.color,
          isUnlocked: ud.district.isUnlocked
        };
      })
    });
  } catch (error) {
    console.error('Error al obtener distritos con colores:', error);
    res.status(500).json({ success: false, message: 'Error al obtener distritos con colores' });
  }
};

