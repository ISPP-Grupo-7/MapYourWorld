import { Request, Response } from 'express';
import * as RegionService from '../services/region.service';

/**
 * Crea una nueva región
 */
export const createRegion = async (req: Request, res: Response): Promise<void> => {
  try {
    const {regionData, mapaId} = req.body; // Pasar tambien el mapId en el cuerpo a la hora de crear una region (map_assignee)

    if (!regionData || !regionData.name || !mapaId) {
      res.status(400).json({ success: false, message: 'Faltan datos necesarios' });
      return;
    }

    const newRegion = await RegionService.createRegion(regionData, mapaId);
    res.status(201).json({ success: true, message: 'Región creada correctamente', region: newRegion });
  } catch (error) {
    console.error('Error al crear la región:', error);
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Error al crear la región' });
  }
};

/**
 * Obtiene una región por su ID
 */
export const getRegionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const regionId = req.params.regionId;
    const region = await RegionService.getRegionById(regionId);

    if (!region) {
      res.status(404).json({ success: false, message: 'Región no encontrada' });
      return;
    }

    res.status(200).json({ success: true, region });
  } catch (error) {
    console.error('Error al obtener la región:', error);
    res.status(500).json({ success: false, message: 'Error al obtener la región' });
  }
};

/**
 * Obtiene una región por su nombre
 */
export const getRegionByName = async (req: Request, res: Response): Promise<void> => {
  try {
    const regionName = req.params.regionName;
    const region = await RegionService.getRegionByName(regionName);

    if (!region) {
      res.status(404).json({ success: false, message: 'Región no encontrada' });
      return;
    }

    res.status(200).json({ success: true, region });
  } catch (error) {
    console.error('Error al obtener la región por nombre:', error);
    res.status(500).json({ success: false, message: 'Error al obtener la región' });
  }
};

/**
 * Obtiene todas las regiones
 */
export const getAllRegions = async (_req: Request, res: Response): Promise<void> => {
  try {
    const regions = await RegionService.getAllRegions();
    res.status(200).json({ success: true, regions });
  } catch (error) {
    console.error('Error al obtener las regiones:', error);
    res.status(500).json({ success: false, message: 'Error al obtener las regiones' });
  }
};

/**
 * Actualiza una región existente
 */
export const updateRegion = async (req: Request, res: Response): Promise<void> => {
  try {
    const regionId = req.params.regionId;
    const updateData = req.body;

    if (!updateData || (!updateData.name && !updateData.description)) {
      res.status(400).json({ success: false, message: 'Faltan datos para actualizar' });
      return;
    }

    const updatedRegion = await RegionService.updateRegion(regionId, updateData);
    if (!updatedRegion) {
      res.status(404).json({ success: false, message: 'Región no encontrada' });
      return;
    }

    res.status(200).json({ success: true, message: 'Región actualizada correctamente', region: updatedRegion });
  } catch (error) {
    console.error('Error al actualizar la región:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar la región' });
  }
};

/**
 * Elimina una región por su ID
 */
export const deleteRegion = async (req: Request, res: Response): Promise<void> => {
    try {
      const regionId = req.params.regionId;
  
      if (!regionId) {
        res.status(400).json({ success: false, message: 'Se requiere el ID de la región' });
        return;
      }
  
      const result = await RegionService.deleteRegion(regionId);
      res.status(200).json({ success: result.success, message: result.message });
    } catch (error) {
      console.error('Error al eliminar la región:', error);
      res.status(500).json({ success: false, message: 'Error al eliminar la región' });
    }
  };