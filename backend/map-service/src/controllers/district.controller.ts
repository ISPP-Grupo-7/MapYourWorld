import { Request, Response } from 'express';
import * as DistrictService from '../services/district.service';


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
// district.controller.ts: unlockDistrict
export const unlockDistrict = async (req: Request, res: Response): Promise<void> => {
  try {
    const { districtId, userId, regionId } = req.params;
    const { color } = req.body;

    if (!districtId || !userId || !regionId) {
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
 * Obtiene los distritos asociados a un mapa específico
 */
export const getDistrictsByMapId = async (req: Request, res: Response): Promise<void> => {
  const mapId = req.params.mapId;
  console.log(`Controlador: Obteniendo distritos para el mapa ${mapId}`);

  // Validación básica: Si el mapId es nulo, vacío o solo espacios se retorna 400.
  if (!mapId || mapId.trim() === "" || mapId === '""') {
    res.status(400).json({ success: false, message: 'Falta el ID del mapa' });
    return;
  }

  try {
    // Intentamos obtener los distritos del mapa
    const districts = await DistrictService.getDistrictsByMapId(mapId);
    console.log(`Controlador: Se encontraron ${districts.length} distritos para el mapa ${mapId}`);

    if (districts && districts.length > 0) {
      res.status(200).json({ success: true, districts });
      return;
    }

    // Si no hay distritos, se intenta crearlos
    console.log(`Controlador: No se encontraron distritos, creando distritos para el mapa ${mapId}`);
    try {
      await DistrictService.createDistricts(mapId);
      
      // Se vuelven a obtener los distritos recién creados
      const newDistricts = await DistrictService.getDistrictsByMapId(mapId);
      console.log(`Controlador: Se crearon ${newDistricts.length} distritos para el mapa ${mapId}`);
      
      res.status(200).json({ success: true, districts: newDistricts });
      return;
    } catch (createError) {
      console.error(`Controlador: Error al crear distritos para el mapa ${mapId}:`, createError);
      
      // Fallback: Intentamos obtener todos los distritos genéricos
      try {
        const allDistricts = await DistrictService.getAllDistricts();
        console.log(`Controlador: Se encontraron ${allDistricts.length} distritos genéricos como fallback`);
        res.status(200).json({ success: true, districts: allDistricts });
        return;
      } catch (fallbackError) {
        console.error(`Controlador: Error al obtener distritos de fallback:`, fallbackError);
        res.status(500).json({ success: false, message: 'Error al obtener distritos de fallback' });
        return;
      }
    }
  } catch (error) {
    console.error(`Controlador: Error al obtener/crear distritos para el mapa ${mapId}:`, error);
    // En caso de error general, se retorna un 500 o se decide una estrategia de fallback similar
    try {
      const allDistricts = await DistrictService.getAllDistricts();
      console.log(`Controlador: Se encontraron ${allDistricts.length} distritos genéricos como fallback`);
      res.status(200).json({ success: true, districts: allDistricts });
      return;
    } catch (fallbackError) {
      console.error(`Controlador: Error al obtener distritos de fallback:`, fallbackError);
      res.status(500).json({ success: false, message: 'Error al obtener distritos de fallback' });
      return;
    }
  }
};



/**
 * Obtiene los distritos con colores para un usuario
 */
// district.controller.ts: getUserDistrictsWithColors
export const getUserDistrictsWithColors = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    if (!userId || userId.trim() === "" || userId === '""') {
      res.status(400).json({ success: false, message: 'Falta el ID del usuario' });
      return;
    }
    const userDistricts = await DistrictService.getUserDistrictsWithColors(userId);
    res.status(200).json({ 
      success: true, 
      userDistricts: userDistricts.map(ud => ({
        id: ud.id,
        districtId: ud.district?.id || null,
        districtName: ud.district?.name || 'Distrito no disponible',
        color: ud.color,
        isUnlocked: ud.district?.isUnlocked || false,
      }))
    });
  } catch (error) {
    console.error('Error al obtener distritos con colores:', error);
    res.status(500).json({ success: false, message: 'Error al obtener distritos con colores' });
  }
};

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
